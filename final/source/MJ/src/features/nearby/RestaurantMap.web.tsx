/// <reference types="google.maps" />
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { useProgress } from '../../state/ProgressProvider';
import { authorizeWebMap } from './api';
import { MapUnavailable } from './MapUnavailable';
import type { RestaurantMapProps } from './RestaurantMap.types';

let configured=false;
type Libraries={maps:google.maps.MapsLibrary;marker:google.maps.MarkerLibrary};

export function RestaurantMap({center,radius,places,selectedId,recenter,onSelect}:RestaurantMapProps) {
  const {progress}=useProgress();
  const profile=useRef(progress),request=useRef<Promise<string>|null>(null);
  const container=useRef<HTMLDivElement>(null);
  const map=useRef<google.maps.Map|null>(null);
  const initial=useRef(center),select=useRef(onSelect);
  const [libraries,setLibraries]=useState<Libraries|null>(null),[failed,setFailed]=useState(false),[denied,setDenied]=useState<string|null>(null);
  useEffect(()=>{select.current=onSelect;},[onSelect]);
  useEffect(()=>{
    if(!container.current)return;
    let active=true;
    let timer:ReturnType<typeof setTimeout>|undefined;
    // Reuse only an in-flight authorization during Strict Mode effect replay.
    // Every actual new map instance receives a fresh durable reservation.
    request.current??=authorizeWebMap(profile.current,randomUUID());
    void request.current.then(async apiKey=>{
      if(!active)return;
      if(!configured){setOptions({key:apiKey,v:'quarterly',language:'ko'});configured=true;}
      timer=setTimeout(()=>{if(active)setFailed(true);},20000);
      const [maps,marker]=await Promise.all([importLibrary('maps'),importLibrary('marker')]);
      if(!active||!container.current)return;
      map.current=new maps.Map(container.current,{
        center:{lat:initial.current.latitude,lng:initial.current.longitude},zoom:16,
        mapId:process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_MAP_ID||'DEMO_MAP_ID',
        disableDefaultUI:true,zoomControl:true,zoomControlOptions:{position:google.maps.ControlPosition.LEFT_CENTER},
        gestureHandling:'greedy',clickableIcons:false,keyboardShortcuts:true,
      });
      map.current.addListener('tilesloaded',()=>{clearTimeout(timer);if(active)setFailed(false);});
      setLibraries({maps,marker});
    }).catch(error=>{clearTimeout(timer);if(active)setDenied(error instanceof Error?error.message:'지도를 불러오지 못했어요.');});
    return ()=>{active=false;clearTimeout(timer);if(map.current)google.maps.event.clearInstanceListeners(map.current);map.current=null;};
  },[]);
  useEffect(()=>{
    if(!libraries||!map.current)return;
    const position={lat:center.latitude,lng:center.longitude};
    const area=new libraries.maps.Circle({map:map.current,center:position,radius,strokeColor:'#17683E',strokeOpacity:0.3,strokeWeight:1,fillColor:'#17683E',fillOpacity:0.06,clickable:false});
    const pin=new libraries.marker.PinElement({background:'#4285F4',borderColor:'#FFF',glyphColor:'#FFF',scale:0.8});
    const location=new libraries.marker.AdvancedMarkerElement({map:map.current,position,title:'현재 위치',content:pin.element,zIndex:100});
    const bounds=area.getBounds();
    if(bounds)map.current.fitBounds(bounds,{top:55,right:32,bottom:40,left:32});
    return ()=>{area.setMap(null);location.map=null;};
  },[center,radius,recenter,libraries]);
  useEffect(()=>{
    if(!libraries||!map.current)return;
    const markers=places.map(place=>{
      const pin=new libraries.marker.PinElement({background:place.id===selectedId?'#E3A523':'#17683E',borderColor:'#FFF',glyphColor:'#FFF',scale:0.8});
      const marker=new libraries.marker.AdvancedMarkerElement({map:map.current,position:{lat:place.location.latitude,lng:place.location.longitude},title:place.name,content:pin.element,zIndex:place.id===selectedId?200:1});
      marker.addListener('click',()=>select.current(place));
      return marker;
    });
    return ()=>{markers.forEach(marker=>{google.maps.event.clearInstanceListeners(marker);marker.map=null;});};
  },[places,selectedId,libraries]);
  useEffect(()=>{
    const place=places.find(item=>item.id===selectedId);
    if(place&&map.current)map.current.panTo({lat:place.location.latitude,lng:place.location.longitude});
  },[selectedId,places,libraries]);
  if(denied)return <MapUnavailable message={denied} />;
  return <div style={{width:'100%',height:'100%',position:'relative'}}>
    <div ref={container} aria-label="현재 위치 주변 식당 지도" style={{width:'100%',height:'100%'}} />
    {failed&&<div style={{position:'absolute',top:'35%',left:32,right:32,padding:14,background:'#FFF',borderRadius:12,fontSize:13,lineHeight:'21px',color:'#626773'}}>지도를 불러오지 못했어요. 아래 목록에서 주변 식당을 확인할 수 있어요.</div>}
  </div>;
}
