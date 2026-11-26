import { reservedTotal, validateNearbyLedger } from './nearby-test-limits.mjs';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateImage } from './menu-ai.mjs';

export const TEST_LIMITS = Object.freeze({ testers: 12, perDay: 2, days: 25, total: 600, photos: 1, characters: 5000 });
// Reserve the whole job before OCR, even if it fails. At the checked list prices:
// OCR $0.0015 + Text Search Enterprise $0.035 + Details Enterprise $0.020
// + five photos $0.035 + one static map $0.002 + NMT $0.10 = $0.1935.
// Confirmed website menus may use at most two additional OCR images ($0.003).
// The combined $0.1965 stays inside the EXISTING $0.20 reservation. HTML/PDF
// reads are bounded separately; this is not a cap on Cloud Run/network costs.
// No free credits assumed. Not a Cloud billing cap.
export const JOB_RESERVATION_MICRO_USD = 200_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const operations = ['ocr', 'search', 'details', 'translate'];
const fail = (status, message) => Object.assign(new Error(message), { status });
const koreanDay = now => new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function testPolicy(env) {
  const startDate = env.MENU_TEST_START_DATE ?? '';
  const start = Date.parse(`${startDate}T00:00:00+09:00`);
  const ids = (env.MENU_TEST_PROFILE_IDS ?? '').split(',').map(id => id.trim().toLowerCase()).filter(Boolean);
  const budget = Number(env.MENU_TEST_BUDGET_USD ?? 125);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(startDate) && Number.isFinite(start) && koreanDay(start) === startDate &&
    ids.length > 0 && ids.length <= TEST_LIMITS.testers && new Set(ids).size === ids.length && ids.every(id => uuid.test(id)) &&
    Number.isFinite(budget) && budget > 0 && budget <= 125;
  const policy = { start, end: start + TEST_LIMITS.days * 86400000, ids, budgetMicroUsd: Math.floor(budget * 1_000_000) };
  return { ...policy, valid, fingerprint: createHash('sha256').update(JSON.stringify({ ...policy, ids: [...ids].sort() })).digest('hex') };
}

function payloadFor(operation, input) {
  const data = input ?? {};
  if (operation === 'ocr') {
    if (data.consent !== true) throw fail(400, '메뉴판 사진 전송 동의가 필요해요.');
    // Do not accept batches, remote URLs, PDFs, or feature lists from clients.
    if (data.images !== undefined || data.photos !== undefined) throw fail(400, '테스트에서는 메뉴판 사진 1장씩 분석할 수 있어요.');
    const mime = validateImage(data.imageBase64);
    return { imageBase64: data.imageBase64, mime, feature: 'DOCUMENT_TEXT_DETECTION' };
  }
  if (operation === 'search') {
    if (typeof data.query !== 'string' || !data.query.trim() || data.query.length > 200) throw fail(400, '식당 검색어를 확인해 주세요.');
    return { query: data.query.trim(), fields: ['places.id', 'places.displayName', 'places.formattedAddress', 'places.location', 'places.googleMapsUri', 'places.primaryTypeDisplayName', 'places.currentOpeningHours', 'places.photos', 'places.attributions'] };
  }
  if (operation === 'details') {
    if (typeof data.placeId !== 'string' || !/^[A-Za-z0-9_-]{1,300}$/.test(data.placeId) || data.confirmed !== true) throw fail(400, '찾은 식당이 맞는지 먼저 확인해 주세요.');
    return { placeId: data.placeId, fields: ['id', 'websiteUri'], preferWebsite: data.preferWebsite === true };
  }
  if (operation === 'translate') {
    if (typeof data.text !== 'string' || !data.text.trim()) throw fail(400, '번역할 메뉴를 확인해 주세요.');
    // Google counts Unicode code points, including spaces. Do not silently truncate.
    if (Array.from(data.text).length > TEST_LIMITS.characters) throw fail(413, '한 메뉴판에서 번역할 수 있는 글자는 5,000자까지예요.');
    return { text: data.text, targetLanguage: 'ko', model: 'nmt' };
  }
  throw fail(400, '지원하지 않는 메뉴 처리 요청이에요.');
}

export class MenuTestLimits {
  constructor({ file, env = process.env, now = Date.now, providers = {}, ledger }) {
    this.file = file;
    this.env = env;
    this.now = now;
    this.providers = providers;
    this.ledger=ledger;
    // A local file is NOT a shared Cloud Run quota store. Fail closed there until
    // a transactional shared ledger and durable identity registry are installed.
    this.storageAllowed = ledger?.shared===true || (!env.K_SERVICE && !env.K_REVISION && env.NODE_ENV !== 'production');
  }

  check(id) {
    const policy = testPolicy(this.env);
    if (!this.storageAllowed || this.env.MENU_TEST_ENABLED !== 'true' || !policy.valid) throw fail(503, '테스트 일정과 참가자 등록을 준비 중이에요. API는 호출하지 않았어요.');
    if (typeof id !== 'string' || !policy.ids.includes(id.toLowerCase())) throw fail(403, '등록된 테스트 참가자만 사용할 수 있어요.');
    const now = this.now();
    if (now < policy.start) throw fail(403, '아직 테스트 시작 전이에요.');
    if (now >= policy.end) throw fail(403, '25일 테스트 기간이 종료됐어요.');
    return policy;
  }

