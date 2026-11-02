"""Run from any directory: python3 verify.py. Uses exported evidence, not live APIs."""
from pathlib import Path
import json, math
P=Path(__file__).resolve().parent
T=json.loads((P/'tokens.json').read_text()); E=json.loads((P/'figma-variables-export.json').read_text())
assert {k:len(v) for k,v in T.items()}=={'colors':9,'typography':5,'spacing':6,'rounded':3,'shadows':2}
V={v['id']:v for v in E['variables']};C=next(c for c in E['collections'] if 'Semantic' in c['name']);S=[v for v in V.values() if v['collectionId']==C['id']]
assert len(S)==25
prefix={'color':'colors','type':'typography','space':'spacing','rounded':'rounded','shadow':'shadows'}
checks=0
for v in S:
 group,name=v['name'].split('/');expected=T[prefix[group]][name]
 for i,m in enumerate(C['modes']):
  alias=v['valuesByMode'][m['modeId']];assert alias['type']=='VARIABLE_ALIAS'; primitive=V[alias['id']];assert primitive['collectionId']!=C['id'];assert primitive['scopes']==[]
  raw=next(iter(primitive['valuesByMode'].values()))
  val=expected[i] if group in ['color','shadow'] else expected[0] if group=='type' else expected
  if group=='color':raw='#'+''.join(f'{round(raw[c]*255):02X}' for c in ['r','g','b'])
  assert raw==val,(v['name'],raw,val)
  checks+=1
 assert v['codeSyntax']['WEB']==f'var(--{group}-{name})'
def luminance(h):
 x=[int(h[i:i+2],16)/255 for i in [1,3,5]];x=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in x]
 return sum(a*b for a,b in zip(x,[.2126,.7152,.0722]))
def contrast(a,b):
 l,h=sorted([luminance(a),luminance(b)]);return(h+.05)/(l+.05)
ratios=[]
for i,mode in enumerate(['Light','Dark']):
 for bg in ['surface','neutral','gradient-start','gradient-end','disabled']:
  ratio=contrast(T['colors']['secondary'][i],T['colors'][bg][i]);assert ratio>=4.5
  ratios.append({'mode':mode,'foreground':'secondary','background':bg,'ratio':round(ratio,3)})
assert contrast('#000000','#FF7800')>=4.5
R=json.loads((P/'responsive-audit.json').read_text());assert len(R)==9
for row in R:assert row['overflow']==0 and row['smallTargets']==[] and row['typeMismatch']==[] and row['buttonsWithoutName']==[]
F=json.loads((P/'functional-checks.json').read_text());assert all(v['actual']==v['expected'] for v in F)
SC=json.loads((P/'scroll-focus-check.json').read_text());assert SC['before']['titles']==SC['after']['titles'];assert SC['before']['subtotals']==SC['after']['subtotals'];assert SC['after']['scrolls'][1]>0
assert json.loads((P/'empty-state-check.json').read_text())['disabled']
result={'semanticCount':25,'primitiveCount':len(V)-25,'aliasModeChecks':checks,'contrast':ratios,'warningContrast':round(contrast('#000000','#FF7800'),3),'responsiveCases':9,'functionalChecks':len(F),'cartFixedHeadingAndSubtotal':True,'emptyDisabled':True,'limits':['Scope: core UI design and existing interactions','Dark tokens verified']}
(P/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
