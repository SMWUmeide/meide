import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { menuBoardSchema, type MenuBoard } from './menu-schema';
import type { OrderLine } from './order-model';

const member = z.object({ id: z.string().uuid(), name: z.string().min(1).max(20), slot: z.number().int().min(0).max(3) });
const snapshotSchema = z.object({ id: z.string().uuid(), revision: z.number().int().positive(), board: menuBoardSchema,
  cart: z.array(z.object({ menuId: z.string(), userId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).max(320), members: z.array(member).min(1).max(4) });
export type SharedSnapshot = z.infer<typeof snapshotSchema>;
let instance: SupabaseClient | undefined;
export function sharedClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL, key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('공유 장바구니 서버가 연결되지 않았어요.');
  instance ??= createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
  return instance;
}
export async function sharedIdentity() {
  const client = sharedClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error('공유 연결을 다시 시도해 주세요.');
  const result = data.session ? data : (await client.auth.signInAnonymously()).data;
  if (!result.session || !result.session.user) throw new Error('공유 로그인을 하지 못했어요.');
  await client.realtime.setAuth(result.session.access_token);
  return result.session.user.id;
}
export async function createRoom(board: MenuBoard, name: string) {
  await sharedIdentity();
  const { data, error } = await sharedClient().rpc('create_order_room', { menu: board, display_name: name.trim() });
  if (error) throw new Error('공유 장바구니를 만들지 못했어요.');
  return z.object({ roomId: z.string().uuid(), invite: z.string().regex(/^[a-f0-9]{64}$/) }).parse(data);
}
export async function joinRoom(invite: string, name: string) {
  if (!/^[a-f0-9]{64}$/.test(invite)) throw new Error('초대 링크를 확인해 주세요.');
  await sharedIdentity();
  const { data, error } = await sharedClient().rpc('join_order_room', { invite, display_name: name.trim() });
  if (error) throw new Error('초대가 만료됐거나 정원이 찼어요.');
  return z.string().uuid().parse(data);
}
export async function readRoom(roomId: string) {
  const { data, error } = await sharedClient().rpc('read_order_room', { target: roomId });
  if (error) throw new Error('공유 장바구니를 불러오지 못했어요.');
  return snapshotSchema.parse(data);
}
export async function changeItem(roomId: string, menuId: string, action: 'add' | 'remove' | 'increase' | 'decrease') {
  const { data, error } = await sharedClient().rpc('change_order_item', { target: roomId, menu_id: menuId, action });
  if (error) throw new Error('변경사항을 저장하지 못했어요.');
  return snapshotSchema.parse(data);
}
export function roomView(snapshot: SharedSnapshot, userId: string): OrderLine[] {
  return snapshot.cart.flatMap(line => snapshot.board.items.some(item => item.id === line.menuId) && snapshot.members.some(member => member.id === line.userId)
    ? [{ menuId: line.menuId, person: line.userId === userId ? 'me' : line.userId, quantity: line.quantity }] : []);
}
