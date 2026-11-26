import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../server/app.mjs';
import { createPlayReviewNearby } from '../server/play-review-nearby.mjs';

test('review access uses its own daily quota and only applies to nearby search', async t => {
  const code = 'review_test_only_xxxxxxxxxxxxxxxxxxxxxxxxxx';
  const codeHash = createHash('sha256').update(code).digest('hex');
  const usage = { jobs: [{ reserved: 200000 }] };
  let now = Date.parse('2026-11-19T03:00:00Z');
  let calls = 0;
  let authentications = 0;
  const playReviewNearby = createPlayReviewNearby({
    codeHash,
    ledger: { shared: true, transaction: change => change(usage) },
    provider: async ({ latitude }) => { calls++; return { latitude }; },
    now: () => now,
  });
  assert.equal(createPlayReviewNearby({}), null);
  assert.throws(() => createPlayReviewNearby({ codeHash }));
  const server = createApp({
    webRoot: '.', playReviewNearby, menuTest: {}, nearbyTest: {},
    store: { authenticate() { authentications++; throw Object.assign(Error('Missing credentials'), { status: 401 }); } },
    webMaps: {},
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const id = randomUUID();
  const review = { id, reviewCode: code };
  const status = '/api/restaurants/status';
  const search = '/api/restaurants/nearby';
  const request = { ...review, requestId: randomUUID(), latitude: 43.77, longitude: 11.25, radius: 500, consent: true };
  assert.equal((await post(status, { id })).status, 401);
  assert.equal((await post(status, { ...review, reviewCode: code + 'a' })).status, 403);
  assert.equal((await post(status, { ...review, id: 'invalid' })).status, 400);
  assert.equal((await post('/api/menu/status', review)).status, 401);
  assert.equal((await post('/api/restaurants/map-access', review)).status, 401);
  assert.equal(authentications, 3);
  assert.equal((await (await post(status, review)).json()).remaining, 2);
  assert.deepEqual(await (await post(search, request)).json(), { result: { latitude: 43.77 } });
  assert.equal((await post(search, request)).status, 409);
  assert.equal((await post(search, { ...request, requestId: randomUUID() })).status, 200);
  assert.equal((await post(search, { ...request, requestId: randomUUID() })).status, 429);
  for (let i = 0; i < 6; i++) {
    assert.equal((await post(search, { ...request, id: randomUUID(), requestId: randomUUID() })).status, 200);
  }
  assert.equal((await post(search, { ...request, id: randomUUID(), requestId: randomUUID() })).status, 429);
  now += 86400000;
  assert.equal((await (await post(status, review)).json()).remaining, 2);
  assert.equal(calls, 8);
  assert.deepEqual(usage.jobs, [{ reserved: 200000 }]);
});

test('the same reviewer code can read and translate menus in a separate quota', async t => {
  const code = randomUUID();
  const usage = { jobs: [] };
  const playReviewNearby = createPlayReviewNearby({
    codeHash: createHash('sha256').update(code).digest('hex'),
    ledger: { shared: true, transaction: change => change(usage) },
    menuProviders: { ocr: async () => ({ text: 'pasta' }), translate: async () => ({ text: '파스타' }) },
  });
  const server = createApp({
    webRoot: '.', playReviewNearby, menuTest: {},
    store: { authenticate() { throw Object.assign(Error('Missing credentials'), { status: 401 }); } },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/menu`;
  const post = (path, body) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const review = { id: randomUUID(), reviewCode: code };
  assert.equal((await post('/status', { id: review.id })).status, 401);
  assert.equal((await post('/status', { ...review, reviewCode: randomUUID() })).status, 403);
  assert.equal((await post('/status', { ...review, id: 'invalid' })).status, 400);
  assert.equal((await (await post('/status', review)).json()).remaining, 2);
  const job = { ...review, requestId: randomUUID() };
  const imageBase64 = Buffer.from([255, 216, 255, 224, 0, 0, 0, 0, 255, 217]).toString('base64');
  const ocr = { ...job, operation: 'ocr', payload: { imageBase64, consent: true } };
  assert.deepEqual(await (await post('/process', ocr)).json(), { result: { text: 'pasta' } });
  assert.equal((await post('/process', ocr)).status, 409);
  const translate = { ...job, operation: 'translate', payload: { text: 'pasta' } };
  assert.deepEqual(await (await post('/process', translate)).json(), { result: { text: '파스타' } });
  assert.equal((await (await post('/status', review)).json()).remaining, 1);
  assert.deepEqual(usage.jobs, []);
});
