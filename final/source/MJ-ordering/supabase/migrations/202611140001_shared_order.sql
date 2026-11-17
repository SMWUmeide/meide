-- All writes go through RPCs. Clients can only read rooms they belong to.
create table public.order_rooms (
  id uuid primary key default gen_random_uuid(),
  board jsonb not null check (jsonb_typeof(board) = 'object' and octet_length(board::text) <= 300000),
  cart jsonb not null default '[]',
  revision bigint not null default 1,
  expires_at timestamptz not null default now() + interval '24 hours'
);
create table public.order_members (
  room_id uuid not null references public.order_rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 20),
  slot integer not null check (slot between 0 and 3),
  primary key (room_id, user_id), unique (room_id, slot)
);
create table public.order_invites (
  token_hash text primary key,
  room_id uuid not null unique references public.order_rooms on delete cascade
);
alter table public.order_rooms enable row level security;
alter table public.order_members enable row level security;
alter table public.order_invites enable row level security;
revoke all on public.order_rooms, public.order_members, public.order_invites from anon, authenticated;
grant select on public.order_rooms, public.order_members to authenticated;

create function public.is_order_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.order_members m join public.order_rooms r on r.id=m.room_id
    where m.room_id=target and m.user_id=auth.uid() and r.expires_at > now());
$$;
revoke all on function public.is_order_member(uuid) from public;
grant execute on function public.is_order_member(uuid) to authenticated;
create policy member_rooms on public.order_rooms for select to authenticated using (public.is_order_member(id));
create policy member_people on public.order_members for select to authenticated using (public.is_order_member(room_id));

create function public.create_order_room(menu jsonb, display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare room uuid; invite text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if display_name is null or length(trim(display_name)) not between 1 and 20 then raise exception 'INVALID_NAME'; end if;
  if jsonb_typeof(menu->'items') is distinct from 'array' or jsonb_array_length(menu->'items') not between 1 and 80
     or menu->>'source' is null or menu->>'source' not in ('gemini','demo') then raise exception 'INVALID_MENU'; end if;
  -- Limit room creation per identity. Production also needs Auth abuse protection.
  if (select count(*) from public.order_members m join public.order_rooms r on r.id=m.room_id
      where m.user_id=auth.uid() and m.slot=0 and r.expires_at>now()) >= 5 then raise exception 'ROOM_LIMIT'; end if;
  insert into public.order_rooms(board) values(menu) returning id into room;
  insert into public.order_members values(room,auth.uid(),trim(display_name),0);
  insert into public.order_invites values(encode(sha256(convert_to(invite,'UTF8')),'hex'),room);
  return jsonb_build_object('roomId',room,'invite',invite);
end $$;

create function public.join_order_room(invite text, display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare room uuid; next_slot int;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if display_name is null or length(trim(display_name)) not between 1 and 20 then raise exception 'INVALID_NAME'; end if;
  select r.id into room from public.order_rooms r join public.order_invites i on i.room_id=r.id
    where i.token_hash=encode(sha256(convert_to(invite,'UTF8')),'hex') and r.expires_at>now() for update of r;
  if room is null then raise exception 'INVITE_EXPIRED'; end if;
  if exists(select 1 from public.order_members where room_id=room and user_id=auth.uid()) then return room; end if;
  select count(*) into next_slot from public.order_members where room_id=room;
  if next_slot>=4 then raise exception 'ROOM_FULL'; end if;
  insert into public.order_members values(room,auth.uid(),trim(display_name),next_slot);
  update public.order_rooms set revision=revision+1 where id=room;
  return room;
end $$;

create function public.read_order_room(target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_order_member(target) then raise exception 'ROOM_UNAVAILABLE'; end if;
  select jsonb_build_object('id',r.id,'board',r.board,'cart',r.cart,'revision',r.revision,
    'members',(select jsonb_agg(jsonb_build_object('id',m.user_id,'name',m.name,'slot',m.slot) order by m.slot)
      from public.order_members m where m.room_id=r.id)) into result from public.order_rooms r where r.id=target;
  return result;
end $$;

create function public.change_order_item(target uuid, menu_id text, action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare room public.order_rooms; old_quantity int; new_quantity int; updated jsonb;
begin
  select * into room from public.order_rooms where id=target for update;
  if not public.is_order_member(target) then raise exception 'ROOM_UNAVAILABLE'; end if;
  if action is null or action not in ('add','remove','increase','decrease') then raise exception 'INVALID_ACTION'; end if;
  if not exists(select 1 from jsonb_array_elements(room.board->'items') item where item->>'id'=menu_id) then raise exception 'INVALID_MENU'; end if;
  select (line->>'quantity')::int into old_quantity from jsonb_array_elements(room.cart) line
    where line->>'menuId'=menu_id and line->>'userId'=auth.uid()::text;
  new_quantity := case action when 'add' then greatest(coalesce(old_quantity,0),1) when 'remove' then 0
    when 'increase' then least(coalesce(old_quantity,0)+1,20) when 'decrease' then greatest(coalesce(old_quantity,0)-1,0) end;
  select coalesce(jsonb_agg(line),'[]') into updated from jsonb_array_elements(room.cart) line
    where not(line->>'menuId'=menu_id and line->>'userId'=auth.uid()::text);
  if new_quantity>0 then updated:=updated||jsonb_build_array(jsonb_build_object('menuId',menu_id,'userId',auth.uid(),'quantity',new_quantity)); end if;
  update public.order_rooms set cart=updated,revision=revision+1 where id=target;
  return public.read_order_room(target);
end $$;

revoke all on function public.create_order_room(jsonb,text), public.join_order_room(text,text), public.read_order_room(uuid), public.change_order_item(uuid,text,text) from public;
grant execute on function public.create_order_room(jsonb,text), public.join_order_room(text,text), public.read_order_room(uuid), public.change_order_item(uuid,text,text) to authenticated;
-- Supabase creates this publication. A local SQL test database may not have it.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.order_rooms;
  end if;
end $$;
