import assert from 'node:assert/strict';
import test from 'node:test';
import { createFreeGoogleFetch } from '../server/google-free-requests.mjs';

const search = 'https://places.googleapis.com/v1/places:searchNearby';
const dayLength = 24 * 60 * 60 * 1000;

test('reserves Google calls before fetching and keeps a separate reviewer allowance', async () => {
  const day = 20_000;
  let now = day * dayLength;
  const state = { freeGoogleUsage: { tester: { [day]: { nearby: 449 } } } };
  const ledger = { shared: true, transaction: async change => change(state) };
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push([url, options.redirect]);
    if (calls.length === 1) throw new Error('Request timed out');
    return { ok: true };
  };
  const tester = createFreeGoogleFetch({ ledger, pool: 'tester', fetchImpl, now: () => now });
  const reviewer = createFreeGoogleFetch({ ledger, pool: 'reviewer', fetchImpl, now: () => now });

  await assert.rejects(tester(search, {}), /timed out/);
  await assert.rejects(tester(search, {}), { status: 429 });
  await reviewer(search, {});
  now += 31 * dayLength;
  await assert.rejects(tester(search, {}), { status: 429 });
  now += dayLength;
  await tester(search, {});
  assert.deepEqual(calls, Array(3).fill([search, 'error']));
});

test('rejects untracked Google endpoints and Vision requests before sending', async () => {
  const ledger = { shared: true, transaction: () => assert.fail('Unexpected reservation') };
  const fetchImpl = () => assert.fail('Unexpected request');
  const send = createFreeGoogleFetch({ ledger, pool: 'tester', fetchImpl });

  await assert.rejects(send('https://places.googleapis.com/v1/places:autocomplete', {}), /Unsupported/);
  const body = JSON.stringify({ requests: [{ features: [{ type: 'LABEL_DETECTION' }] }] });
  await assert.rejects(send('https://vision.googleapis.com/v1/images:annotate', { body }), /Unsupported/);
  assert.throws(() => createFreeGoogleFetch({ ledger: {}, pool: 'tester' }), /shared storage/);
});
