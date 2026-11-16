import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { analyzePhotos } from '@/lib/analyze-menu';
import { loadMenuPhotos, MenuPhotoError } from '@/lib/menu-photos';
import { createOrderRoom } from '@/lib/shared-order';
import type { MenuBoard } from '@/data/menu-schema';
import { Toolbar } from '../shared';
export function TestSetup({board,onBoard,onPhotos,onRoom,onMenu}:{board:MenuBoard;onBoard:(board:MenuBoard)=>void;onPhotos:(board:MenuBoard)=>void;onRoom:(id:string)=>void;onMenu:()=>void}) {
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const [files,setFiles]=useState<File[]>([]),[name,setName]=useState('');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [room,setRoom]=useState<{roomId:string;invite:string}|null>(null);
  async function analyze(){
    const controller = new AbortController(); active.current = controller;
    setBusy(true);setMessage('메뉴판을 분석하고 있어요');
    try {
      const next = await analyzePhotos(files, AbortSignal.any([controller.signal, AbortSignal.timeout(90000)]));
      if (controller.signal.aborted) return;
      onBoard(next); setRoom(null);
      setMessage(`메뉴 ${next.items.length}개를 읽었어요. 음식 사진을 확인하고 있어요`);
      try {
        const photographed = await loadMenuPhotos(next, AbortSignal.any([controller.signal, AbortSignal.timeout(300000)]), next => { if (!controller.signal.aborted) onPhotos(next); });
        setMessage(`메뉴를 분석했어요. 조건에 맞는 사진 ${photographed.items.filter(item=>item.photoUrl).length}/${photographed.items.length}개를 불러왔어요`);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof MenuPhotoError) onPhotos(error.board);
        setMessage(`메뉴 분석은 완료됐어요. ${error instanceof Error ? error.message : '음식 사진을 불러오지 못했어요'}`);
      }
    }
    catch(error){setMessage(error instanceof Error?error.message:'다시 시도해 주세요');}finally{setBusy(false);}
  }
  async function photos(){const controller=new AbortController();active.current=controller;setBusy(true);setMessage('음식 사진을 불러오고 있어요');try{const next=await loadMenuPhotos(board,AbortSignal.any([controller.signal, AbortSignal.timeout(300000)]), next => { if (!controller.signal.aborted) onPhotos(next); } );onPhotos(next);setMessage(`조건에 맞는 사진 ${next.items.filter(item=>item.photoUrl).length}/${next.items.length}개를 불러왔어요. 확인되지 않은 사진은 표시하지 않아요`);}catch(error){if(active.current?.signal.aborted)return;if(error instanceof MenuPhotoError)onPhotos(error.board);setMessage(error instanceof Error?error.message:'다시 시도해 주세요');}finally{setBusy(false);}}
  async function share(){setBusy(true);setMessage('');try{setRoom(await createOrderRoom(board,name));setMessage('초대 링크를 복사해 다른 폰에서 열어 주세요');}catch(error){if(active.current?.signal.aborted)return;if(error instanceof MenuPhotoError)onPhotos(error.board);setMessage(error instanceof Error?error.message:'다시 시도해 주세요');}finally{setBusy(false);}}
  const link=room?`${window.location.origin}/#/join/${room.invite}`:'';
  return <main className="page"><Toolbar title="메뉴판 불러오기" onBack={()=>{if(!busy)onMenu();}}/><div className="page-content stack-xl">
    <p className="t-body-md">실제 메뉴판 사진을 선택해 주세요. AI가 메뉴와 가격을 읽어 드려요.</p>
    <label className="stack-sm"><span>메뉴판 사진 · 최대 6장</span><input type="file" accept="image/*" multiple disabled={busy} onChange={e=>setFiles(Array.from(e.target.files??[]).slice(0,6))}/></label>
    <p className="t-body-sm muted">분석 시 선택한 사진을 Gemini로 전송해요. 현재 EUR 메뉴판을 지원해요. 음식 사진은 Pixabay의 대표 이미지예요. 메뉴 일치 여부와 접시 외곽을 확인하기 위해 후보 사진도 Gemini로 전송해요.</p>
    <Button variant="secondary" disabled={busy||!files.length} onClick={()=>void analyze()}>메뉴판 분석하기</Button>
    <p className="t-body-md">현재 메뉴판: {board.restaurantName} · {board.items.length}개</p>
    <Button variant="secondary" disabled={busy||!board.items.length} onClick={()=>void photos()}>음식 사진 불러오기</Button>
    <label className="stack-sm"><span>동반인에게 보일 이름</span><input className="request-input" value={name} maxLength={20} disabled={busy} onChange={e=>setName(e.target.value)}/></label>
    <Button variant="secondary" disabled={busy||!name.trim()||!board.items.length} onClick={()=>void share()}>동반인 초대 링크 만들기</Button>
    {room&&<><label className="stack-sm"><span>동반인 초대 링크</span><input className="request-input" readOnly value={link} onFocus={e=>e.currentTarget.select()}/></label><Button variant="secondary" disabled={busy} onClick={()=>onRoom(room.roomId)}>공동 메뉴판 열기</Button></>}
    <Button disabled={busy||!board.items.length} onClick={onMenu}>개인 메뉴판 열기</Button>
    {message&&<p className="t-body-sm" role="status">{message}</p>}
  </div></main>;
}
