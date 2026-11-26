// Limits apply to a dedicated Google API project used solely by this server.
// Each pool stays below half of the applicable monthly free allowance.
const allowances = {
  nearby: 450,
  textSearch: 450,
  details: 450,
  photos: 450,
  staticMaps: 450,
  ocr: 450,
  translation: 200_000,
};
const dayLength = 24 * 60 * 60 * 1000;
const windowDays = 32;
const blocked = () => Object.assign(new Error('무료 API 이용 한도에 도달했어요.'), { status: 429 });

function usage(address, options) {
  const { origin, pathname } = new URL(address);
  if (origin === 'https://places.googleapis.com') {
    if (pathname === '/v1/places:searchNearby') return ['nearby', 1];
    if (pathname === '/v1/places:searchText') return ['textSearch', 1];
    if (/^\/v1\/places\/[\w-]+\/photos\/[\w-]+\/media$/.test(pathname)) return ['photos', 1];
    if (/^\/v1\/places\/[\w-]+$/.test(pathname)) return ['details', 1];
  }
  if (origin === 'https://maps.googleapis.com' && pathname === '/maps/api/staticmap') return ['staticMaps', 1];
  if (origin === 'https://vision.googleapis.com' && pathname === '/v1/images:annotate') {
    const { requests } = JSON.parse(options.body);
    if (requests?.length === 1 && requests[0].features?.length === 1 && requests[0].features[0].type === 'DOCUMENT_TEXT_DETECTION') return ['ocr', 1];
  }
  if (origin === 'https://translation.googleapis.com' && pathname === '/language/translate/v2') {
    const { q, model } = JSON.parse(options.body);
    if (typeof q === 'string' && q.length && model === 'nmt') return ['translation', q.length];
  }
  throw new Error('Unsupported Google request in free-tier mode.');
}

export function createFreeGoogleFetch({ ledger, pool, fetchImpl = fetch, now = Date.now }) {
  if (!ledger?.shared || !['tester', 'reviewer'].includes(pool)) {
    throw new Error('Free-tier Google usage requires shared storage and a known usage pool.');
  }

  return async (address, options) => {
    const [category, count] = usage(address, options);
    const today = Math.floor(now() / dayLength);
    await ledger.transaction(record => {
      const googleUsage = record.freeGoogleUsage ??= {};
      const dates = googleUsage[pool] ??= {};
      let reserved = 0;
      for (const [date, counts] of Object.entries(dates)) {
        if (+date < today - (windowDays - 1)) {
          delete dates[date];
          continue;
        }
        const units = counts[category] ?? 0;
        if (!Number.isSafeInteger(units) || units < 0) throw blocked();
        reserved += units;
      }
      if (reserved + count > allowances[category]) throw blocked();
      const units = dates[today] ??= {};
      units[category] = (units[category] ?? 0) + count;
    });

    // Keep the reservation if the request fails, since Google may have received it.
    return fetchImpl(address, { ...options, redirect: 'error' });
  };
}
