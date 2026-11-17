import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import { changeItem, createRoom, joinRoom, readRoom, roomView, sharedClient, sharedIdentity, type SharedSnapshot } from './shared-order';
import type { MenuBoard } from './menu-schema';
import type { OrderLine } from './order-model';

export function useSharedOrder(invite: string | undefined, name: string, receive: (board: MenuBoard, cart: OrderLine[]) => void) {
  const [room, setRoom] = useState('');
  const [identity, setIdentity] = useState('');
  const [snapshot, setSnapshot] = useState<SharedSnapshot | null>(null);
  const [link, setLink] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0), busy = useRef(false), joined = useRef(false), latestReceive = useRef(receive);
  useEffect(() => { latestReceive.current = receive; }, [receive]);
  const apply = useCallback((next: SharedSnapshot, id: string) => {
    if (next.revision < revision.current) return;
    revision.current = next.revision; setSnapshot(next); latestReceive.current(next.board, roomView(next, id));
  }, []);
  useEffect(() => {
    if (!invite || joined.current) return;
    joined.current = true; let live = true;
    void (async () => {
      try {
        const id = await sharedIdentity(); const roomId = await joinRoom(invite, name || '동반인'); const next = await readRoom(roomId);
        if (live) { setIdentity(id); setRoom(roomId); apply(next, id); }
      } catch (e) { if (live) setError(e instanceof Error ? e.message : '초대를 열지 못했어요.'); }
    })();
    return () => { live = false; };
  }, [invite, name, apply]);
  useEffect(() => {
    if (!room || !identity) return;
    let live = true;
    const refresh = async () => { try { const next = await readRoom(room); if (live) apply(next, identity); } catch { if (live) setError('공유 장바구니를 다시 연결하고 있어요.'); } };
    const channel = sharedClient().channel(`order:${room}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_rooms', filter: `id=eq.${room}` }, () => void refresh()).subscribe();
    const timer = setInterval(() => void refresh(), 10000);
    return () => { live = false; clearInterval(timer); void sharedClient().removeChannel(channel); };
  }, [room, identity, apply]);
  async function mutate(menuId: string, action: 'add' | 'remove' | 'increase' | 'decrease') {
    if (!room || busy.current) return;
    busy.current = true; setPending(true); setError('');
    try { apply(await changeItem(room, menuId, action), identity); }
    catch (e) { setError(e instanceof Error ? e.message : '변경사항을 저장하지 못했어요.'); }
    finally { busy.current = false; setPending(false); }
  }
  async function share(board: MenuBoard, cart: OrderLine[]) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try {
      if (link) { await Share.share({ message: `meide에서 함께 메뉴를 골라요. 앱에서 링크를 열어 주세요.\n${link}` }); return; }
      if (room) throw new Error('이 초대 링크는 방을 만든 분이 다시 보낼 수 있어요.');
      const id = await sharedIdentity(); const created = await createRoom(board, name || '나');
      const newLink = Linking.createURL('/menu/order', { queryParams: { invite: created.invite } });
      let next = await readRoom(created.roomId);
      for (const line of cart.filter(item => item.person === 'me')) {
        next = await changeItem(created.roomId, line.menuId, 'add');
        for (let i = 1; i < line.quantity; i++) next = await changeItem(created.roomId, line.menuId, 'increase');
      }
      revision.current = 0; setIdentity(id); setRoom(created.roomId); setLink(newLink); apply(next, id);
      await Share.share({ message: `meide에서 함께 메뉴를 골라요. 앱에서 링크를 열어 주세요.\n${newLink}` });
    } catch (e) { setError(e instanceof Error ? e.message : '공유하지 못했어요.'); }
    finally { busy.current = false; setPending(false); }
  }
  function leave() { revision.current = 0; setRoom(''); setIdentity(''); setSnapshot(null); setLink(''); setError(''); }
  return { room, snapshot, pending, error, mutate, share, leave, canShare: !room || Boolean(link) };
}
