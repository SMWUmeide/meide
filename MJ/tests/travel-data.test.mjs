import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.mjs';
import { TravelService } from '../server/travel-service.mjs';
import { travelCountries, validateTravelQuery } from '../server/travel-search.mjs';
import { parseTravelDestination, currentTravelDestination, destinationLabel } from '../src/features/travel/catalog.ts';
import { initialProgress, parseProgress, toggleTravelDestination } from '../src/state/model.ts';

test('complete gazetteer is searchable over HTTP, free of paid providers, and persists arbitrary selections', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'meide-travel-'));
  const service = new TravelService(dir);
  const forbidden = new Proxy({}, {get() { throw new Error('Travel search must not use profiles or billable providers'); }});
  const app = createApp({store: forbidden, menuTest: forbidden, nearbyTest: forbidden, webRoot: dir, allowedOrigins: ['http://localhost:5190'], travelSearch: service});
  await new Promise((resolve, reject) => { app.once('error', reject); app.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${app.address().port}/api/travel/search`;
  const request = (q, offset = 0) => fetch(`${base}?q=${encodeURIComponent(q)}&offset=${offset}`);
  const search = async q => {
    const res = await request(q); assert.equal(res.status, 200);
    return res.json();
  };
  try {
    // Production also waits for the verified, read-only travel index before
    // accepting requests. Startup decompression is separate from query timeout.
    await service.ready;
    await t.test('source coverage, country names, aliases and combined Korean searches', async () => {
      const manifest = JSON.parse(readFileSync(new URL('../data/travel/manifest.json', import.meta.url)));
      assert.equal(manifest.countries, 58); assert.equal(manifest.cities, 1022909);
      assert.equal(manifest.regions, 1292); assert.equal(manifest.koreanCityNames, manifest.cities);
      assert.equal(manifest.koreanRegionNames, manifest.regions);
      for (const country of travelCountries) {
        assert.match(country.name, /[가-힣]/);
        const result = await service.search(country.name);
        assert.equal(result.places[0].id, 'country-' + country.code);
        assert.ok(result.places.every(p => p.code === country.code));
      }
      for (const [query, name] of [['파', '파리'], ['프랑스 파리', '파리'], ['프랑스파리', '파리'], ['뮌헨', '뮌헨'], ['빈', '비엔나'], ['베니스', '베네치아'], ['사라예보', '사라예보'], [' PRAgue ', '프라하'], ['치우시', '키우시'], ['파리'.normalize('NFD'), '파리'], ['Berlin', '베를린'], ['FR Paris', '파리']]) {
        assert.equal((await search(query)).places[0].city, name, query);
      }
      const region = (await search('토스카나')).places[0];
      assert.equal(region.kind, 'region'); assert.equal(region.code, 'IT');
      assert.ok(region.city.startsWith('토스카나'));
      assert.equal((await search('튀르키예')).places[0].id, 'country-TR');
    });
    await t.test('pagination is stable and phonetic readings preserve original spellings and provenance', async () => {
      const first = await search('이탈리아');
      const second = await (await request('이탈리아', first.nextOffset)).json();
      assert.equal(first.places.length, 30); assert.equal(second.places.length, 30);
      assert.equal(new Set([...first.places, ...second.places].map(p => p.id)).size, 60);
      assert.deepEqual(first, await search('이탈리아'));
      const original = (await search('이탈리아 Prato')).places.find(p => p.localName === 'Prato');
      assert.equal(original.city, '프라토'); assert.equal(original.nameSource, 'phonetic');
      for (const [query, local] of [['피사', 'Pisa'], ['프라토', 'Prato'], ['리보르노', 'Livorno'], ['루카', 'Lucca']]) {
        const place = (await search(query)).places[0]; assert.equal(place.localName, local);
        assert.match(place.city, /[가-힣]/);
      }
      const audit = JSON.parse(readFileSync(new URL('../data/travel/pronunciation-audit.json', import.meta.url)));
      assert.equal(audit.errors.length, 0);
      const manifest = JSON.parse(readFileSync(new URL('../data/travel/manifest.json', import.meta.url)));
      const db = new DatabaseSync(join(dir, `travel-${manifest.sha256.slice(0,16)}.sqlite`), {readOnly: true});
      try {
        assert.equal(db.prepare("SELECT count(*) AS count FROM places WHERE name NOT GLOB '*[가-힣]*'").get().count, 0);
        assert.equal(db.prepare('SELECT count(*) AS count FROM places WHERE length(name) > 200 OR length(localName) > 200').get().count, 0);
      } finally { db.close(); }
      const empty = await search('없는도시123456');
      assert.deepEqual(empty, {places: [], nextOffset: null});
    });
    await t.test('selected country, region and new city survive reload, deselection and switching', async () => {
      let progress = {...initialProgress, stage: 'home', name: '테스트', allergyStatus: 'none', foodStatus: 'none', homeGuideSeen: true};
      for (const query of ['스위스', '토스카나', '뮌헨']) {
        const place = (await search(query)).places[0];
        assert.ok(parseTravelDestination(place));
        progress = parseProgress(JSON.stringify(toggleTravelDestination(progress, place)));
        assert.equal(currentTravelDestination(progress).id, place.id);
        assert.equal(progress.travelDestinationEnabled, true);
        assert.equal(progress.stage, 'home'); assert.equal(progress.name, '테스트');
        progress = parseProgress(JSON.stringify(toggleTravelDestination(progress, place)));
        assert.equal(progress.travelDestinationEnabled, false);
        assert.ok(destinationLabel(currentTravelDestination(progress)));
      }
      assert.equal(parseTravelDestination({...currentTravelDestination(progress), latitude: 999}), undefined);
      const corrupted = parseProgress(JSON.stringify({...progress, travelDestination: {...progress.travelDestination, code: 'US'}}));
      assert.equal(currentTravelDestination(corrupted).id, 'it-chiusi');
      assert.equal(corrupted.stage, 'home');
    });
    await t.test('invalid and cross-origin requests cannot query freely or execute search syntax', async () => {
      for (const query of ['', '가'.repeat(81)]) assert.equal((await request(query)).status, 400);
      for (const offset of [-1, 'NaN', 0.5, 2000001]) assert.equal((await request('파리', offset)).status, 400);
      assert.throws(() => validateTravelQuery(null), error => error.status === 400);
      assert.equal((await fetch(`${base}?q=Paris`, {headers: {Origin: 'https://untrusted.invalid'}})).status, 403);
      assert.deepEqual((await search('"; DROP TABLE places; --')).places, []);
      assert.equal((await search('파리')).places[0].id, 'fr-paris');
      for (let i = 0; i < 121; i++) await request('파리');
      assert.equal((await request('파리')).status, 429);
    });
  } finally {
    await new Promise(resolve => app.close(resolve));
    await service.close();
    rmSync(dir, {recursive: true, force: true});
  }
});
