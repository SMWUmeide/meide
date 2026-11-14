import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { BottomSheet } from '@/components/BottomSheet';
import { analyzePhotos } from '@/lib/analyze-menu';
import { loadMenuPhotos } from '@/lib/menu-photos';
import { pickNativePhotos } from '@/lib/native-camera';
import { createOrderRoom, joinOrderRoom, sharedOrderConfigured } from '@/lib/shared-order';
import type { MenuBoard } from '@/data/menu-schema';
export function MenuTools({ board, roomId, invite, onBoard, onPhotos, onRoom, notify }: {
  board: MenuBoard; roomId: string | null; invite: string; onBoard: (board: MenuBoard) => void; onPhotos: (board: MenuBoard) => void; onRoom: (id: string | null) => void; notify: (message: string) => void;
}) {
  const [open,setOpen]=useState(Boolean(invite));
  const [name,setName]=useState('');
  const [files,setFiles]=useState<File[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [link,setLink]=useState(()=>{try{return roomId ? sessionStorage.getItem(`meide.invite.${roomId}`)||'' : '';}catch{return '';}});
  const input=useRef<HTMLInputElement>(null);
  const controller=useRef<AbortController | null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  async function pick() {
    if (!Capacitor.isNativePlatform()) { input.current?.click(); return; }
    try { setFiles(await pickNativePhotos('gallery',6)); }
    catch { setError('사진을 선택하지 못했어요. 다시 시도해 주세요'); }
  }
  async function analyze() {
    if(busy || !files.length) return;
    setBusy(true);setError('');
    const task=new AbortController();controller.current=task;
    try {
      let photoFailed=false;
      let next=await analyzePhotos(files,AbortSignal.any([task.signal,AbortSignal.timeout(80000)]));
      try { next=await loadMenuPhotos(next,task.signal); }
      catch { photoFailed=true; }
      if(!task.signal.aborted) { onBoard(next);setFiles([]);setOpen(false);if(photoFailed) notify('메뉴 분석은 완료됐어요. 음식 사진은 다시 불러올 수 있어요'); }
    } catch(error) { if(!task.signal.aborted) setError(error instanceof Error ? error.message : '분석에 실패했어요'); }
    finally { setBusy(false); }
  }
  async function share() {
    if(busy || !name.trim()) return;
    setBusy(true);setError('');
    try {
      if(invite) { onRoom(await joinOrderRoom(invite,name));setOpen(false); }
      else {
        if(Capacitor.isNativePlatform() && !import.meta.env.VITE_APP_URL) throw new Error('초대 링크용 웹 주소를 먼저 설정해 주세요');
        const created=await createOrderRoom(board,name);
        const url=new URL(window.location.href); url.hash=`/join/${created.invite}`;
        // Native localhost is not reachable by a companion. Use the configured web app URL.
        if(Capacitor.isNativePlatform()) {
          const base=import.meta.env.VITE_APP_URL;
          if(!base) throw new Error('초대 링크용 웹 주소를 먼저 설정해 주세요');
          const web=new URL(base);web.hash=url.hash;setLink(web.href);
        } else setLink(url.href);
        const shareUrl=Capacitor.isNativePlatform() ? new URL(url.hash,import.meta.env.VITE_APP_URL).href : url.href;
        try {sessionStorage.setItem(`meide.invite.${created.roomId}`,shareUrl);} catch { /* Link stays visible for this session. */ }
        onRoom(created.roomId);
      }
    } catch(error) { setError(error instanceof Error ? error.message : '공유 연결을 다시 시도해 주세요'); }
    finally { setBusy(false); }
  }
  async function retryPhotos() {
    setBusy(true);setError('');const task=new AbortController();controller.current=task;
    try { const next=await loadMenuPhotos(board,task.signal);if(!task.signal.aborted) onPhotos(next); }
    catch {setError('사진을 불러오지 못했어요. 잠시 후 다시 시도해 주세요');}
    finally {setBusy(false);}
  }
  return <><IconButton icon="camera" label="메뉴판 불러오기와 동반인 공유" onClick={()=>setOpen(true)} />
    <BottomSheet open={open} dismissible={!busy} onClose={()=>setOpen(false)} label={invite?'함께 메뉴를 골라요':'메뉴판과 동반인'}>
      <div className="stack-lg">
        <h2 className="t-headline-md">{invite?'함께 메뉴를 골라요':'메뉴판과 동반인'}</h2>
        {!invite && !roomId && <>
          <p className="t-body-sm muted">메뉴판을 분석하면 AI 설명과 음식 대표 사진을 함께 불러와요. 현재 메뉴판과 장바구니는 새 메뉴로 바뀌어요.</p>
          <input ref={input} className="sr-only" type="file" accept="image/*" multiple aria-label="분석할 메뉴판 사진" disabled={busy} onChange={event=>{setFiles(Array.from(event.target.files??[]).slice(0,6));event.target.value='';}} />
          <Button variant="secondary" disabled={busy} onClick={()=>void pick()}>메뉴판 사진 선택하기{files.length?` · ${files.length}장`:''}</Button>
          {files.length>0 && <><p className="t-body-sm muted">최대 6장 · 분석 시 사진을 Gemini로 전송해요. 음식 사진은 Pexels의 대표 이미지예요.</p><Button variant="secondary" state={busy?'loading':'default'} onClick={()=>void analyze()}>메뉴판 분석하기</Button></>}
        </>}
        {!roomId && !invite && board.items.some(item=>(!item.photoUrl || (item.photo && !item.photo.cutoutUrl)) && item.photoQuery) && <Button variant="secondary" disabled={busy} onClick={()=>void retryPhotos()}>음식 사진 다시 불러오기</Button>}
        {(!roomId || invite) && <>
          <label className="stack-xs"><span>동반인에게 보일 이름</span><input className="request-input" value={name} maxLength={20} disabled={busy} onChange={event=>setName(event.target.value)} placeholder="이름을 입력해 주세요" /></label>
          <p className="t-body-sm muted">{invite?'초대받은 메뉴판과 장바구니에 참여해요.':'새 공동 장바구니는 비어 있는 상태로 시작해요. 최대 4명이 24시간 동안 함께 고를 수 있어요.'}</p>
          {!sharedOrderConfigured() && <p className="t-body-sm muted">공유 서버를 아직 연결하지 않았어요.</p>}
          <Button variant="secondary" disabled={!name.trim() || !sharedOrderConfigured() || busy} onClick={()=>void share()}>{invite?'함께 고르기':'동반인 초대 링크 만들기'}</Button>
        </>}
        {roomId && !invite && <><p className="t-body-sm muted">내 메뉴와 수량 변경이 동반인에게도 보여요. 다른 사람이 담은 메뉴는 그 사람이 수정할 수 있어요.</p>{link && <label className="stack-xs"><span>동반인 초대 링크</span><input className="request-input" readOnly value={link} onFocus={event=>event.currentTarget.select()} /><span className="t-body-sm muted">링크를 복사해 동반인에게 보내 주세요.</span></label>}<Button variant="secondary" disabled={busy} onClick={()=>{onRoom(null);setLink('');setOpen(false);}}>내 메뉴판으로 돌아가기</Button></>}
        {busy && <p role="status" className="t-body-sm">불러오고 있어요. 잠시 기다려 주세요.</p>}
        {error && <p role="alert" className="t-body-sm">{error}</p>}
        <Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>닫기</Button>
      </div>
    </BottomSheet>
  </>;
}
