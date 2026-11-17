import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgress } from '../../state/ProgressProvider';
import { useMenuPhotos } from '../menu-camera/MenuPhotosProvider';
import { issueInvite } from '../companions/api';
import { currentTravelDestination } from '../travel/catalog';
import { OrderFrame } from './OrderFrame';
import { orderRequest } from './api';
import { ORDER_CHANNEL, parseOrderMessage, parseOrderStorage, type OrderFrameHandle } from './protocol';
// Generated from the checked-in YJ source by scripts/build-embedded.mjs.
import embedded from '../../../assets/ordering/embedded.json';
import { Button } from '../../components/ui';

export function OrderingScreen({photoId,invite}:{photoId?:string;invite?:string}) {
  const {progress}=useProgress();
  const {menus}=useMenuPhotos();
  const menu=photoId?menus[photoId]:undefined;
  const frame=useRef<OrderFrameHandle>(null);
  const [storage,setStorage]=useState<Record<string,string>|null>(null);
  const [error,setError]=useState('');
  const storeKey=`meide.orders.native.v1.${progress.profileId}`;
  const saveQueue=useRef(Promise.resolve());
  const analysis=useRef<Promise<unknown>|null>(null);
  const mounted=useRef(true);
  const requests=useRef(new AbortController());
  useEffect(()=>{
    mounted.current=true;requests.current=new AbortController();
    AsyncStorage.getItem(storeKey).then(raw=>{if(mounted.current)setStorage(parseOrderStorage(raw?JSON.parse(raw):{}));}).catch(()=>{if(mounted.current)setError('저장된 메뉴를 읽지 못했어요. 다시 열어 주세요.');});
    return()=>{mounted.current=false;requests.current.abort();void Speech.stop();};
  },[storeKey]);
  useFocusEffect(useCallback(()=>{
    const back=BackHandler.addEventListener('hardwareBackPress',()=>{frame.current?.send(JSON.stringify({channel:ORDER_CHANNEL,action:'back'}));return true;});
    return()=>back.remove();
  },[]));
  const handle=useCallback(async (raw:string)=>{
    const message=parseOrderMessage(raw);if(!message||!storage)return;
    const reply=(result:unknown,error?:string)=>{if(mounted.current)frame.current?.send(JSON.stringify({channel:ORDER_CHANNEL,id:message.id,result,error}));};
    try {
      let result:unknown=null;
      if(message.action==='bootstrap') {
        const destination=currentTravelDestination(progress);
        const country=progress.travelDestinationEnabled===false?'':destination.code??destination.id.slice(0,2).toUpperCase();
        result={name:progress.name,country,mode:invite?'join':photoId?'analyze':'resume',invite,storage,sourceLabel:menu?.menuSource==='website'?'식당 웹사이트 메뉴':'촬영한 메뉴판'};
      } else if(message.action==='save') {
        const next=parseOrderStorage(message.payload);
        saveQueue.current=saveQueue.current.catch(()=>{}).then(()=>AsyncStorage.setItem(storeKey,JSON.stringify(next)));
        await saveQueue.current;
      } else if(message.action==='analyze') {
        if(!photoId||!menu?.originalText.trim())throw new Error('메뉴판을 다시 선택해 주세요.');
        analysis.current??=(async()=>{
          const cacheKey=`meide.order.analysis.${progress.profileId}.${photoId}`;
          const cached=await AsyncStorage.getItem(cacheKey);if(cached)return JSON.parse(cached);
          await issueInvite(progress.profileId!,progress.profileToken!,progress.name);
          const response=await orderRequest(progress,'/api/menu/process',{requestId:photoId,operation:'interpret',payload:{text:menu.originalText}},requests.current.signal);
          if(response.status!==200)throw new Error(response.body.error??'메뉴를 설명하지 못했어요.');
          const value=response.body.result;
          await AsyncStorage.setItem(cacheKey,JSON.stringify(value));return value;
        })();
        result=await analysis.current;
      } else if(message.action==='api') {
        const payload=message.payload as {endpoint?:unknown;body?:unknown};
        if(!payload||!['/api/menu-photos','/api/translate-request'].includes(String(payload.endpoint)))throw new Error('지원하지 않는 요청이에요.');
        await issueInvite(progress.profileId!,progress.profileToken!,progress.name);
        result=await orderRequest(progress,`/api/ordering/${String(payload.endpoint).split('/').pop()}`,{payload:payload.body},requests.current.signal);
      } else if(message.action==='share') {
        const token=(message.payload as {invite?:unknown})?.invite;
        if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))throw new Error('초대 링크를 확인해 주세요.');
        const base=process.env.EXPO_PUBLIC_INVITE_WEB_URL??'https://meide-api-dxnbcriiga-du.a.run.app';
        const url=`${base.replace(/\/$/,'')}/join/${token}`;
        const text=`${progress.name}님과 함께 메뉴를 골라요`;
        if(Platform.OS==='web') {
          if(navigator.share) await navigator.share({title:'Meide 함께 메뉴 고르기',text,url});
          else {await Clipboard.setStringAsync(url);result={copied:true};}
        } else result=await Share.share({message:`${text}\n${url}`});
      } else if(message.action==='exit') { await saveQueue.current;router.replace('/home'); }
      else if(message.action==='capture') { await saveQueue.current;router.replace('/menu/camera'); }
      else if(message.action==='external') {
        const url=new URL(String(message.payload));if(url.protocol!=='https:'||url.username||url.password)throw new Error('열 수 없는 링크예요.');await Linking.openURL(url.href);
      } else if(message.action==='stopSpeech') await Speech.stop();
      else if(message.action==='speak') {
        const text=message.payload;if(typeof text!=='string'||text.length>4000)throw new Error('읽을 문장을 확인해 주세요.');
        await new Promise<void>((resolve,reject)=>Speech.speak(text,{language:'it-IT',rate:0.85,onDone:resolve,onStopped:resolve,onError:()=>reject(new Error('음성을 재생하지 못했어요.'))}));
      } else throw new Error('지원하지 않는 요청이에요.');
      reply(result);
    } catch(error){reply(null,error instanceof Error?error.message:'요청을 완료하지 못했어요.');}
  },[storage,progress,photoId,invite,menu,storeKey]);
  return <SafeAreaView style={{flex:1,backgroundColor:'#F2F4F6'}}>{error?<View style={{padding:24,gap:24}}><Text>{error}</Text><Button title="홈으로 가기" onPress={()=>router.replace('/home')}/></View>:storage?<OrderFrame ref={frame} html={embedded.html} onMessage={raw=>void handle(raw)} />:<ActivityIndicator accessibilityLabel="메뉴 불러오는 중" />}</SafeAreaView>;
}
