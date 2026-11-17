# Travel gazetteer

GeoNames (https://www.geonames.org/), CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/).
Original extracts: https://download.geonames.org/export/dump/.
Snapshot declared by the input: 2026-10-10; this is not a live administrative boundary service.
Provided without warranties of accuracy, timeliness or completeness.

Changes: indexed/normalized names; country-scoped Korean travel aliases;
source region labels made selectable. Names without source/curated Korean labels
receive approximate Korean phonetic readings. Original spelling is retained.
These automatic readings are not official Korean geographic names. Country/region
language heuristics can be wrong in multilingual places and transliterated names.
58 country/territory codes include transcontinental countries and dependencies,
so this is not a claim that there are 58 sovereign European states.
All records of transcontinental countries are included, even those outside Europe.

`manifest.json` records coverage, source date and checksums. `source-checksums.json`
identifies the input chunks. The `gazetteer-*.part*` files listed in the manifest
are the compressed, self-contained deployable server index, split below 32 MiB
per file. They are not imported by the mobile app. The server verifies checksums
and streams decompression into `.local-data` on first use; ship the entire
`data/travel` directory with the server.

Rebuild the index from preserved public-data chunks (Python 3.11+, SQLite FTS5):
`python3 scripts/build-travel-data.py ../../sites/hanip-design-journey/public/cities`
It uses the checked-in `phonetic-names.json.gz`; pronunciation tools are not
required to rebuild the index from these existing readings.
The path is an input data snapshot only; no prior app code, accounts or secrets are used.
For future snapshots use equivalent `index.json`/gzip JSON schema, update the source
date in the app's attribution screen, regenerate readings, inspect coverage and run tests.

To regenerate the pronunciation data as well, create a build-only virtual environment:

```
python3 -m venv .local-data/travel-build-env
.local-data/travel-build-env/bin/pip install six==1.17.0
.local-data/travel-build-env/bin/pip install -r scripts/travel-build-requirements.txt
.local-data/travel-build-env/bin/python scripts/prepare-travel-pronunciation.py
.local-data/travel-build-env/bin/python scripts/build-travel-pronunciations.py ../../sites/hanip-design-journey/public/cities
```

`prepare-travel-pronunciation.py` downloads two checksum-pinned eSpeak NG 1.52.0
Faroese source files from its official repository because the loader wheel omits
that dictionary. They remain under `.local-data` and are not distributed in the app.
`pronunciation-audit.json` records generation methods and must have zero errors.
Source/curated Korean names always win over generated names. An individual record's
`nameSource` is `geonames`, `curated` or `phonetic` in the API and stored selection.

Build tools: Hangulize 0.0.9 (BSD, https://github.com/sublee/hangulize),
Phonemizer fork 3.3.2 (GPL-3.0+, https://github.com/thewh1teagle/phonemizer),
eSpeak NG (GPL-3.0+, https://github.com/espeak-ng/espeak-ng), espeakng-loader 0.2.4.
These tools run offline at data-build time. Only the generated name data is used
by the app/server; the tools and their runtime libraries are not linked or shipped.

Node 22.13+ with `node:sqlite` is required by the server. The tested version is 22.23.5.
API search is local to this server, with no Google/OpenAI billable calls.
Hosting/storage costs, if any, are separate.
