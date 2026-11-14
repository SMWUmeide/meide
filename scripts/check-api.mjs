import { URL } from 'node:url';
import { loadEnv } from 'vite';

const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
let failed = false;
const report = (ok, message) => { console.log(`${ok ? '✓' : '!'} ${message}`); if (!ok) failed = true; };
report(Boolean(env.GEMINI_API_KEY?.trim()), '로컬 Gemini 서버 키 설정 (값은 출력하지 않아요)');
report(Boolean(env.PEXELS_API_KEY?.trim()), '음식 사진 검색 서버 키 설정 (값은 출력하지 않아요)');
report(Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY), 'Supabase 공개 연결 설정');
const origins = (env.NATIVE_APP_ORIGINS || '').split(',').map(value => value.trim());
report(origins.includes('https://localhost'), 'Android 앱 origin 허용');
let base = 'http://127.0.0.1:5173';
if (env.VITE_API_BASE_URL?.trim()) {
  try {
    const url = new URL(env.VITE_API_BASE_URL.trim());
    const valid = url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
    report(valid, '외부 API 서버 주소 형식');
    if (valid) base = url.origin;
  } catch { report(false, '외부 API 서버 주소 형식'); }
} else console.log('· 외부 서버 주소 미정: 웹은 로컬 API를 사용해요. Android 실연결 전에는 HTTPS 주소가 필요해요.');
if (process.argv.includes('--probe')) {
  for (const endpoint of ['analyze-menu', 'translate-request', 'menu-photos']) {
    try {
      const response = await globalThis.fetch(`${base}/api/${endpoint}`, { method: 'OPTIONS', headers: { Origin: 'https://localhost', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type' }, signal: globalThis.AbortSignal.timeout(5000) });
      report(response.status === 204 && response.headers.get('Access-Control-Allow-Origin') === 'https://localhost', `${endpoint}: Android 사전 요청 연결`);
    } catch { report(false, `${endpoint}: 서버에 연결하지 못했어요. 개발 서버 또는 외부 서버를 확인해 주세요.`); }
  }
  console.log('· 유료 AI 요청은 보내지 않았어요. 키의 유효성은 실제 분석·번역 요청으로 별도 확인해야 해요.');
}
process.exitCode = failed ? 1 : 0;
