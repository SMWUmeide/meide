"""Build the offline server search index: python3 scripts/build-travel-data.py SOURCE_DIRECTORY.

Input: GeoNames CC BY 4.0 country chunks (index.json + *.json.gz).
Source/curated Korean names take precedence, then build-time phonetic readings.
The app ships the compressed index, not the million-record database in its mobile bundle.
"""
import gzip
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
import unicodedata
import shutil

root = Path(__file__).resolve().parents[1]
target = root / 'data/travel'
source = Path(sys.argv[1]).resolve()
index = json.loads((source / 'index.json').read_text())
countries = json.loads((target / 'countries.json').read_text())
aliases = json.loads((target / 'aliases.json').read_text())
phonetic = json.loads(gzip.decompress((target / 'phonetic-names.json.gz').read_bytes()))

def normalize(value):
    return re.sub(r'[^\w가-힣]', '', unicodedata.normalize('NFC', ''.join(c for c in unicodedata.normalize('NFD', value) if unicodedata.category(c) != 'Mn')).lower()).replace('_', '')

def names(row):
    return set(filter(None, [row['name'], row.get('ascii', ''), row.get('ko', ''), *row.get('search', '').split(' | ')]))

# Resolve aliases once, scoped by country; never assign a famous city's name to every homonym.
lookup = {}
for a in aliases:
    lookup.setdefault((a['code'], normalize(a['name'])), []).append(a['ko'])
winners = {}
regions = {}
checksums = []
for c in index['chunks']:
    path = source / Path(c['path']).name
    data = path.read_bytes()
    checksums.append({'file': path.name, 'sha256': hashlib.sha256(data).hexdigest()})
    for row in json.loads(gzip.decompress(data)):
        for name in names(row):
            key = (row['code'], normalize(name))
            if key in lookup and (key not in winners or row['population'] > winners[key]['population']):
                winners[key] = row
        if row.get('region'):
            regions[(row['code'], row['region'])] = True
extra = {}
for key, row in winners.items():
    extra.setdefault(row['id'], []).extend(lookup[key])
legacy = {('IT', 'Chiusi'): 'it-chiusi', ('IT', 'Rome'): 'it-roma', ('FR', 'Paris'): 'fr-paris', ('ES', 'Barcelona'): 'es-barcelona', ('GB', 'London'): 'gb-london', ('CZ', 'Prague'): 'cz-praha', ('PT', 'Lisbon'): 'pt-lisboa'}
legacy_ids = {winners[(code, normalize(name))]['id']: identifier for (code, name), identifier in legacy.items()}
db_path = target / 'gazetteer.build.sqlite'
db_path.unlink(missing_ok=True)
db = sqlite3.connect(db_path)
db.executescript('''
PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA temp_store=MEMORY;
CREATE TABLE places (id TEXT UNIQUE, kind TEXT, code TEXT, name TEXT, localName TEXT, region TEXT,
 latitude REAL, longitude REAL, population INTEGER, normalized TEXT, kindOrder INTEGER, nameSource TEXT);
CREATE VIRTUAL TABLE place_search USING fts5(names, scope, content='', tokenize='unicode61 remove_diacritics 2', prefix='1 2 3');
''')

def insert(identifier, kind, code, name, local, region, latitude, longitude, population, search_names, scopes=(), name_source='geonames'):
    assert re.search('[가-힣]', name), (identifier, name)
    cursor = db.execute('INSERT INTO places VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', (identifier, kind, code, name, local, region, latitude, longitude, population, normalize(name), {'country': 0, 'region': 1, 'city': 2}[kind], name_source))
    tokens = ' '.join(sorted(set(normalize(n) for n in [name, *search_names] if n)))
    db.execute('INSERT INTO place_search(rowid,names,scope) VALUES (?,?,?)', (cursor.lastrowid, tokens, ' '.join(normalize(s) for s in scopes if s)))

for country in countries:
    insert('country-' + country['code'], 'country', country['code'], country['name'], country['english'], '', None, None, 0, [country['name'], country['english'], country['code'], *country['aliases']])
