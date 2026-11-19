import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';
import { NearbyTestLimits, NEARBY_RESERVATION_MICRO_USD, validateNearbyLedger } from './nearby-test-limits.mjs';

const dailySearches = 8;
const dayKey = time => new Date(time + 9 * 3600000).toISOString().slice(0, 10);

export function createPlayReviewNearby({ codeHash, ledger, provider, now = Date.now }) {
  if (!codeHash) return null;
  if (!/^[0-9a-f]{64}$/.test(codeHash) || !ledger?.shared) {
    throw Error('Play review access requires a SHA-256 code hash and shared storage.');
  }
  const expected = Buffer.from(codeHash, 'hex');
  const review = new NearbyTestLimits({
    provider,
    menuTest: {
      now,
      check: () => ({ day: dayKey(now()), budgetMicroUsd: dailySearches * NEARBY_RESERVATION_MICRO_USD }),
      transaction: (policy, change) => ledger.transaction(state => {
        const today = dayKey(now());
        const yesterday = dayKey(now() - 86400000);
        const days = state.playReviewNearby ??= {};
        for (const day of Object.keys(days)) {
          if (day < yesterday) delete days[day];
        }
        if (policy.day !== today && policy.day !== yesterday) throw Error('Stale Play review request.');
        const usage = days[policy.day] ??= { jobs: [], nearbyJobs: [] };
        if (!validateNearbyLedger(usage) || !Array.isArray(usage.nearbyJobs) || usage.nearbyJobs.length > dailySearches) {
          throw Error('Invalid Play review usage.');
        }
        return change(usage);
      }),
    },
  });
  return {
    accepts(code) {
      return typeof code === 'string' && /^[A-Za-z0-9_-]{32,64}$/.test(code)
        && timingSafeEqual(createHash('sha256').update(code).digest(), expected);
    },
    status: id => review.status(id),
    search: input => review.search(input),
  };
}
