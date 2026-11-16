-- Anonymous Auth sessions use authenticated. Unauthenticated requests need no RPC access.
revoke all on function public.create_order_room(jsonb,text), public.join_order_room(text,text), public.read_order_room(uuid), public.change_order_item(uuid,text,text), public.is_order_member(uuid) from anon;
