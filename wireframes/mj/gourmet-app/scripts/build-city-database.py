import re,json,sqlite3,zipfile,unicodedata,collections,datetime
from pathlib import Path
codes=re.search("const codes='([^']+)'",Path('public/destinations.js').read_text()).group(1).split()
archives=Path('/tmp/gourmet-geonames');output=Path('data/europe-cities.sqlite');temporary=output.with_suffix('.building.sqlite');temporary.unlink(missing_ok=True)
def norm(value):
 value=''.join(c for c in unicodedata.normalize('NFD',value).lower() if unicodedata.category(c)!='Mn')
 return re.sub(r'[\s·,.\-]','',value)
def korean(names):return next((v for v in names if re.search('[가-힣]',v)),'')
connection=sqlite3.connect(temporary);connection.executescript('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; CREATE TABLE places(id INTEGER PRIMARY KEY,code TEXT,name TEXT,ascii TEXT,ko TEXT,latitude REAL,longitude REAL,region TEXT,population INTEGER,feature TEXT,search TEXT); CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT);')
regions={};counts={};namesCount=0
for code in codes:
 path=archives/(code+'.zip')
 if not zipfile.is_zipfile(path):raise ValueError('Missing or incomplete archive: '+code)
 batch=[];count=0
 with zipfile.ZipFile(path) as archive,archive.open(code+'.txt') as source:
  for line in source:
   f=line.decode('utf-8').rstrip('\n').split('\t')
   if len(f)<19:continue
   names=list(dict.fromkeys([f[1],f[2],*f[3].split(',')]))
   if f[6]=='A' and f[7]=='ADM1':regions[f[8]+'.'+f[10]]=korean(names) or f[1]
   if f[6]!='P' or f[7] in ['PPLH','PPLCH','PPLQ','PPLW']:continue
   normalized=list(dict.fromkeys(norm(v) for v in names if v.strip()))
   batch.append((int(f[0]),f[8],f[1],f[2],korean(names),float(f[4]),float(f[5]),f[8]+'.'+f[10],int(f[14] or 0),f[7],' | '.join(normalized)))
   count+=1;namesCount+=len(normalized)
   if len(batch)>=5000:connection.executemany('INSERT OR REPLACE INTO places VALUES(?,?,?,?,?,?,?,?,?,?,?)',batch);batch=[]
 connection.executemany('INSERT OR REPLACE INTO places VALUES(?,?,?,?,?,?,?,?,?,?,?)',batch);connection.commit();counts[code]=count;print(code,count,flush=True)
connection.execute('CREATE INDEX region_match ON places(region)')
for key,value in regions.items():connection.execute('UPDATE places SET region=? WHERE region=?',(value,key))
connection.execute("UPDATE places SET region='' WHERE region LIKE '__.%'")
connection.executescript("CREATE INDEX by_country ON places(code,population DESC,id); CREATE VIRTUAL TABLE names USING fts5(search,content='places',content_rowid='id',tokenize='trigram'); INSERT INTO names(names) VALUES('rebuild');")
stats={'countryCount':len(codes),'placeCount':connection.execute('SELECT COUNT(*) FROM places').fetchone()[0],'searchNameCount':namesCount,'countries':counts,'builtAt':'2026-10-10','source':'GeoNames country gazetteer extracts','license':'CC BY 4.0','sourceUrl':'https://download.geonames.org/export/dump/','includes':'cities, towns, villages and populated subdivisions; historical/abandoned/destroyed places excluded'}
connection.execute('INSERT INTO metadata VALUES(?,?)',('stats',json.dumps(stats,ensure_ascii=False)));connection.commit();connection.execute('PRAGMA optimize');connection.close();temporary.replace(output);Path('data/city-data-info.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2));print(json.dumps(stats,ensure_ascii=False),flush=True)