  status(id) {
    try {
      const policy = this.check(id);
      if (!this.providers.ocr || !this.providers.translate) return { ready: false, message: 'Google 연결 키를 준비 중이에요.' };
      return this.transaction(policy, ledger => {
        const day = policy.day ?? koreanDay(this.now());
        const used = ledger.jobs.filter(job => job.id === id.toLowerCase() && job.day === day).length;
        const available = ledger.jobs.length < TEST_LIMITS.total && reservedTotal(ledger) + JOB_RESERVATION_MICRO_USD <= policy.budgetMicroUsd;
        const remaining = available ? Math.max(0, TEST_LIMITS.perDay - used) : 0;
        return { ready: remaining > 0, remaining, message: remaining > 0 ? '' : '오늘 사용할 수 있는 분석 횟수를 모두 사용했어요.' };
      });
    } catch (error) {
      return { ready: false, message: error.status ? error.message : '사용량을 확인하지 못했어요.' };
    }
  }

  transaction(policy, fn) {
    if(this.ledger)return this.ledger.transaction(ledger=>{this.validateLedger(ledger,policy);return fn(ledger);});
    mkdirSync(dirname(this.file), { recursive: true });
    const lock = this.file + '.lock';
    try { mkdirSync(lock); } catch { throw fail(503, '사용량을 확인 중이에요. 잠시 후 다시 시도해 주세요.'); }
    try {
      let ledger;
      try {
        ledger = existsSync(this.file) ? JSON.parse(readFileSync(this.file, 'utf8')) : { version: 1, policy: policy.fingerprint, jobs: [] };
      } catch { throw fail(503, '사용량 기록을 확인하지 못해 API 호출을 중단했어요.'); }
      this.validateLedger(ledger,policy);
      const result = fn(ledger);
      writeFileSync(this.file + '.tmp', JSON.stringify(ledger), { mode: 0o600 });
      renameSync(this.file + '.tmp', this.file);
      return result;
    } finally { rmdirSync(lock); }
  }

  validateLedger(ledger,policy) {
    if (!validateNearbyLedger(ledger) || ledger.version !== 1 || ledger.policy !== policy.fingerprint || !Array.isArray(ledger.jobs) || ledger.jobs.length > TEST_LIMITS.total ||
      !ledger.jobs.every(job => job && uuid.test(job.id) && uuid.test(job.requestId) && /^\d{4}-\d{2}-\d{2}$/.test(job.day) && job.reserved === JOB_RESERVATION_MICRO_USD &&
        job.operations && Object.entries(job.operations).every(([name, status]) => operations.includes(name) && ['pending', 'done', 'failed'].includes(status)))) {
      throw fail(503, '테스트 설정 또는 사용량 기록이 바뀌어 호출을 중단했어요.');
    }
  }

  async process({ id, requestId, operation, payload }) {
    const policy = this.check(id);
    id = id.toLowerCase();
    if (typeof requestId !== 'string' || !uuid.test(requestId)) throw fail(400, '메뉴판 요청 정보를 확인해 주세요.');
    requestId = requestId.toLowerCase();
    const safePayload = payloadFor(operation, payload);
    const provider = this.providers[operation];
    if (typeof provider !== 'function') throw fail(503, 'API 연결을 준비 중이에요. 사용 횟수는 차감되지 않았어요.');
    await this.transaction(policy, ledger => {
      let job = ledger.jobs.find(item => item.id === id && item.requestId === requestId);
      if (!job) {
        if (operation !== 'ocr') throw fail(409, '먼저 메뉴판 사진의 글자를 읽어 주세요.');
        const day = policy.day ?? koreanDay(this.now());
        if (ledger.jobs.filter(item => item.id === id && item.day === day).length >= TEST_LIMITS.perDay) throw fail(429, '오늘은 메뉴판 2개를 모두 분석했어요. 내일 다시 이용해 주세요.');
        if (ledger.jobs.length >= TEST_LIMITS.total) throw fail(429, '전체 테스트 한도인 600회에 도달했어요.');
        if (reservedTotal(ledger) + JOB_RESERVATION_MICRO_USD > policy.budgetMicroUsd) throw fail(429, '테스트 API 비용 한도에 도달했어요.');
        job = { id, requestId, day, reserved: JOB_RESERVATION_MICRO_USD, operations: {} };
        ledger.jobs.push(job);
      }
      if (job.operations[operation]) throw fail(409, '이미 요청한 처리예요. 중복 API 호출은 하지 않았어요.');
      if (operation !== 'ocr' && job.operations.ocr !== 'done') throw fail(409, '메뉴판 글자 인식이 완료된 후 이용해 주세요.');
      if (operation === 'details' && job.operations.search !== 'done') throw fail(409, '식당 검색을 먼저 완료해 주세요.');
      if (operation === 'details' && !job.candidatePlaceIds?.includes(safePayload.placeId)) throw fail(400, '검색 결과에 있는 식당을 선택해 주세요.');
      job.operations[operation] = 'pending';
    });
    // Reservation is durable before network I/O. No implicit retry, including
    // ambiguous failures. Search is bounded to one query, five photos and one map;
    // details may additionally read a bounded website menu and OCR <=2 images.
    // Translation remains one request / 5,000 characters; clients cannot expand it.
    try {
      const result = await provider(safePayload);
      await this.transaction(policy, ledger => {
        const job = ledger.jobs.find(job => job.id === id && job.requestId === requestId);
        job.operations[operation] = 'done';
        if (operation === 'search') job.candidatePlaceIds = (result.places ?? []).slice(0,5).map(place => place.id);
      });
      return result;
    } catch {
      await this.transaction(policy, ledger => {
        ledger.jobs.find(job => job.id === id && job.requestId === requestId).operations[operation] = 'failed';
      });
      throw fail(502, '처리를 완료하지 못했어요. 중복 과금을 막기 위해 자동 재시도하지 않았어요.');
    }
  }
}
