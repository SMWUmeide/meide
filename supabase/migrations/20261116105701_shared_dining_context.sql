-- Same membership boundary as cart RPCs; only dining inputs can be changed.
create function public.change_order_dining(target uuid, setting text, value jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare room public.order_rooms; context jsonb;
begin
  if auth.uid() is null or not public.is_order_member(target) then raise exception 'ROOM_UNAVAILABLE'; end if;
  select * into room from public.order_rooms where id=target for update;
  if not public.is_order_member(target) then raise exception 'ROOM_UNAVAILABLE'; end if;
  if setting = 'partySize' then
    if value is null or (value <> 'null'::jsonb and (jsonb_typeof(value) <> 'number' or value::text !~ '^([1-9]|[12][0-9]|30)$')) then raise exception 'INVALID_DINING'; end if;
  elsif setting = 'region' then
    if value is null or jsonb_typeof(value) <> 'string' or value #>> '{}' not in ('UNKNOWN','IT','FR','ES','PT','DE','AT','GR','OTHER') then raise exception 'INVALID_DINING'; end if;
  else raise exception 'INVALID_DINING'; end if;
  context := jsonb_build_object('partySize',null,'region','UNKNOWN') || coalesce(room.board->'dining','{}'::jsonb);
  context := jsonb_set(context,array[setting],value);
  update public.order_rooms set board=jsonb_set(board,'{dining}',context),revision=revision+1 where id=target;
  return public.read_order_room(target);
end $$;
revoke all on function public.change_order_dining(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.change_order_dining(uuid,text,jsonb) to authenticated;
