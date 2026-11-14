// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
let db: PGlite;
const a='00000000-0000-4000-8000-000000000001', b='00000000-0000-4000-8000-000000000002', c='00000000-0000-4000-8000-000000000003';
async function user(id:string) { await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); }
async function rpc<T>(sql:string,args:unknown[]=[]) { return (await db.query<{result:T}>(`select ${sql} as result`,args)).rows[0].result; }
const menu={source:'gemini',items:[{id:'pasta'}]};
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`create role service_role; create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  for(const id of [a,b,c]) await db.query('insert into auth.users values($1)',[id]);
  await db.exec('alter default privileges in schema public grant execute on functions to anon, authenticated, service_role');
  await db.exec(await readFile(new URL('../supabase/migrations/202611140001_shared_order.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611140002_api_budgets.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611140004_restrict_budget_rpc.sql',import.meta.url),'utf8'));
},20000);
afterAll(async()=>{await db?.close();});
describe('공동 장바구니 서버 권한과 변경',()=>{
  it('동시 호출에서도 저장한 상한을 넘지 않고 클라이언트는 카운터를 수정하지 못해요',async()=>{
    const results=await Promise.all(Array.from({length:12},()=>rpc<boolean>("public.reserve_api_calls($1,$2,$3)",['test-provider',{day:5,month:8},1])));
    expect(results.filter(Boolean)).toHaveLength(5);
    expect(await rpc('public.reserve_api_calls($1,$2,$3)',['disabled',{lifetime:0},1])).toBe(false);
    await db.exec('set role authenticated');
    await expect(rpc('public.reserve_api_calls($1,$2,$3)',['test-provider',{day:999},1])).rejects.toThrow('permission denied');
    await expect(db.query('delete from public.api_usage_counts')).rejects.toThrow('permission denied');
    await db.exec('reset role');
    await db.exec('set role anon');
    await expect(rpc('public.reserve_api_calls($1,$2,$3)',['test-provider',{day:999},1])).rejects.toThrow('permission denied');
    await db.exec('reset role');
  });
  it('초대 참여·동시 담기·수량·본인 소유권·외부 차단을 검증해요',async()=>{
    await user(a);
    const room=await rpc<{roomId:string;invite:string}>('public.create_order_room($1,$2)',[menu,'나']);
    await user(c); await expect(rpc('public.read_order_room($1)',[room.roomId])).rejects.toThrow('ROOM_UNAVAILABLE');
    await expect(rpc('public.change_order_item($1,$2,$3)',[room.roomId,'pasta','add'])).rejects.toThrow('ROOM_UNAVAILABLE');
    await user(b); await rpc('public.join_order_room($1,$2)',[room.invite,'동반인']);
    await rpc('public.change_order_item($1,$2,$3)',[room.roomId,'pasta','add']);
    await user(a); await rpc('public.change_order_item($1,$2,$3)',[room.roomId,'pasta','add']);
    type Snapshot={cart:{userId:string;quantity:number}[];revision:number;members:unknown[]};
    let state=await rpc<Snapshot>('public.change_order_item($1,$2,$3)',[room.roomId,'pasta','increase']);
    expect(state.cart).toEqual(expect.arrayContaining([{menuId:'pasta',userId:a,quantity:2},{menuId:'pasta',userId:b,quantity:1}]));
    state=await rpc<Snapshot>('public.change_order_item($1,$2,$3)',[room.roomId,'pasta','remove']);
    expect(state.cart).toEqual([{menuId:'pasta',userId:b,quantity:1}]);
    await Promise.all(Array.from({length:5},()=>rpc('public.change_order_item($1,$2,$3)',[room.roomId,'pasta','increase'])));
    state=await rpc<Snapshot>('public.read_order_room($1)',[room.roomId]);expect(state.cart.find(line=>line.userId===a)?.quantity).toBe(5);
    await expect(rpc('public.change_order_item($1,$2,$3)',[room.roomId,'unknown','add'])).rejects.toThrow('INVALID_MENU');
    await expect(rpc('public.change_order_item($1,$2,$3)',[room.roomId,'pasta',null])).rejects.toThrow('INVALID_ACTION');
    await db.exec('set role authenticated');
    expect((await db.query('select * from public.order_rooms')).rows).toHaveLength(1);
    await expect(db.query("update public.order_rooms set cart='[]' where id=$1",[room.roomId])).rejects.toThrow('permission denied');
    await expect(db.query('select * from public.order_invites')).rejects.toThrow('permission denied');
    await user(c); expect((await db.query('select * from public.order_rooms')).rows).toHaveLength(0);
    expect((await db.query('select * from public.order_members')).rows).toHaveLength(0);
    await db.exec('reset role');
    await db.query("update public.order_rooms set expires_at=now()-interval '1 minute' where id=$1",[room.roomId]);
    await user(b);await expect(rpc('public.read_order_room($1)',[room.roomId])).rejects.toThrow('ROOM_UNAVAILABLE');
    await expect(rpc('public.join_order_room($1,$2)',[room.invite,'동반인'])).rejects.toThrow('INVITE_EXPIRED');
  });
});
