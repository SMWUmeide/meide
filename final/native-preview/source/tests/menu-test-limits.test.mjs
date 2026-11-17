import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MenuTestLimits, TEST_LIMITS } from '../server/menu-test-limits.mjs';
import { createApp } from '../server/app.mjs';
import { InviteStore } from '../server/invite-store.mjs';
import { createGoogleMenuProviders } from '../server/google-menu.mjs';
import { restaurantMenuPatch } from '../src/features/menu-camera/menu-source.ts';

const imageBase64 = Buffer.from([255,216,255,224,0,0,0,0,255,217]).toString('base64');
const photo = { consent: true, imageBase64 };
function setup(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'meide-test-limits-'));
  const ids = Array.from({ length: 12 }, () => randomUUID());
  const env = { MENU_TEST_ENABLED: 'true', MENU_TEST_START_DATE: '2026-11-15', MENU_TEST_PROFILE_IDS: ids.join(','), MENU_TEST_BUDGET_USD: '125', ...overrides };
  const clock = { now: Date.parse('2026-11-15T00:00:00+09:00') };
  const calls = [];
  const providers = Object.fromEntries(['ocr','search','details','translate'].map(operation => [operation, async payload => { calls.push({ operation, payload }); return operation === 'search' ? {places:[{id:'example'}]} : { text: 'example' }; }]));
  const options = { file: join(dir, 'usage.json'), env, now: () => clock.now, providers };
  return { dir, ids, env, clock, calls, options, limiter: new MenuTestLimits(options), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
const scan = (s, extra = {}) => ({ id: s.ids[0], requestId: randomUUID(), operation: 'ocr', payload: photo, ...extra });

test('status checks do not use providers or consume quota and reflect daily exhaustion', async () => {
  const s = setup();
  try {
    assert.deepEqual(s.limiter.status(s.ids[0]), {ready:true,remaining:2,message:''});
    assert.equal(s.calls.length,0);
    await s.limiter.process(scan(s));
    assert.equal(s.limiter.status(s.ids[0]).remaining,1);
    await s.limiter.process(scan(s));
    assert.equal(s.limiter.status(s.ids[0]).ready,false);
    assert.equal(new MenuTestLimits({...s.options,providers:{}}).status(s.ids[1]).ready,false);
    assert.equal(s.calls.length,2);
  } finally { s.cleanup(); }
});

test('unconfigured testers, disabled, invalid config, production and Cloud Run fail closed', async () => {
  for (const overrides of [{ MENU_TEST_ENABLED:'false' }, { MENU_TEST_PROFILE_IDS:'' }, { MENU_TEST_START_DATE:'2026-02-30' }, { MENU_TEST_BUDGET_USD:'NaN' }, { MENU_TEST_BUDGET_USD:'126' }, { K_SERVICE:'meide' }, { NODE_ENV:'production' }]) {
    const s = setup(overrides);
    try { await assert.rejects(s.limiter.process(scan(s)), e => e.status === 503); assert.equal(s.calls.length, 0); } finally { s.cleanup(); }
  }
  const s = setup();
  try {
    s.env.MENU_TEST_PROFILE_IDS += ',' + randomUUID();
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 503);
    s.env.MENU_TEST_PROFILE_IDS = [s.ids[0],s.ids[0]].join(',');
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 503);
  } finally { s.cleanup(); }
});

test('only allowlisted users; exact 25-day window starts Nov 15 and ends Dec 10 KST', async () => {
  const s = setup();
  try {
    await assert.rejects(s.limiter.process(scan(s, { id: randomUUID() })), e => e.status === 403);
    s.clock.now = Date.parse('2026-11-14T23:59:59+09:00');
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 403);
    s.clock.now = Date.parse('2026-11-15T00:00:00+09:00');
    await s.limiter.process(scan(s));
    s.clock.now = Date.parse('2026-12-09T23:59:59+09:00');
    await s.limiter.process(scan(s));
    s.clock.now = Date.parse('2026-12-10T00:00:00+09:00');
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 403);
    assert.equal(s.calls.length, 2);
  } finally { s.cleanup(); }
});

