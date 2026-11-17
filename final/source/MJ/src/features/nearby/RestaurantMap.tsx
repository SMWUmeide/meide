import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { mapRegion } from './cache';
import { MapUnavailable } from './MapUnavailable';
import type { RestaurantMapProps } from './RestaurantMap.types';

export function RestaurantMap({center,radius,places,selectedId,recenter,onSelect}:RestaurantMapProps) {
  const map=useRef<MapView>(null),[ready,setReady]=useState(false);
  const configured=Platform.OS==='android'
    ? Constants.expoConfig?.extra?.googleMapsAndroidConfigured
    : Constants.expoConfig?.extra?.googleMapsIosConfigured;
  useEffect(()=>{
    if(ready)map.current?.animateToRegion(mapRegion(center,radius),350);
  },[center,radius,recenter,ready]);
  useEffect(()=>{
    const selected=places.find(place=>place.id===selectedId);
    if(ready&&selected)map.current?.animateCamera({center:selected.location},{duration:300});
  },[selectedId,places,ready]);
  if(!configured&&Constants.appOwnership!=='expo')return <MapUnavailable />;
  return <MapView ref={map} provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFill}
    initialRegion={mapRegion(center,radius)} onMapReady={()=>setReady(true)}
    accessibilityLabel="현재 위치 주변 식당 지도" toolbarEnabled={false} showsMyLocationButton={false}
    showsCompass={false} showsPointsOfInterests={false} rotateEnabled={false} pitchEnabled={false}>
    <Circle center={center} radius={radius} strokeColor="rgba(23,104,62,0.3)" fillColor="rgba(23,104,62,0.06)" strokeWidth={1} />
    <Circle center={center} radius={Math.min(center.accuracy??15,radius)} strokeWidth={0} fillColor="rgba(66,133,244,0.13)" />
    <Marker coordinate={center} title="현재 위치" pinColor="#4285F4" zIndex={100} />
    {places.map(place=><Marker key={place.id} identifier={place.id} coordinate={place.location}
      title={place.name} description={place.category} pinColor={place.id===selectedId?'#E3A523':'#17683E'}
      zIndex={place.id===selectedId?200:1} onPress={()=>onSelect(place)} />)}
  </MapView>;
}
