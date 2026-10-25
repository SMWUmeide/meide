import { europeanCountries, normalize } from "../public/destinations.js";
import { koreanPlaceName } from "../public/korean-place.js";
export type CityEnvironment = {
  ASSETS: { fetch(request: Request): Promise<Response> };
};
type CityRow = {
  id: number;
  code: string;
  ko?: string;
  ascii: string;
  name: string;
  region: string;
  population: number;
  feature: string;
  latitude: number;
  longitude: number;
  search: string;
};
type CityChunk = { code: string; path: string; bloom: string };
type CityIndex = {
  countries: Record<string, { paths: string[]; count: number }>;
  chunks: CityChunk[];
  stats: Record<string, unknown>;
};
let indexPromise: Promise<CityIndex> | undefined;
function hashes(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.codePointAt(0)!, 16777619) >>> 0;
  return [h % 16384, (((h >>> 16) ^ h) >>> 0) % 16384];
}
export function citySearch(env: CityEnvironment, origin: string) {
  const asset = (path: string) =>
    env.ASSETS.fetch(new Request(origin + "/cities/" + path));
  const getIndex = () =>
    (indexPromise ??= asset("index.json")
      .then((r: Response) => {
        if (!r.ok) throw Error("여행지 데이터 연결 실패");
        return r.json() as Promise<CityIndex>;
      })
      .catch((e) => {
        indexPromise = undefined;
        throw e;
      }));
  const rows = async (path: string) => {
    const r = await asset(path);
    if (!r.ok) throw Error("여행지 데이터 연결 실패");
    return JSON.parse(
      await new Response(
        r.body!.pipeThrough(new DecompressionStream("gzip")),
      ).text(),
    ) as CityRow[];
  };
  const map = (r: CityRow) => {
    const c = europeanCountries.find((c) => c.code === r.code);
    const city = r.ko || koreanPlaceName(r.ascii || r.name);
    return {
      ...c,
      id: "geo-" + r.id,
      kind: "city",
      name: city,
      city,
      transcriptionApproximate: !r.ko,
      english: r.ascii,
      region: r.region,
      population: r.population,
      feature: r.feature,
      latitude: r.latitude,
      longitude: r.longitude,
    };
  };
  return async (query: string, code: string | null, offset = 0) => {
    const index = await getIndex(),
      q = normalize(query),
      start = Math.max(0, Number.isSafeInteger(offset) ? offset : 0);
    if (!q && code && index.countries[code]) {
      const country = index.countries[code],
        chunk = Math.floor(start / 2048),
        skip = start % 2048;
      const selected = await rows(country.paths[chunk] || country.paths[0]);
      if (skip + 60 > selected.length && country.paths[chunk + 1])
        selected.push(...(await rows(country.paths[chunk + 1])));
      const cities = selected.slice(skip, skip + 60).map(map);
      return {
        cities,
        total: country.count,
        nextOffset:
          start + cities.length < country.count ? start + cities.length : null,
        countryCode: code,
        dataStats: index.stats,
        source: "local-geonames",
      };
    }
    const trigrams = Array.from({ length: Math.max(0, q.length - 2) }, (_, n) =>
      q.slice(n, n + 3),
    );
    const candidates = index.chunks.filter((c: CityChunk) => {
      if (code && c.code !== code) return false;
      if (!trigrams.length) return true;
      const bits = Uint8Array.from(atob(c.bloom), (c) => c.charCodeAt(0));
      return trigrams.every((g) =>
        hashes(g).every((h) => (bits[h >>> 3] & (1 << h % 8)) !== 0),
      );
    });
    const matches: CityRow[] = [];
    for (let n = 0; n < candidates.length; n += 6) {
      const batch = await Promise.all(
        candidates.slice(n, n + 6).map((c: CityChunk) => rows(c.path)),
      );
      for (const group of batch)
        for (const r of group) if (r.search.includes(q)) matches.push(r);
    }
    const rank = (r: CityRow) =>
      normalize(r.ascii) === q
        ? 0
        : (" | " + r.search + " | ").includes(" | " + q + " | ")
          ? 1
          : 2;
    matches.sort(
      (a, b) => rank(a) - rank(b) || b.population - a.population || a.id - b.id,
    );
    const cities = matches.slice(start, start + 60).map(map);
    return {
      cities,
      total: matches.length,
      nextOffset:
        start + cities.length < matches.length ? start + cities.length : null,
      countryCode: code,
      dataStats: index.stats,
      source: "local-geonames",
    };
  };
}
