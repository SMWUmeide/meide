import {searchLocalCities} from './city-database.mjs';
import {europeanCountries,popularDestinations,cityAliases,normalize,matchingCountries} from './public/destinations.js';
export async function searchDestinations(body,fetcher=fetch,localSearch=searchLocalCities){
 const q=String(body.query||'').trim().slice(0,100);if(!q&&!body.countryCode)return {countries:[],cities:[],message:''};
 const countries=q?matchingCountries(q):[],allowed=new Set(europeanCountries.map(c=>c.code));
 let code=allowed.has(body.countryCode)?body.countryCode:null,cityQuery=q;
 for(const c of europeanCountries)for(const alias of [c.country,c.english])if(q.toLowerCase().startsWith(alias.toLowerCase())&&q.length>alias.length){code=c.code;cityQuery=q.slice(alias.length).replace(/^[\s·,]+/,'');}
 const localQuery=cityQuery;const alias=cityAliases.find(([k,e])=>normalize(k)===normalize(cityQuery)||normalize(e)===normalize(cityQuery));if(alias)cityQuery=alias[1];
 const exactCountry=countries.find(c=>[c.country,c.english,c.code].some(v=>normalize(v)===normalize(q)));
 if(exactCountry){code=exactCountry.code;cityQuery='';}
 let local=localSearch?localSearch(exactCountry?'':/[가-힣]/.test(localQuery)?localQuery:cityQuery,code,Number(body.offset||0)):null;
 if(local&&local.total===0&&alias)local=localSearch(cityQuery,code,Number(body.offset||0));
 if(local){if(alias)local.cities=local.cities.map(c=>!/[가-힣]/.test(c.city)&&normalize(c.english)===normalize(alias[1])?{...c,city:alias[0],name:alias[0]}:c);return {...local,countries,message:local.total?`${code?(europeanCountries.find(c=>c.code===code)?.country+' · '):''}도시·마을 ${local.total.toLocaleString('ko-KR')}곳${local.nextOffset!==null?' · 더 보기로 계속 볼 수 있어요.':''}`:'일치하는 도시·마을이 없습니다. 영문 또는 다른 표기로 검색해주세요.'};}
 if(exactCountry)return {countries,cities:popularDestinations.filter(c=>c.code===exactCountry.code),message:'국가를 선택하거나 도시 이름을 함께 검색해주세요.'};
 if(cityQuery.length<2)return {countries,cities:[],message:'도시 이름은 두 글자 이상 입력해주세요.'};
 const fallback=popularDestinations.filter(c=>[c.city,c.english,c.country].some(v=>normalize(v).includes(normalize(q))));
 try{
  const params=new URLSearchParams({name:cityQuery,count:'100',language:'ko',format:'json',...(code?{countryCode:code}:{})});
  const response=await fetcher('https://geocoding-api.open-meteo.com/v1/search?'+params,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('geocoding');
  const data=await response.json(),seen=new Set();
  const cities=(data.results||[]).filter(r=>allowed.has(r.country_code)&&(!r.feature_code||r.feature_code.startsWith('P'))).sort((a,b)=>(b.population||0)-(a.population||0)).filter(r=>{const id=String(r.id);if(seen.has(id))return false;seen.add(id);return true;}).slice(0,40).map(r=>{
   const c=europeanCountries.find(c=>c.code===r.country_code),translated=alias&&[alias[0],alias[1]].some(v=>normalize(v)===normalize(r.name)),name=translated?alias[0]:r.name;
   return {...c,id:'geo-'+r.id,kind:'city',name,city:name,english:translated?alias[1]:r.name,region:r.admin1||'',latitude:r.latitude,longitude:r.longitude};
  });
  return {countries,cities:cities.length?cities:fallback,message:!countries.length&&!cities.length&&!fallback.length?'검색 결과가 없습니다. 다른 표기나 영문 도시명으로 검색해주세요.':''};
 }catch{return {countries,cities:fallback,message:'도시 검색에 연결하지 못했습니다. 잠시 후 다시 검색해주세요. 국가와 인기 여행지는 선택할 수 있습니다.',unavailable:true};}
}
