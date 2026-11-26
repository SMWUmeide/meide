import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';
import { JOB_RESERVATION_MICRO_USD, MenuTestLimits } from './menu-test-limits.mjs';
import { NearbyTestLimits, NEARBY_RESERVATION_MICRO_USD, validateNearbyLedger } from './nearby-test-limits.mjs';

const dailySearches = 8;
const dailyMenus = 8;
const dayKey = time => new Date(time + 9 * 3600000).toISOString().slice(0, 10);

function reviewLedger(ledger, now, scope, initialUsage) {
  return (policy, change) => ledger.transaction(state => {
    const today = dayKey(now());
    const yesterday = dayKey(now() - 86400000);
    const days = state[scope] ??= {};
    for (const day of Object.keys(days)) {
      if (day < yesterday) delete days[day];
    }
    if (policy.day !== today && policy.day !== yesterday) throw Error('Stale Play review request.');
    return change(days[policy.day] ??= initialUsage(policy));
  });
}

export function createPlayReviewNearby({ codeHash, ledger, provider, menuProviders, now = Date.now }) {
  if (!codeHash) return null;
  if (!/^[0-9a-f]{64}$/.test(codeHash) || !ledger?.shared) {
    throw Error('Play review access requires a SHA-256 code hash and shared storage.');
  }
  const expected = Buffer.from(codeHash, 'hex');
  const nearbyLedger = reviewLedger(ledger, now, 'playReviewNearby', () => ({ jobs: [], nearbyJobs: [] }));
  const review = new NearbyTestLimits({
    provider,
    menuTest: {
      now,
      check: () => ({ day: dayKey(now()), budgetMicroUsd: dailySearches * NEARBY_RESERVATION_MICRO_USD }),
      transaction: (policy, change) => nearbyLedger(policy, usage => {
        if (!validateNearbyLedger(usage) || !Array.isArray(usage.nearbyJobs) || usage.nearbyJobs.length > dailySearches) {
          throw Error('Invalid Play review usage.');
        }
        return change(usage);
      }),
    },
  });
  const menuLedger = reviewLedger(ledger, now, 'playReviewMenu', policy => ({ version: 1, policy: policy.fingerprint, jobs: [] }));
  class ReviewMenuLimits extends MenuTestLimits {
    check() {
      return { day: dayKey(now()), budgetMicroUsd: dailyMenus * JOB_RESERVATION_MICRO_USD, fingerprint: 'play-review-menu-v1' };
    }

    transaction(policy, change) {
      return menuLedger(policy, usage => {
        this.validateLedger(usage, policy);
        if (usage.jobs.length > dailyMenus) throw Error('Invalid Play review menu usage.');
        return change(usage);
      });
    }
  }
  return {
    accepts(code) {
      return typeof code === 'string' && /^[A-Za-z0-9_-]{32,64}$/.test(code)
        && timingSafeEqual(createHash('sha256').update(code).digest(), expected);
    },
    status: id => review.status(id),
    search: input => review.search(input),
    menu: menuProviders ? new ReviewMenuLimits({ providers: menuProviders, now }) : null,
  };
}
