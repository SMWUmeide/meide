import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { menuBoardSchema, type MenuBoard } from '@/data/menu-schema';
import { demoBoard } from '@/data/mock-menu';
import type { CartLine } from '@/app/cart';
import type { Person } from '@/components/_shared/action';

let client: SupabaseClient | undefined;
export function sharedOrderConfigured() { return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY); }
export function orderClient() {
  if (!sharedOrderConfigured()) throw new Error('동반인 공유 서버를 아직 연결하지 않았어요');
  if (!client) throw new Error('공유 연결을 준비하고 있어요');
  return client;
}
export async function orderIdentity() {
  if (!sharedOrderConfigured()) throw new Error('동반인 공유 서버를 아직 연결하지 않았어요');
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client ??= createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  }
  const supabase = orderClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('공유 연결을 다시 시도해 주세요');
  if (data.session) return data.session.user.id;
  const signed = await supabase.auth.signInAnonymously();
  if (signed.error || !signed.data.user) throw new Error('공유 로그인을 하지 못했어요. 잠시 후 다시 시도해 주세요');
  return signed.data.user.id;
}
const member = z.object({ id: z.string().uuid(), name: z.string().min(1).max(20), slot: z.number().int().min(0).max(3) });
const snapshotSchema = z.object({
  id: z.string().uuid(), revision: z.number().int().positive(),
  // Demo rooms resolve to bundled data, never arbitrary unvalidated demo JSON.
  board: z.union([menuBoardSchema, z.object({ source: z.literal('demo') }).transform(() => demoBoard)]),
  cart: z.array(z.object({ menuId: z.string(), userId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).max(320),
  members: z.array(member).min(1).max(4),
});
export type SharedSnapshot = z.infer<typeof snapshotSchema>;
export type SharedPerson = { id: string; name: string; person: Person };
export function parseSnapshot(value: unknown) { return snapshotSchema.parse(value); }
export function sharedView(snapshot: SharedSnapshot, userId: string): { people: SharedPerson[]; cart: CartLine[] } {
  const others = snapshot.members.filter(member => member.id !== userId).sort((a,b) => a.slot-b.slot);
  const people = snapshot.members.map(member => ({ id: member.id, name: member.name, person: (member.id === userId ? 'me' : `companion-${others.findIndex(other => other.id === member.id)+1}`) as Person }));
  const cart = snapshot.cart.flatMap(line => {
    const person = people.find(person => person.id === line.userId);
    return person && snapshot.board.items.some(item => item.id === line.menuId) ? [{ menuId: line.menuId, person: person.person, quantity: line.quantity }] : [];
  });
  return { people, cart };
}
export async function createOrderRoom(board: MenuBoard, name: string) {
  await orderIdentity();
  const { data, error } = await orderClient().rpc('create_order_room', { menu: board, display_name: name.trim() });
  if (error) throw new Error('공유 장바구니를 만들지 못했어요. 연결 설정과 생성 한도를 확인해 주세요');
  return z.object({ roomId: z.string().uuid(), invite: z.string().regex(/^[a-f0-9]{64}$/) }).parse(data);
}
export async function joinOrderRoom(invite: string, name: string) {
  await orderIdentity();
  const { data, error } = await orderClient().rpc('join_order_room', { invite, display_name: name.trim() });
  if (error) throw new Error('초대가 만료됐거나 정원이 찼어요. 초대 링크를 확인해 주세요');
  return z.string().uuid().parse(data);
}
export async function readOrderRoom(id: string) {
  const { data, error } = await orderClient().rpc('read_order_room', { target: id });
  if (error) throw new Error('공유 장바구니를 불러오지 못했어요. 연결 또는 초대 만료를 확인해 주세요');
  return parseSnapshot(data);
}
export async function changeOrderItem(id: string, menuId: string, action: 'add' | 'remove' | 'increase' | 'decrease') {
  const { data, error } = await orderClient().rpc('change_order_item', { target: id, menu_id: menuId, action });
  if (error) throw new Error('변경사항을 저장하지 못했어요. 연결 후 다시 눌러 주세요');
  return parseSnapshot(data);
}
