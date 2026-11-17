"""Generate reproducible Korean readings for all untranslated cities/regions.

Usage: .local-data/travel-build-env/bin/python scripts/build-travel-pronunciations.py SOURCE
"""
import concurrent.futures
import gzip
import hashlib
import json
import multiprocessing
from pathlib import Path
import re
import sys
import unicodedata
from collections import Counter
from travel_pronunciation import source_spelling, transcribe
import espeakng_loader

def process_chunk(path):
    result = {}
    counts = Counter()
    errors = []
    for row in json.loads(gzip.decompress(Path(path).read_bytes())):
        if re.search('[가-힣]', row.get('ko', '')): continue
        code, region = row['code'], row.get('region', '')
        spelling = source_spelling(code, row['name'], row.get('search', ''))
        try:
            ko, method = transcribe(code, spelling, region)
            result[str(row['id'])] = ko
            counts[method] += 1
        except Exception as error:
            errors.append({'id': row['id'], 'code': code, 'name': row['name'], 'error': str(error)})
    return result, counts, errors

def main():
    root = Path(__file__).resolve().parents[1]
    target = root / 'data/travel'
    source = Path(sys.argv[1]).resolve()
    index = json.loads((source / 'index.json').read_text())
    assert (Path(espeakng_loader.get_data_path()) / 'fo_dict').exists(), 'Run scripts/prepare-travel-pronunciation.py first'
    rules_hash = hashlib.sha256((root / 'scripts/travel_pronunciation.py').read_bytes() + (source / 'index.json').read_bytes()).hexdigest()[:12]
    cache = root / ('.local-data/travel-pronunciation-' + rules_hash)
    cache.mkdir(parents=True, exist_ok=True)
    # Workers are isolated OS processes because the phonemizer library is not thread-safe.
    paths = [source / Path(c['path']).name for c in index['chunks']]
    counts, all_errors = Counter(), []
    completed = 0
    with concurrent.futures.ProcessPoolExecutor(max_workers=4, mp_context=multiprocessing.get_context('spawn')) as pool:
        futures = {pool.submit(process_chunk, str(path)): path for path in paths if not (cache / path.name).exists()}
        for future in concurrent.futures.as_completed(futures):
            result, methods, errors = future.result()
            (cache / futures[future].name).write_bytes(gzip.compress(json.dumps({'names': result, 'methods': dict(methods), 'errors': errors}, ensure_ascii=False).encode(), mtime=0))
            completed += 1
            if completed % 25 == 0: print(f'발음 변환 {completed}/{len(futures)} 자료 묶음', flush=True)
    names, regions = {}, {}
    for path in paths:
        part = json.loads(gzip.decompress((cache / path.name).read_bytes()))
        names.update(part['names']); counts.update(part['methods']); all_errors.extend(part['errors'])
        for row in json.loads(gzip.decompress(path.read_bytes())):
            if row.get('region'): regions[(row['code'], row['region'])] = True
    for code, original in regions:
        if re.search('[가-힣]', original): continue
        identifier = 'region-' + code + '-' + hashlib.sha256(original.encode()).hexdigest()[:16]
        # Administrative boilerplate is not part of the proper name. Original full labels remain indexed.
        stem = re.sub(r'^(Municipality of |Urban Municipality of |Commune de |Municipiul |Raionul |Oblast |Castello di |Canton d\x27|Canton de |Qarku i |Region )', '', original)
        stem = re.sub(r' (Rayon|City|District|County|Region|Oblast[’\x27]?|novads|Sýsla|sýsla)$', '', stem)
        try:
            names[identifier], method = transcribe(code, unicodedata.normalize('NFC', stem))
            counts['region:' + method] += 1
        except Exception as error: all_errors.append({'id': identifier, 'code': code, 'name': original, 'error': str(error)})
    (target / 'pronunciation-audit.json').write_text(json.dumps({'methods': dict(counts), 'generated': len(names), 'errors': all_errors}, ensure_ascii=False, indent=2) + '\n')
    if all_errors:
        raise RuntimeError(f'{len(all_errors)} names need review; see pronunciation-audit.json')
    (target / 'phonetic-names.json.gz').write_bytes(gzip.compress(json.dumps(names, ensure_ascii=False, sort_keys=True).encode(), mtime=0))
    print(f'Generated {len(names)} Korean readings', flush=True)

if __name__ == '__main__': main()
