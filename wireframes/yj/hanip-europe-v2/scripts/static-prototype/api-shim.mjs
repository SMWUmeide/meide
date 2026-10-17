// GitHub Pages용 정적 프로토타입에서 서버 API(/api/*)를 브라우저 안에서 대신 처리합니다.
// 원본 서버 로직은 lib/cloud-api.ts — 이 파일은 그 동작을 그대로 흉내 냅니다.
import {createSharedCarts} from './lib/shared-cart.js';
import {searchDestinations} from './lib/destination-search.js';
import {createExchangeRates} from './lib/exchange-rates.js';
import {citySearch} from './lib/cloud-cities.js';

const realFetch = window.fetch.bind(window);
const here = new URL('.', import.meta.url);
const dataURL = name => new URL('data/' + name, here).href;
const jsonCache = new Map();
const loadJSON = name => {
  if (!jsonCache.has(name)) jsonCache.set(name, realFetch(dataURL(name)).then(r => { if (!r.ok) throw Error('메뉴 데이터를 불러오지 못했어요.'); return r.json(); }).catch(e => { jsonCache.delete(name); throw e; }));
  return jsonCache.get(name);
};

// 원본은 Cloudflare D1(공유 DB)을 쓰지만, 정적 사이트에서는 이 기기의 localStorage에 저장합니다.
// 같은 폰·같은 브라우저의 다른 탭끼리만 함께 담기가 공유됩니다.
const KEY = 'hanip-static-rooms';
const readRooms = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const writeRooms = rooms => { try { localStorage.setItem(KEY, JSON.stringify(rooms)); } catch {} };
const localDB = {
  prepare(sql) {
    return {
      bind(...args) {
        return {
          async run() {
            const rooms = readRooms();
            if (sql.startsWith('INSERT')) {
              const [id, data, updated, version] = args;
              if (rooms[id]) return {meta: {changes: 0}};
              rooms[id] = {data, updated, version}; writeRooms(rooms); return {meta: {changes: 1}};
            }
            if (sql.startsWith('UPDATE')) {
              const [data, updated, version, id, previous] = args;
              if (!rooms[id] || rooms[id].version !== previous) return {meta: {changes: 0}};
              rooms[id] = {data, updated, version}; writeRooms(rooms); return {meta: {changes: 1}};
            }
            throw Error('지원하지 않는 요청이에요.');
          },
          async first() {
            const row = readRooms()[String(args[0])];
            return row ? {data: row.data, updated: row.updated} : null;
          }
        };
      }
    };
  }
};
const carts = createSharedCarts(localDB);
const exchange = createExchangeRates(realFetch);
const fallbackRates = {EUR: 1600, CHF: 1700, GBP: 1850, CZK: 64, HUF: 4, PLN: 375, DKK: 215, SEK: 140, NOK: 135};
const cities = citySearch({ASSETS: {fetch: req => realFetch(new URL('cities/' + new URL(req.url).pathname.split('/cities/')[1], new URL('../public/', here)).href)}}, location.origin);

// 프로토타입 시연용: 메뉴판이 공유되면 동반인(김미영)이 메뉴 2개를 이미 담은 상태로 보여줍니다.
// (실제로는 초대 링크로 들어온 사람이 담지만, 정적 사이트에서는 두 번째 기기가 없기 때문입니다.)
const companionPicks = ['ZUPPA DI ZUCCA E FARRO', "OSSOBUCO DI CHIANINA E PURE' DI PATATE"];
async function seedCompanionCart(roomId) {
  const row = readRooms()[String(roomId)];
  if (!row) return;
  const room = JSON.parse(row.data), companion = room.members.find(m => m.id === 'companion');
  if (!companion || !room.menu) return;
  for (const original of companionPicks) {
    const item = room.menu.items.find(i => i.original === original);
    if (item) await carts.handle('delta', {roomId, token: companion.token, itemId: item.id, delta: 1, operationId: 'demo-' + item.id});
  }
}

async function handle(path, b) {
  if (path === '/api/config') return {usabilityTest: true, freeMode: true, gemini: false, vision: false, places: false, imageSearch: false, staticPrototype: true};
  if (path === '/api/usability-menu') return loadJSON('usability-menu.json');
  if (path === '/api/restaurant-catalog') return loadJSON('restaurant-catalog.json');
  if (path === '/api/exchange-rate') {
    try { return await exchange(b.currency); }
    catch (e) { const rate = fallbackRates[b.currency]; if (!rate) throw e; return {currency: b.currency, rate, date: '2026-10-17', source: '고정 환율(오프라인 프로토타입)'}; }
  }
  if (path === '/api/destinations') return searchDestinations(b, realFetch, cities);
  if (path.startsWith('/api/shared/')) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const action = path.slice('/api/shared/'.length), result = await carts.handle(action, b);
        if (action === 'menu') await seedCompanionCart(b.roomId);
        return result;
      }
      catch (e) { if (e.message !== 'CART_CONFLICT') throw e; }
    }
    throw Error('다른 화면에서 변경 중이에요. 잠시 후 다시 시도해주세요.');
  }
  if (path === '/api/places') return {places: [], unavailable: true, message: '테스트에서는 Osteria La Solita Zuppa 메뉴를 사용해요. 식당 확인 화면으로 돌아가주세요.'};
  if (path === '/api/translate-order') throw Error('추가 요청사항의 자동 번역은 연결되어 있지 않아요. 기본 주문 문장과 읽는 방법을 이용해주세요.');
  throw Error('이 사용성 테스트에서는 사진을 AI로 전송하지 않습니다.');
}

window.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  const i = url.pathname.indexOf('/api/');
  if (url.origin !== location.origin || i < 0 || url.pathname.startsWith('/api/photo')) return realFetch(input, init);
  const path = url.pathname.slice(i);
  let body = {};
  try { body = init.body ? JSON.parse(init.body) : {}; } catch {}
  try {
    const result = await handle(path, body);
    return new Response(JSON.stringify(result), {status: 200, headers: {'Content-Type': 'application/json'}});
  } catch (e) {
    return new Response(JSON.stringify({error: e.message}), {status: 400, headers: {'Content-Type': 'application/json'}});
  }
};
