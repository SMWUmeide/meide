import { Platform } from 'react-native';
import type { Progress } from '../../state/model';
export async function orderRequest(profile:Progress,path:string,body:object,signal?:AbortSignal) {
  if(!profile.profileId||!profile.profileToken)throw new Error('사용자 정보를 확인해 주세요.');
  const base=process.env.EXPO_PUBLIC_COMPANION_API_URL?.replace(/\/$/,'')??(Platform.OS==='web'?'':null);
  if(base===null)throw new Error('메뉴 서버를 연결해 주세요.');
  const response=await fetch(`${base}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,id:profile.profileId,token:profile.profileToken}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(115000)]):AbortSignal.timeout(115000)});
  const data=await response.json();
  return {status:response.status,body:data};
}