test('two per Korean day survives restart; UTC midnight does not reset it', async () => {
  const s = setup();
  try {
    await s.limiter.process(scan(s));
    s.clock.now = Date.parse('2026-11-15T00:00:00Z');
    const restarted = new MenuTestLimits(s.options);
    await restarted.process(scan(s));
    await assert.rejects(restarted.process(scan(s)), e => e.status === 429);
    s.clock.now = Date.parse('2026-11-15T15:00:00Z');
    await restarted.process(scan(s));
    assert.equal(s.calls.length, 3);
  } finally { s.cleanup(); }
});

test('simultaneous requests across limiter instances cannot bypass reservations', async () => {
  const s = setup();
  try {
    const results = await Promise.allSettled(Array.from({length:10}, () => new MenuTestLimits(s.options).process(scan(s))));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 2);
    assert.equal(s.calls.length, 2);
  } finally { s.cleanup(); }
});

test('full 12-person 25-day pilot is 600 jobs and reserves $120 without resetting in December', async () => {
  const s = setup();
  try {
    const start = s.clock.now;
    for (let day = 0; day < 25; day++) {
      s.clock.now = start + day * 86400000;
      for (const id of s.ids) {
        await s.limiter.process(scan(s, {id}));
        await s.limiter.process(scan(s, {id}));
      }
    }
    const ledger = JSON.parse(readFileSync(s.options.file, 'utf8'));
    assert.equal(ledger.jobs.length, TEST_LIMITS.total);
    assert.equal(ledger.jobs.reduce((sum, job) => sum + job.reserved, 0), 120_000_000);
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 429);
    assert.equal(s.calls.length, 600);
  } finally { s.cleanup(); }
});

test('duplicate operations and uncertain failures never retry or refund the budget', async () => {
  const s = setup({MENU_TEST_BUDGET_USD:'0.20'});
  try {
    const input = scan(s);
    s.options.providers.ocr = async () => { s.calls.push('attempt'); throw Error('network timeout'); };
    await assert.rejects(s.limiter.process(input), e => e.status === 502);
    await assert.rejects(new MenuTestLimits(s.options).process(input), e => e.status === 409);
    await assert.rejects(s.limiter.process(scan(s, {id:s.ids[1]})), e => e.status === 429);
    assert.equal(s.calls.length, 1);
  } finally { s.cleanup(); }
});

test('operation boundaries, 5000 code points, fixed NMT/fields, no batches or URLs', async () => {
  const s = setup();
  try {
    const input = scan(s);
    for (const payload of [{...photo,photos:[photo]}, {...photo,imageBase64:'https://example.com/menu.png'}, {...photo,consent:false}]) {
      await assert.rejects(s.limiter.process({...input,payload}), e => e.status === 400);
    }
    await assert.rejects(s.limiter.process({...input,operation:'translate',payload:{text:'pasta'}}), e => e.status === 409);
    await s.limiter.process(input);
    await assert.rejects(s.limiter.process(input), e => e.status === 409);
    await assert.rejects(s.limiter.process({...input,operation:'details',payload:{placeId:'example',confirmed:true}}), e => e.status === 409);
    await s.limiter.process({...input,operation:'search',payload:{query:'Example restaurant',fields:['*']}});
    assert.equal(s.calls.at(-1).payload.fields.includes('*'),false);
    await assert.rejects(s.limiter.process({...input,operation:'details',payload:{placeId:'unrelated',confirmed:true}}), e => e.status === 400);
    await s.limiter.process({...input,operation:'details',payload:{placeId:'example',confirmed:true}});
    await assert.rejects(s.limiter.process({...input,operation:'translate',payload:{text:'a'.repeat(5001)}}), e => e.status === 413);
    await s.limiter.process({...input,operation:'translate',payload:{text:'🍝'.repeat(5000),targetLanguage:'fr',model:'llm'}});
    assert.equal(s.calls.at(-1).payload.targetLanguage,'ko');
    assert.equal(s.calls.at(-1).payload.model,'nmt');
    await assert.rejects(s.limiter.process({...input,operation:'translate',payload:{text:'second menu'}}), e => e.status === 409);
    assert.equal(s.calls.length,4);
  } finally { s.cleanup(); }
});

test('missing provider does not consume quota, damaged ledger and changed roster stop calls', async () => {
  const s = setup();
  try {
    await assert.rejects(new MenuTestLimits({...s.options,providers:{}}).process(scan(s)), e => e.status === 503);
    await s.limiter.process(scan(s));
    const calls = s.calls.length;
    s.env.MENU_TEST_PROFILE_IDS = s.ids.slice(0,11).join(',');
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 503);
    s.env.MENU_TEST_PROFILE_IDS = s.ids.join(',');
    writeFileSync(s.options.file, 'corrupted');
    await assert.rejects(s.limiter.process(scan(s)), e => e.status === 503);
    assert.equal(s.calls.length,calls);
  } finally { s.cleanup(); }
});

