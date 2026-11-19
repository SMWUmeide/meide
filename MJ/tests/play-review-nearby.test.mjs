import assert from 'node:assert/strict';
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
