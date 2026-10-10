import {writeFile} from 'node:fs/promises';
import {foodCatalog} from '../public/food-catalog.js';
const excluded=new Set(['muradali','lopta','hákarl','kymyz']);
for(const [key,rows] of Object.entries(foodCatalog)){const seen=new Set();foodCatalog[key]=rows.filter(i=>{const name=i.original.toLowerCase().trim();if(excluded.has(name)||seen.has(name)||key==='BY'&&name==='studen'||key==='IE'&&name==='dublin coddle'||key==='NL'&&name==='snert'||key==='UA'&&name==='studen')return false;seen.add(name);return true;});}
const localNames=['Skerpikjøt','Ræstur fiskur','Seyðahøvd','Fiskakøkur','Garnatálg','Knettir'];
const nordicNames=['Wienerbrød','Rødgrød med fløde','Risalamande','Kransekage','Æbleskiver','Frikadeller','Gravad laks','Rugbrød','Tarteletter'];
foodCatalog.FO=[...localNames.map(n=>foodCatalog.FO.find(i=>i.original===n)).filter(Boolean),...nordicNames.map(n=>foodCatalog.DK.find(i=>i.original===n)).filter(Boolean).map(i=>({...i,scope:'regional',description:'북유럽에서 함께 즐기는 음식으로, '+i.description.replace(/덴마크의 국민 요리/g,'지역 요리').replace(/덴마크식/g,'북유럽식')}))];
for(const [key,rows] of Object.entries(foodCatalog)){if(rows.length<15)throw Error(key+' has only '+rows.length);}
await writeFile(new URL('../public/food-catalog.js',import.meta.url),'// General culinary information; shared regional dishes supplement small territories.\nexport const foodCatalog='+JSON.stringify(foodCatalog)+';\n');
console.log(JSON.stringify({regions:Object.keys(foodCatalog).length,entries:Object.values(foodCatalog).reduce((n,r)=>n+r.length,0),minimum:Math.min(...Object.values(foodCatalog).map(r=>r.length))}));