test('HTTP authenticates before quotas and uses verified identity, not a claimed tester ID', async () => {
  const s = setup();
  const token = randomUUID();
  const store = new InviteStore(join(s.dir, 'invites.json'));
  store.register({id:s.ids[0],token,name:'테스터'});
  const app = createApp({store,webRoot:s.dir,menuTest:s.limiter});
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const post = body => fetch(`http://127.0.0.1:${app.address().port}/api/menu/process`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    assert.equal((await post({...scan(s),token:randomUUID()})).status,401);
    assert.equal(s.calls.length,0);
    assert.equal((await post({...scan(s),token})).status,200);
    assert.equal((await post({...scan(s),token})).status,200);
    assert.equal((await post({...scan(s),token})).status,429);
    assert.equal(s.calls.length,2);
  } finally {
    await new Promise(resolve => app.close(resolve));
    s.cleanup();
  }
});

test('HTTP confirmed restaurant prefers website, falls back to photo, translates once, and keeps the same reservation', async () => {
  const s = setup(); const token = randomUUID(); const store = new InviteStore(join(s.dir,'invites.json'));
  store.register({id:s.ids[0],token,name:'테스터'});
  let found = true, webCalls = 0; const translations = [];
  const photoText = 'Photographed Pasta €15\nSalad €8';
  const webText = 'Website Pasta €13\nSalad €7';
  const providers = createGoogleMenuProviders({env:{GOOGLE_MENU_API_KEY:'test-only'},fetchImpl:async (url,options)=>{
    if(url.includes('vision.'))return Response.json({responses:[{fullTextAnnotation:{text:photoText}}]});
    if(url.includes('searchText'))return Response.json({places:[{id:'example',displayName:{text:'Restaurant'}}]});
    if(url.includes('translation.')){translations.push(JSON.parse(options.body).q);return Response.json({data:{translations:[{translatedText:'번역 결과'}]}});}
    return Response.json({websiteUri:'https://restaurant.example/'});
  },websiteReader:async()=>{webCalls++;return found?{status:'found',source:'website',text:webText,url:'https://restaurant.example/menu',partial:false}:{status:'unavailable',source:'photo'};}});
  const limiter = new MenuTestLimits({...s.options,providers});
  const app=createApp({store,webRoot:s.dir,menuTest:limiter});
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  const post=(requestId,operation,payload)=>fetch(`http://127.0.0.1:${app.address().port}/api/menu/process`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:s.ids[0],token,requestId,operation,payload})});
  try {
    for(const success of [true,false]) {
      found=success;const requestId=randomUUID();
      assert.equal((await post(requestId,'details',{placeId:'example',confirmed:true,preferWebsite:true})).status,409);
      const ocr=await (await post(requestId,'ocr',photo)).json();
      await post(requestId,'search',{query:'Restaurant'});
      assert.equal((await post(requestId,'details',{placeId:'unrelated',confirmed:true,preferWebsite:true})).status,400);
      const detail=await (await post(requestId,'details',{placeId:'example',confirmed:true,preferWebsite:true,websiteUri:'https://attacker.example'})).json();
      const selected=restaurantMenuPatch({originalText:ocr.result.text},detail.result);
      assert.equal(selected.originalText,success?webText:photoText);
      assert.equal((await post(requestId,'translate',{text:selected.originalText})).status,200);
      assert.equal((await post(requestId,'details',{placeId:'example',confirmed:true,preferWebsite:true})).status,409);
      assert.equal((await post(requestId,'translate',{text:'retry'})).status,409);
    }
    assert.deepEqual(translations,[webText,photoText]);assert.equal(webCalls,2);
    const ledger=JSON.parse(readFileSync(s.options.file,'utf8'));
    assert.equal(ledger.jobs.length,2);assert.equal(ledger.jobs.reduce((n,j)=>n+j.reserved,0),400000);
    assert.equal((await post(randomUUID(),'ocr',photo)).status,429);
  } finally {await new Promise(resolve=>app.close(resolve));s.cleanup();}
});
