import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export const travelCountries = JSON.parse(readFileSync(new URL('../data/travel/countries.json', import.meta.url), 'utf8'));
const countriesByCode = new Map(travelCountries.map(c => [c.code, c]));
export function normalizeTravel(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}
const normalizeWords = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
const countryNames = travelCountries.flatMap(c => [c.name, c.english, c.code, ...c.aliases].map(name => ({code: c.code, name: normalizeTravel(name), words: normalizeWords(name)}))).sort((a, b) => b.name.length - a.name.length);

export function validateTravelQuery(query, offset = '0') {
  if (typeof query !== 'string' || query.length > 80 || !query.trim() || !/^\d{1,7}$/.test(String(offset)) || Number(offset) > 2000000) {
    throw Object.assign(new Error('검색어를 확인해 주세요.'), {status: 400});
  }
  return {query: query.trim(), offset: Number(offset)};
}

export class TravelSearchIndex {
  constructor(path) {
    this.db = new DatabaseSync(path, {readOnly: true});
    this.db.exec('PRAGMA query_only=ON; PRAGMA cache_size=-12000;');
  }
  close() { this.db.close(); }
  search(query, offset = 0) {
    validateTravelQuery(query, offset);
    const normalized = normalizeTravel(query);
    if (!normalized) return {places: [], nextOffset: null};
    const exact = countryNames.find(c => c.name === normalized);
    const words = normalizeWords(query);
    const prefix = exact ?? countryNames.find(c => c.name.length > 1 && normalized.startsWith(c.name) && (/^[가-힣]/.test(c.name) || words.startsWith(c.words + ' ')));
    const countryCodes = exact ? [exact.code] : prefix ? [prefix.code] : [...new Set(countryNames.filter(c => c.name.startsWith(normalized)).map(c => c.code))];
    const remainder = prefix ? normalized.slice(prefix.name.length) : normalized;
    const match = remainder ? `"${remainder}"*` : '';
    let where;
    const params = [];
    if (prefix) {
      where = 'code = ?'; params.push(prefix.code);
      if (match) { where += ' AND rowid IN (SELECT rowid FROM place_search WHERE place_search MATCH ?)'; params.push(match); }
    } else {
      where = 'rowid IN (SELECT rowid FROM place_search WHERE place_search MATCH ?)'; params.push(match);
      if (countryCodes.length) { where += ` OR code IN (${countryCodes.map(() => '?').join(',')})`; params.push(...countryCodes); }
    }
    // Exact aliases (e.g. 빈 → 비엔나) precede prefix matches. Major matching cities
    // precede small districts, while a region-name match precedes its child cities.
    const nameQuery = remainder || normalized;
    const rows = this.db.prepare(`SELECT * FROM places WHERE ${where} ORDER BY
      (kind = 'country' AND code = ?) DESC,
      (? AND rowid IN (SELECT rowid FROM place_search WHERE place_search MATCH ?)) DESC,
      (kind = 'country') DESC,
      (rowid IN (SELECT rowid FROM place_search WHERE place_search MATCH ?)) DESC,
      population DESC, kindOrder, id LIMIT 31 OFFSET ?`).all(...params, exact?.code ?? '', Number(nameQuery.length > 1), `names : "${nameQuery}"`, `names : "${nameQuery}"*`, Number(offset));
    const places = rows.slice(0, 30).map(row => {
      const country = countriesByCode.get(row.code);
      return {id: row.id, kind: row.kind, code: row.code, country: country.name, city: row.kind === 'country' ? '' : row.name, localName: row.localName, flag: country.flag, region: row.region, nameSource: row.nameSource, aliases: [], ...(row.latitude !== null ? {latitude: row.latitude, longitude: row.longitude} : {})};
    });
    return {places, nextOffset: rows.length > 30 ? Number(offset) + 30 : null};
  }
}
