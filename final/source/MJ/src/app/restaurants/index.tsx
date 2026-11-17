import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { NearbyRestaurantsView } from '../../features/nearby/NearbyRestaurantsView';
import { useNearby } from '../../features/nearby/NearbyProvider';
import { currentCoordinates, LocationUnavailable } from '../../features/nearby/location';
import { type Coordinates, type NearbyPlace, type NearbyResult } from '../../features/nearby/api';
import { useProgress } from '../../state/ProgressProvider';
import { destination } from '../../state/model';
export default function NearbyRestaurants() {
  const {progress}=useProgress(),{last,search}=useNearby();
  const [center,setCenter]=useState<Coordinates|null>(null),[result,setResult]=useState<NearbyResult|null>(null);
  const [radius,setRadius]=useState(last?.radius??500),[recenter,setRecenter]=useState(0);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null),[settings,setSettings]=useState(false);
  const working=useRef(false),generation=useRef(0);
  async function locate(nextRadius=radius) {
    if(working.current)return;working.current=true;
    const run=++generation.current;
    setBusy(true);setMessage(null);setSettings(false);setResult(null);setCenter(null);
    try {
      const measured=await currentCoordinates();
      if(run!==generation.current)return;
      setCenter(measured);setRadius(nextRadius);setRecenter(value=>value+1);
      const found=await search(measured,nextRadius);
      if(run!==generation.current)return;
      setResult(found);
      if((measured.accuracy??0)>500)setMessage('기기에서 대략적인 위치를 받았어요. 위치 정확도 설정을 확인해 주세요.');
    }catch(error){if(run===generation.current){setMessage(error instanceof Error?error.message:'주변 식당을 불러오지 못했어요.');setSettings(error instanceof LocationUnavailable&&error.settings);}}
    finally{if(run===generation.current){working.current=false;setBusy(false);}}
  }
  const locateLatest=useRef(locate);
  useEffect(()=>{locateLatest.current=locate;});
  // Always measure on entry; only the search result is cached, never the GPS fix.
  useFocusEffect(useCallback(()=>{
    if(progress.stage==='home'&&progress.profileId)void locateLatest.current();
    return ()=>{generation.current++;working.current=false;};
  },[progress.stage,progress.profileId]));
  async function open(uri:string|null) {
    if(!uri || !/^https:\/\//i.test(uri))return;
    try{await Linking.openURL(uri);}catch{setMessage('Google Maps를 열지 못했어요.');}
  }
  function openPlace(place:NearbyPlace) {void open(place.googleMapsUri??'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place.name)+'&query_place_id='+encodeURIComponent(place.id));}
  if(progress.stage!=='home')return <Redirect href={destination(progress)} />;
  return <NearbyRestaurantsView result={result} center={center} radius={radius} recenter={recenter} busy={busy} message={message} settings={settings} onBack={()=>router.replace('/home')} onLocate={()=>void locate()} onRadius={value=>void locate(value)} onOpenPlace={openPlace} onSettings={()=>{if(Platform.OS==='web')setMessage('브라우저의 이 사이트 권한에서 위치를 허용한 뒤 현재 위치 버튼을 눌러 주세요.');else void Linking.openSettings().catch(()=>setMessage('기기 설정에서 Meide의 위치 권한을 허용해 주세요.'));}} />;
}
