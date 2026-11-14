-- Supabase default privileges can grant EXECUTE directly to client roles.
-- Revoking PUBLIC alone does not remove those explicit grants.
revoke all on function public.reserve_api_calls(text,jsonb,integer) from public, anon, authenticated;
grant execute on function public.reserve_api_calls(text,jsonb,integer) to service_role;
revoke all on function public.limit_order_writes() from public, anon, authenticated;
