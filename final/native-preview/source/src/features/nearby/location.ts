import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Coordinates } from './api';
export class LocationUnavailable extends Error {
  settings:boolean;
  constructor(message:string,settings=false) {super(message);this.settings=settings;}
}
export async function currentCoordinates():Promise<Coordinates> {
  let permissionTimer:ReturnType<typeof setTimeout>|undefined;
  try {
    return await Promise.race([
      readCoordinates(),
      new Promise<never>((_,reject)=>{permissionTimer=setTimeout(()=>reject(new LocationUnavailable('위치 응답이 지연되고 있어요. 위치 권한과 기기 설정을 확인해 주세요.',true)),25000);}),
    ]);
  }
  catch(error) {
    if(error instanceof LocationUnavailable)throw error;
    throw new LocationUnavailable('현재 위치를 확인하지 못했어요. 앱의 위치 권한을 확인해 주세요.',true);
  } finally {if(permissionTimer)clearTimeout(permissionTimer);}
}
async function readCoordinates():Promise<Coordinates> {
  let permission=await Location.getForegroundPermissionsAsync();
  if(!permission.granted && permission.canAskAgain)permission=await Location.requestForegroundPermissionsAsync();
  if(!permission.granted)throw new LocationUnavailable('현재 위치를 허용하면 주변 식당을 찾을 수 있어요.',Platform.OS==='web'||!permission.canAskAgain);
  if(!await Location.hasServicesEnabledAsync())throw new LocationUnavailable('기기의 위치 서비스를 켜 주세요.',true);
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
    const position=await Promise.race([
      Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High,...(Platform.OS==='web'?{maximumAge:0,timeout:15000}:{})}),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new LocationUnavailable('현재 위치를 확인하지 못했어요. 위치 설정을 확인하고 다시 시도해 주세요.')),15000);}),
    ]);
    return {latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy};
  } catch(error) {
    if(error instanceof LocationUnavailable)throw error;
    throw new LocationUnavailable('현재 위치를 확인하지 못했어요. 위치 설정을 확인해 주세요.',true);
  } finally {if(timer)clearTimeout(timer);}
}
