import {apiRequest} from './api-client.js';
let configPromise,mapsPromise;
export function getMapConfig(){return configPromise??=apiRequest('/api/menu/status',{timeoutMs:15000}).catch(e=>{configPromise=null;throw e})}
async function loadMaps(key){
 if(window.google?.maps?.importLibrary)return;
 mapsPromise??=new Promise((resolve,reject)=>{
  window.hanipGoogleMapReady=()=>{delete window.hanipGoogleMapReady;resolve()};
  const script=document.createElement('script');script.async=true;script.src='https://maps.googleapis.com/maps/api/js?'+new URLSearchParams({key,loading:'async',callback:'hanipGoogleMapReady',v:'weekly',language:'ko'});script.onerror=()=>{script.remove();delete window.hanipGoogleMapReady;mapsPromise=null;reject(Error('구글 지도를 불러오지 못했어요.'))};document.head.append(script);
 });return mapsPromise;
}
export async function mountGoogleMap(container,rows,position,onSelect,onSearch){
 try{
  const config=await getMapConfig();if(!container.isConnected)return;
  if(!config.mapsKey){const first=rows[0],query=first?[first.name,first.address].filter(Boolean).join(' '):position?position.lat+','+position.lng:'';if(query){const frame=document.createElement('iframe');frame.title=first?first.name+' Google 지도':'주변 Google 지도';frame.src='https://maps.google.com/maps?'+new URLSearchParams({q:query,z:'17',output:'embed',hl:'ko'});frame.referrerPolicy='strict-origin-when-cross-origin';frame.style.cssText='width:100%;height:100%;border:0;display:block';container.replaceChildren(frame);return;}container.textContent='식당을 검색하면 Google 지도에서 위치를 볼 수 있어요.';container.classList.add('google-map-unavailable');return;}
  await loadMaps(config.mapsKey);if(!container.isConnected)return;
  const [{Map},{AdvancedMarkerElement}]=await Promise.all([google.maps.importLibrary('maps'),google.maps.importLibrary('marker')]);if(!container.isConnected)return;
  const center=rows[0]||position;container.textContent='';
  const map=new Map(container,{center:center?{lat:center.lat,lng:center.lng}:{lat:48.8566,lng:2.3522},zoom:center?17:4,mapId:config.mapId,disableDefaultUI:true,gestureHandling:'greedy',clickableIcons:false});
  rows.forEach((p,n)=>{if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng))return;const label=document.createElement('span');label.className='google-place-marker';label.textContent=String(n+1);const marker=new AdvancedMarkerElement({map,position:{lat:p.lat,lng:p.lng},title:p.name,content:label});marker.addListener('click',()=>onSelect(p.id))});
  map.addListener('dragend',()=>{const c=map.getCenter();onSearch({lat:c.lat(),lng:c.lng()})});
 }catch(e){if(container.isConnected){container.textContent=e.message;container.classList.add('google-map-unavailable')}}
}
