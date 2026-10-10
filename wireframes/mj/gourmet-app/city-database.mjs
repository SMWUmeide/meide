import {koreanPlaceName} from './public/korean-place.js';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {europeanCountries,normalize} from './public/destinations.js';
const file=fileURLToPath(new URL('./data/europe-cities.sqlite',import.meta.url));
const db=existsSync(file)?new DatabaseSync(file,{readOnly:true}):null;
export const cityDataStats=db?JSON.parse(db.prepare("SELECT value FROM metadata WHERE key='stats'").get().value):null;
const countryMap=new Map(europeanCountries.map(c=>[c.code,c]));
export function searchLocalCities(query,code,offset=0){
 if(!db)return null;
 const normalized=normalize(query),country=countryMap.get(code),params=[],filters=[];
 let from='places p';
 if(normalized.length>=3){from='names JOIN places p ON p.id=names.rowid';filters.push('names MATCH ?');params.push('"'+normalized.replaceAll('"','""')+'"');}
 else if(normalized){filters.push('instr(p.search,?)>0');params.push(normalized);}
 if(country){filters.push('p.code=?');params.push(code);}
 const where=filters.length?' WHERE '+filters.join(' AND '):'';
 const total=db.prepare('SELECT COUNT(*) AS n FROM '+from+where).get(...params).n;
 const start=Math.max(0,Math.min(Number.isSafeInteger(offset)?offset:0,total));
 const order=normalized?`CASE WHEN lower(replace(replace(replace(p.ascii,' ',''),'-',''),'.',''))=? THEN 0 WHEN instr(' | '||p.search||' | ',' | '||?||' | ')>0 THEN 1 ELSE 2 END,p.population DESC,p.id`:'p.population DESC,p.id';
 const rows=db.prepare(`SELECT p.* FROM ${from}${where} ORDER BY ${order} LIMIT 60 OFFSET ?`).all(...params,...(normalized?[normalized,normalized]:[]),start);
 const cities=rows.map(r=>{const c=countryMap.get(r.code);return {...c,id:'geo-'+r.id,kind:'city',name:r.ko||koreanPlaceName(r.ascii||r.name),city:r.ko||koreanPlaceName(r.ascii||r.name),transcriptionApproximate:!r.ko,english:r.ascii,region:r.region,population:r.population,feature:r.feature,latitude:r.latitude,longitude:r.longitude};});
 return {cities,total,nextOffset:start+rows.length<total?start+rows.length:null,countryCode:country?.code||null,dataStats:cityDataStats,source:'local-geonames'};
}
