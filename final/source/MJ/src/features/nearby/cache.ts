import type { Coordinates, NearbyResult } from './api';

export type NearbyEntry = { result:NearbyResult; profileId:string; receivedAt:number };
export const CACHE_AGE_MS = 5 * 60 * 1000;

export function distanceBetween(a:Coordinates,b:Coordinates) {
  const radians = (degrees:number) => degrees * Math.PI / 180;
  const h = Math.sin(radians(b.latitude-a.latitude)/2)**2
    + Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(radians(b.longitude-a.longitude)/2)**2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
}

export function cachedNearby(entries:NearbyEntry[],profileId:string,center:Coordinates,radius:number,now=Date.now()) {
  return entries.find(entry => entry.profileId===profileId && entry.result.radius===radius
    && now>=entry.receivedAt && now-entry.receivedAt<CACHE_AGE_MS && distanceBetween(entry.result.center,center)<=30);
}

export function mapRegion(center:Coordinates,radius:number) {
  const latitudeDelta = radius * 2.8 / 111320;
  return {...center,latitudeDelta,longitudeDelta:Math.min(360,latitudeDelta/Math.max(0.01,Math.cos(center.latitude*Math.PI/180)))};
}
