import {apiBaseUrl} from './api-config.js';
export function normalizeApiBase(value='') {
 const text=value.trim();if(!text)return '';
 let url;try{url=new URL(text)}catch{throw Error('API 서버 주소는 올바른 HTTPS 주소여야 해요.')}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('API 서버 주소는 경로나 인증 정보가 없는 HTTPS 주소여야 해요.');
 return url.origin;
}
export function apiUrl(path,{base=apiBaseUrl,native=globalThis.Capacitor?.isNativePlatform?.()||false}={}) {
 if(!/^\/api\/[a-z0-9/_-]+$/i.test(path))throw Error('지원하지 않는 API 경로예요.');
 const origin=normalizeApiBase(base);
 if(native&&!origin)throw Error('앱의 서버 연결이 설정되지 않았어요. 새 앱 버전을 설치해주세요.');
 return origin+path;
}
export async function apiRequest(path,{body,signal,timeoutMs=115000,fetchImpl=globalThis.fetch,...routing}={}) {
 const url=apiUrl(path,routing),controller=new AbortController();let timedOut=false;
 const abort=()=>controller.abort(signal?.reason);
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort()},timeoutMs);
 try {
  const response=await fetchImpl(url,{method:body===undefined?'GET':'POST',headers:body===undefined?{'Accept':'application/json'}:{'Accept':'application/json','Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
  let data;try{data=await response.json()}catch{throw Error([401,403].includes(response.status)?'앱 서버의 접근 권한 설정이 필요해요.':'서버 응답을 읽지 못했어요. 잠시 후 다시 시도해주세요.')}
  if(!response.ok)throw Error(typeof data?.error==='string'?data.error:'요청을 처리하지 못했어요.');
  return data;
 }catch(error){
  if(signal?.aborted)throw error;
  if(timedOut)throw Error('서버 응답이 늦어지고 있어요. 잠시 후 다시 시도해주세요.');
  if(error instanceof TypeError)throw Error('서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.');
  throw error;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}

export function apiAssetUrl(value,{base=apiBaseUrl}={}){if(typeof value!=='string'||!value.startsWith('/api/menu/photo?token='))throw Error('지원하지 않는 사진 주소예요.');return normalizeApiBase(base)+value;}
