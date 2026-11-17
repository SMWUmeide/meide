import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { randomUUID } from 'expo-crypto';
import { fetchNearby, nearbyStatus, type Coordinates, type NearbyResult } from './api';
import { cachedNearby, type NearbyEntry } from './cache';
import { useProgress } from '../../state/ProgressProvider';
const Context=createContext<{last:NearbyResult|null;search:(center:Coordinates,radius:number)=>Promise<NearbyResult>}|null>(null);
export function NearbyProvider({children}:{children:ReactNode}) {
  const {progress}=useProgress();
  const [entry,setEntry]=useState<NearbyEntry|null>(null);
  const cache=useRef<NearbyEntry[]>([]);
  const pending=useRef(new Map<string,Promise<NearbyResult>>());
  const search=useCallback(async(center:Coordinates,radius:number)=>{
    if(!progress.profileId)throw Error('사용자 정보를 확인해 주세요.');
    const hit=cachedNearby(cache.current,progress.profileId,center,radius);
    if(hit){setEntry(hit);return hit.result;}
    const key=[progress.profileId,radius,center.latitude,center.longitude].join(':');
    const existing=pending.current.get(key);
    if(existing)return existing;
    const task=(async()=>{
      const status=await nearbyStatus(progress);
      if(!status.ready)throw Error(status.message);
      return fetchNearby(progress,center,radius,randomUUID());
    })();
    pending.current.set(key,task);
    try {
      const result=await task;
      const next={result,profileId:progress.profileId,receivedAt:Date.now()};
      cache.current=[next,...cache.current].slice(0,3);setEntry(next);return result;
    }finally{pending.current.delete(key);}
  },[progress]);
  // Coordinates and Google content exist only in this running app session.
  return <Context.Provider value={{last:entry && entry.profileId===progress.profileId?entry.result:null,search}}>{children}</Context.Provider>;
}
export function useNearby(){const value=useContext(Context);if(!value)throw Error('NearbyProvider is required');return value;}