translated_regions = {}
for code, region in sorted(regions):
    identifier = 'region-' + code + '-' + hashlib.sha256(region.encode()).hexdigest()[:16]
    # Regions are source labels, not a claim to a complete/current administrative-boundary dataset.
    name = region if re.search('[가-힣]', region) else phonetic[identifier]
    translated_regions[(code, region)] = name
    insert(identifier, 'region', code, name, region, '', None, None, 0, [region], name_source='geonames' if name == region else 'phonetic')
korean = generated = 0
for i, c in enumerate(index['chunks']):
    for row in json.loads(gzip.decompress((source / Path(c['path']).name).read_bytes())):
        ko = extra.get(row['id'], [])
        name_source = 'curated' if ko else 'geonames' if row.get('ko') else 'phonetic'
        name = ko[0] if ko else row.get('ko') or phonetic[str(row['id'])]
        korean += bool(re.search('[가-힣]', name))
        generated += name_source == 'phonetic'
        original_region = row.get('region', '')
        region = translated_regions.get((row['code'], original_region), '')
        insert(legacy_ids.get(row['id'], 'geonames-' + str(row['id'])), 'city', row['code'], name, row['name'], region, row['latitude'], row['longitude'], row['population'], [*names(row), *ko], [region, original_region], name_source)
    if (i + 1) % 100 == 0:
        db.commit()
        print(f'Indexed {i + 1}/{len(index["chunks"])} chunks', flush=True)
db.executescript('CREATE INDEX country_order ON places(code, kindOrder, population DESC, id); CREATE INDEX name_order ON places(normalized, population DESC, id);')
db.execute("INSERT INTO place_search(place_search) VALUES ('optimize')")
db.commit()
assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
db.execute('VACUUM')
db.close()
compressed_path = target / 'gazetteer.build.sqlite.gz'
with db_path.open('rb') as src, compressed_path.open('wb') as dst:
    with gzip.GzipFile(fileobj=dst, mode='wb', filename='', mtime=0, compresslevel=6) as compressor:
        shutil.copyfileobj(src, compressor)
database_hash = hashlib.file_digest(db_path.open('rb'), 'sha256').hexdigest()
compressed_hash = hashlib.file_digest(compressed_path.open('rb'), 'sha256').hexdigest()
files = []
with compressed_path.open('rb') as packed:
    while block := packed.read(32 * 1024 * 1024):
        filename = f'gazetteer-{database_hash[:12]}.part{len(files):02d}'
        (target / filename).write_bytes(block)
        files.append(filename)
manifest = {'version': 2, 'source': 'GeoNames country gazetteer extracts', 'sourceUrl': index['stats']['sourceUrl'], 'license': 'CC BY 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/', 'sourceBuiltAt': index['stats']['builtAt'], 'countries': len(countries), 'cities': index['stats']['placeCount'], 'regions': len(regions), 'koreanCityNames': korean, 'phoneticCityNames': generated, 'koreanRegionNames': len(regions), 'phoneticRegionNames': sum(not bool(re.search('[가-힣]', r)) for _, r in regions), 'sha256': database_hash, 'compressedSha256': compressed_hash, 'databaseBytes': db_path.stat().st_size, 'compressedBytes': compressed_path.stat().st_size, 'files': files, 'missingCuratedAliases': [a for a in aliases if (a['code'], normalize(a['name'])) not in winners], 'modifications': 'Normalized search index, curated aliases and automatic Korean phonetic readings. Original spelling retained. Automatic readings are approximate, not official Korean names.'}
(target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(target / 'source-checksums.json').write_text(json.dumps(checksums, indent=2) + '\n')
db_path.unlink()
compressed_path.unlink()
(target / 'gazetteer.sqlite.gz').unlink(missing_ok=True)
for old in target.glob('gazetteer-*.part*'):
    if old.name not in files: old.unlink()
print(json.dumps({k: v for k, v in manifest.items() if k not in ['missingCuratedAliases', 'modifications']}, ensure_ascii=False))
