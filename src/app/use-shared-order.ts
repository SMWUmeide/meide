import { useEffect, useRef, useState } from 'react';
import { changeOrderItem, orderClient, orderIdentity, readOrderRoom, type SharedSnapshot } from '@/lib/shared-order';
function mergeSnapshot(old: SharedSnapshot | null, next: SharedSnapshot) {
  if (old?.id === next.id && old.revision > next.revision) return old;
  return old?.id === next.id && JSON.stringify(old.board) === JSON.stringify(next.board) ? {...next, board: old.board} : next;
}
const key = 'meide.shared-room.v1';
function savedRoom() { try { const value = localStorage.getItem(key); return value && /^[a-f0-9-]{36}$/.test(value) ? value : null; } catch { return null; } }
export function useSharedOrder() {
  const [roomId, setRoomId] = useState(savedRoom);
  const [snapshot, setSnapshot] = useState<SharedSnapshot | null>(null);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const currentRoom = useRef(roomId);
  useEffect(() => {
    currentRoom.current = roomId;
    if (!roomId) return;
    let disposed = false;
    let channel: ReturnType<ReturnType<typeof orderClient>['channel']> | undefined;
    let loading = false, queued = false;
    const apply = (next: SharedSnapshot) => setSnapshot(old => mergeSnapshot(old,next));
    async function refresh() {
      if (loading) { queued = true; return; }
      loading = true;
      try { const next = await readOrderRoom(roomId!); if (!disposed) { apply(next); setStatus(''); } }
      catch (error) { if (!disposed) setStatus(error instanceof Error ? error.message : '다시 연결하고 있어요'); }
      finally { loading = false; if (queued && !disposed) { queued = false; void refresh(); } }
    }
    void orderIdentity().then(id => {
      if (disposed) return;
      setUserId(id);
      channel = orderClient().channel(`order:${roomId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_rooms', filter: `id=eq.${roomId}` }, () => void refresh()).subscribe(state => {
        if (disposed) return;
        setConnected(state === 'SUBSCRIBED');
        if (state === 'SUBSCRIBED') void refresh();
        else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') setStatus('연결을 다시 확인하고 있어요. 저장된 메뉴는 그대로예요');
      });
      void refresh();
    }).catch(error => { if (!disposed) setStatus(error.message); });
    const reconnect = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('online', reconnect); document.addEventListener('visibilitychange', reconnect);
    return () => { disposed = true; window.removeEventListener('online', reconnect); document.removeEventListener('visibilitychange', reconnect); if (channel) void orderClient().removeChannel(channel); };
  }, [roomId]);
  function open(id: string | null) {
    currentRoom.current = id; setSnapshot(null); setConnected(false); setStatus(''); setRoomId(id);
    try { if (id) localStorage.setItem(key,id); else localStorage.removeItem(key); } catch { /* Session remains usable. */ }
  }
  async function mutate(menuId: string, action: 'add' | 'remove' | 'increase' | 'decrease') {
    if (!roomId || busy.current || !connected) throw new Error('공유 연결을 확인한 뒤 다시 눌러 주세요');
    busy.current = true; setPending(true);
    try {
      const next = await changeOrderItem(roomId, menuId, action);
      if (currentRoom.current === roomId) setSnapshot(old => mergeSnapshot(old,next));
    } finally { busy.current = false; setPending(false); }
  }
  return { roomId, snapshot, userId, status, connected, pending, open, mutate };
}
