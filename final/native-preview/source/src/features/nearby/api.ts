import { Platform } from 'react-native';
import type { Progress } from '../../state/model';
import { issueInvite } from '../companions/api';
export type Coordinates = { latitude:number; longitude:number; accuracy?:number|null };
export type NearbyCategory = 'all' | 'asian' | 'korean';
export type NearbyPlace = {
  id:string; name:string; address:string; category:string; location:Coordinates; distanceMeters:number;
  rating:number|null; reviewCount:number; googleMapsUri:string|null;
  cuisine:{korean:boolean;asian:boolean;source:string}; attributions:{name:string;uri:string|null}[];
};
export type NearbyGroup = { places:NearbyPlace[]; incomplete:boolean };
export type NearbyResult = { center:Coordinates; radius:number; groups:Record<NearbyCategory,NearbyGroup>; fetchedAt:number };
export type NearbyStatus = { ready:boolean; remaining?:number; message:string };
type Profile = Pick<Progress,'profileId'|'profileToken'|'name'>;
async function request(path:string,profile:Profile,body:object={}) {
  const base=process.env.EXPO_PUBLIC_COMPANION_API_URL?.replace(/\/$/,'') ?? (Platform.OS==='web'?'':null);
  if(base===null)throw Error('주변 식당 서버에 연결할 수 없어요.');
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),45000);
  try {
    const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,id:profile.profileId,token:profile.profileToken}),signal:controller.signal});
    const data=await response.json();
    if(!response.ok)throw Error(data.error??'주변 식당을 불러오지 못했어요.');
    return data;
  } catch(error) {
    if(error instanceof Error && error.name==='AbortError')throw Error('응답 시간이 초과됐어요. 자동 재시도하지 않았어요.');
    if(error instanceof TypeError)throw Error('인터넷 연결을 확인해 주세요.');
    throw error;
  } finally { clearTimeout(timer); }
}
export async function nearbyStatus(profile:Profile):Promise<NearbyStatus> {
  if(!profile.profileId||!profile.profileToken)throw Error('사용자 정보를 확인해 주세요.');
  await issueInvite(profile.profileId,profile.profileToken,profile.name);
  return request('/api/restaurants/status',profile);
}
export async function fetchNearby(profile:Profile,center:Coordinates,radius:number,requestId:string):Promise<NearbyResult> {
  const data=await request('/api/restaurants/nearby',profile,{latitude:center.latitude,longitude:center.longitude,radius,requestId,consent:true});
  if(!data.result?.groups?.all || !data.result.groups.asian || !data.result.groups.korean)throw Error('검색 결과를 확인하지 못했어요.');
  return data.result;
}
export async function authorizeWebMap(profile:Profile,requestId:string):Promise<string> {
  if(!profile.profileId||!profile.profileToken)throw Error('사용자 정보를 확인해 주세요.');
  await issueInvite(profile.profileId,profile.profileToken,profile.name);
  const data=await request('/api/restaurants/map-access',profile,{requestId});
  if(typeof data.apiKey!=='string'||!data.apiKey)throw Error('지도 연결을 확인해 주세요.');
  return data.apiKey;
}
