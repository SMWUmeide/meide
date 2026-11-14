import { useState } from 'react';
import { Button } from '@/components/Button';
import { analyzePhotos } from '@/lib/analyze-menu';
import { loadMenuPhotos } from '@/lib/menu-photos';
import { createOrderRoom } from '@/lib/shared-order';
import type { MenuBoard } from '@/data/menu-schema';
import { Toolbar } from '../shared';
export function TestSetup({board,onBoard,onRoom,onMenu}:{board:MenuBoard;onBoard:(board:MenuBoard)=>void;onRoom:(id:string)=>void;onMenu:()=>void}) {
  const [files,setFiles]=useState<File[]>([]),[name,setName]=useState('');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [room,setRoom]=useState<{roomId:string;invite:string}|null>(null);
  async function analyze(){
    setBusy(true);setMessage('메뉴판을 분석하고 있어요');
    try{const signal=AbortSignal.timeout(110000);let next=await analyzePhotos(files,signal);try{next=await loadMenuPhotos(next,signal);setMessage('메뉴 분석과 음식 사진을 불러왔어요');}catch{setMessage('분석은 완료됐지만 음식 사진을 불러오지 못했어요');}onBoard(next);setRoom(null);}
    catch(error){setMessage(error instanceof Error?error.message:'다시 시도해 주세요');}finally{setBusy(false);}
  }
  async function photos(){setBusy(true);setMessage('음식 사진을 불러오고 있어요');try{onBoard(await loadMenuPhotos(board,AbortSignal.timeout(60000)));setMessage('음식 사진을 불러왔어요');}catch(error){setMessage(error instanceof Error?error.message:'다시 시도해 주세요');}finally{setBusy(false);}}
  async function share(){setBusy(true);setMessage('');try{setRoom(await createOrderRoom(board,name));setMessage('초대 링크를 복사해 다른 폰에서 열어 주세요');}catch(error){setMessage(error instanceof Error?error.message:'다시 시도해 주세요');}finally{setBusy(false);}}
  const link=room?`${window.location.origin}/#/join/${room.invite}`:'';
  return <main className="page"><Toolbar title="기능 테스트" onBack={onMenu}/><div className="page-content stack-xl">
    <p className="t-body-md">앞부분 화면을 합치기 전, 메뉴판 분석과 동반인 초대를 여기서 테스트해요.</p>
    <label className="stack-sm"><span>메뉴판 사진 · 최대 6장</span><input type="file" accept="image/*" multiple disabled={busy} onChange={e=>setFiles(Array.from(e.target.files??[]).slice(0,6))}/></label>
    <p className="t-body-sm muted">분석 시 선택한 사진을 Gemini로 전송해요. 현재 EUR 메뉴판을 지원해요. 음식 사진은 Pixabay의 대표 이미지예요.</p>
    <Button variant="secondary" disabled={busy||!files.length} onClick={()=>void analyze()}>메뉴판 분석하기</Button>
    <p className="t-body-md">현재 메뉴판: {board.restaurantName} · {board.items.length}개</p>
    <Button variant="secondary" disabled={busy} onClick={()=>void photos()}>음식 사진 불러오기</Button>
    <label className="stack-sm"><span>동반인에게 보일 이름</span><input className="request-input" value={name} maxLength={20} disabled={busy} onChange={e=>setName(e.target.value)}/></label>
    <Button variant="secondary" disabled={busy||!name.trim()} onClick={()=>void share()}>동반인 초대 링크 만들기</Button>
    {room&&<><label className="stack-sm"><span>동반인 초대 링크</span><input className="request-input" readOnly value={link} onFocus={e=>e.currentTarget.select()}/></label><Button variant="secondary" disabled={busy} onClick={()=>onRoom(room.roomId)}>공동 메뉴판 열기</Button></>}
    <Button disabled={busy} onClick={onMenu}>개인 메뉴판 열기</Button>
    {message&&<p className="t-body-sm" role="status">{message}</p>}
  </div></main>;
}
