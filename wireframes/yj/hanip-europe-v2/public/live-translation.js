import {italianOrder} from './italian-order.js';
const languages=new Set(['ko','it','fr','es','de','pt','en']);
const cache=new Map();
export async function translateText({text,source,target},fetcher=fetch){
 if(!languages.has(source)||!languages.has(target))throw Error('지원하지 않는 번역 언어입니다.');
 if(typeof text!=='string'||!text.trim()||text.length>500)throw Error('번역할 문장을 500자 이내로 입력해주세요.');
 text=text.trim();if(source===target)return {text,source,target};
 const key=JSON.stringify([text,source,target]);if(cache.has(key))return cache.get(key);
 const chunks=[];let part='';for(const char of text){if(new TextEncoder().encode(part+char).length>480){chunks.push(part);part='';}part+=char;}if(part)chunks.push(part);
 const translated=[];for(const chunk of chunks){const url=new URL('https://api.mymemory.translated.net/get');url.search=new URLSearchParams({q:chunk,langpair:source+'|'+target,mt:'1'}).toString();let r;try{r=await fetcher(url,{signal:AbortSignal.timeout(18000)});}catch{throw Error('번역 서비스에 연결하지 못했어요. 다시 시도해주세요.');}if(!r.ok)throw Error('번역 서비스가 응답하지 않아요. 잠시 후 다시 시도해주세요.');const data=await r.json();if(Number(data.responseStatus)!==200||!data.responseData?.translatedText||data.quotaFinished)throw Error('무료 번역 이용 한도 또는 서비스 오류로 번역하지 못했어요. 잠시 후 다시 시도해주세요.');translated.push(data.responseData.translatedText);}
 const result={text:translated.join(' '),source,target,provider:'MyMemory'};if(cache.size>=150)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
export async function translateOrderRequest(body,fetcher=fetch){
 const {items,language,request=''}=body;if(!languages.has(language)||language==='ko'||!Array.isArray(items)||!items.length||items.length>100||typeof request!=='string'||request.length>500)throw Error('주문 정보를 확인해주세요.');
 if(items.some(i=>typeof i.original!=='string'||i.original.length>250||typeof i.korean!=='string'||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>198))throw Error('음식과 수량을 확인해주세요.');
 const prefix={it:'Vorremmo ordinare',fr:'Nous voudrions commander',es:'Nos gustaría pedir',de:'Wir möchten bestellen',pt:'Gostaríamos de pedir',en:'We would like to order'};
 const base=language==='it'?italianOrder(items):null;
 const order=base||{text:prefix[language]+' '+items.map(i=>i.quantity+' × '+i.original).join(', ')+'.',korean:items.map(i=>i.korean+' '+i.quantity+'인분').join(', ')+' 주세요.'};
 if(request.trim()){const translation=await translateText({text:request,source:'ko',target:language},fetcher);order.text+=' '+translation.text;order.korean+=' '+request.trim();order.pronunciation='';}
 return {...order,language};
}
