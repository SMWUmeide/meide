import { useState } from 'react';
import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { joinOrderRoom, sharedOrderConfigured } from '@/lib/shared-order';

// Invitation links can still join a room; capture and invitation creation belong
// to the preceding flow, not the Figma menu header.
export function MenuTools({ invite, onRoom, onClose }: {
  invite: string; onRoom: (id: string) => void; onClose: () => void;
}) {
  const [name,setName]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function join() {
    if(busy || !name.trim()) return;
    setBusy(true);setError('');
    try { onRoom(await joinOrderRoom(invite,name)); }
    catch(error) { setError(error instanceof Error ? error.message : '공유 연결을 다시 시도해 주세요'); }
    finally { setBusy(false); }
  }
  return <BottomSheet open dismissible={!busy} onClose={onClose} label="함께 메뉴를 골라요">
    <div className="stack-lg">
      <h2 className="t-headline-md">함께 메뉴를 골라요</h2>
      <label className="stack-xs"><span>동반인에게 보일 이름</span><input className="request-input" value={name} maxLength={20} disabled={busy} onChange={event=>setName(event.target.value)} placeholder="이름을 입력해 주세요" /></label>
      <p className="t-body-sm muted">초대받은 메뉴판과 장바구니에 참여해요.</p>
      {!sharedOrderConfigured() && <p className="t-body-sm muted">공유 서버를 아직 연결하지 않았어요.</p>}
      <Button variant="secondary" disabled={!name.trim() || !sharedOrderConfigured() || busy} onClick={()=>void join()}>함께 고르기</Button>
      {busy && <p role="status" className="t-body-sm">불러오고 있어요. 잠시 기다려 주세요.</p>}
      {error && <p role="alert" className="t-body-sm">{error}</p>}
      <Button variant="secondary" disabled={busy} onClick={onClose}>닫기</Button>
    </div>
  </BottomSheet>;
}
