import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { Button } from '@/components/Button';
import { menuBoardSchema, type MenuBoard } from '@/data/menu-schema';
import { loadMenuPhotos, MenuPhotoError } from '@/lib/menu-photos';
import { createOrderRoom } from '@/lib/shared-order';
import { nativeCall, installBridge } from './bridge';
import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/global.css';
import '@/styles/components.css';
import '@/styles/screens.css';
import '@/styles/figma-flow.css';
import './mobile.css';

type Bootstrap={name:string;country:string;mode:'analyze'|'resume'|'join';invite?:string;storage:Record<string,string>;sourceLabel?:string};
function Embedded({config}:{config:Bootstrap}) {
  const [board,setBoard]=useState<MenuBoard>();
  const [busy,setBusy]=useState(config.mode==='analyze');
  const [message,setMessage]=useState(config.mode==='analyze'?'메뉴를 한국식으로 설명하고 있어요':'');
  const started=useRef(false),photoBusy=useRef(false);
  const photosController=useRef<AbortController|null>(null);
  useEffect(()=>()=>photosController.current?.abort(),[]);
  async function photos(value:MenuBoard) {
    if(photoBusy.current)return;
    photoBusy.current=true;setMessage('음식 사진을 확인하고 있어요');
    const controller=new AbortController();photosController.current=controller;
    try {await loadMenuPhotos(value,AbortSignal.any([controller.signal,AbortSignal.timeout(300000)]),setBoard,setMessage);setMessage('');}
    catch(error){if(controller.signal.aborted)return;if(error instanceof MenuPhotoError)setBoard(error.board);setMessage(error instanceof Error?error.message:'음식 사진을 불러오지 못했어요');}
    finally{photoBusy.current=false;}
  }
  useEffect(()=>{
    if(started.current||config.mode!=='analyze')return;started.current=true;
    void nativeCall<{board:unknown}>('analyze').then(value=>{
      const next=menuBoardSchema.parse(value.board);
      const region=['IT','FR','ES','PT','DE','AT','GR'].includes(config.country)?config.country:config.country?'OTHER':'UNKNOWN';
      next.dining={partySize:null,region:region as NonNullable<MenuBoard['dining']>['region']};
      localStorage.removeItem('meide.shared-room.v1');
      window.location.hash='/menu';setBoard(next);setBusy(false);setMessage('');
    }).catch(error=>{setBusy(false);setMessage(error instanceof Error?error.message:'메뉴를 불러오지 못했어요');});
  },[config]);
  async function share(value:MenuBoard,open:(id:string)=>void) {
    if(photoBusy.current){setMessage('사진 확인을 마친 뒤 함께 고를 수 있어요');return;}
    try {
      const created=await createOrderRoom(value,config.name);
      open(created.roomId);
      const result=await nativeCall<{copied?:boolean}|null>('share',{invite:created.invite});
      setMessage(result?.copied?'초대 링크를 복사했어요':'');
    } catch(error){setMessage(error instanceof Error?error.message:'동반인 공유를 시작하지 못했어요');}
  }
  const empty=config.mode==='analyze'&&!board;
  return <>{empty?<main className="page"><div className="page-content stack-xl"><h1 className="t-headline-md">메뉴를 확인하고 있어요</h1><p className="t-body-md" role="status">{message}</p><p className="t-body-sm muted">{config.sourceLabel} · Gemini가 음식 설명을 만들어요. 원문과 가격을 확인해 주세요.</p>{!busy&&<Button onClick={()=>void nativeCall('exit')}>돌아가기</Button>}</div></main>:<><App initialBoard={board} embeddedName={config.name} embeddedInvite={config.invite} onBackToPrevious={()=>void nativeCall('exit')} onShareBoard={(value,open)=>void share(value,open)} onPhotos={value=>void photos(value)}/>{message&&<div className="embedded-notice t-body-sm" role="status">{message}</div>}</>}</>;
}
async function main(){
 const config=await nativeCall<Bootstrap>('bootstrap');
 installBridge(config.storage);
 if(config.mode==='join'&&config.invite)window.location.hash=`/join/${config.invite}`;
 else window.location.hash='/menu';
 createRoot(document.getElementById('root')!).render(<Embedded config={config}/>);
}
void main().catch(()=>{document.getElementById('root')!.textContent='화면을 연결하지 못했어요. 뒤로 갔다가 다시 열어 주세요.';});
