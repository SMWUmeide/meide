import re,urllib.request,zipfile,concurrent.futures,time
from pathlib import Path
codes=re.search("const codes='([^']+)'",Path('public/destinations.js').read_text()).group(1).split()
root=Path('/tmp/gourmet-geonames');root.mkdir(exist_ok=True)
def download(code):
 target=root/(code+'.zip')
 if target.exists() and zipfile.is_zipfile(target):return code,target.stat().st_size
 for attempt in range(3):
  try:
   with urllib.request.urlopen('https://download.geonames.org/export/dump/'+code+'.zip',timeout=45) as response,target.open('wb') as out:
    while block:=response.read(1024*1024):out.write(block)
   if not zipfile.is_zipfile(target):raise ValueError('Incomplete archive')
   return code,target.stat().st_size
  except Exception:
   if attempt==2:raise
 raise RuntimeError(code)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 futures={pool.submit(download,c):c for c in codes}
 for f in concurrent.futures.as_completed(futures):
  c,size=f.result();print(c,size,flush=True)
print('All European country archives ready.',flush=True)
