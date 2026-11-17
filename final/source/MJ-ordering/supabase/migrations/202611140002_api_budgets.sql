create table public.api_usage_counts (
  provider text not null, period text not null, bucket text not null, calls bigint not null default 0,
  primary key(provider,period,bucket)
);
alter table public.api_usage_counts enable row level security;
revoke all on public.api_usage_counts from anon, authenticated;
create function public.reserve_api_calls(provider_name text, caps jsonb, units integer default 1) returns boolean
language plpgsql security definer set search_path='' as $$
declare period_name text; cap bigint; bucket_name text; used bigint;
begin
  if units<1 or units>100 or jsonb_typeof(caps)<>'object' or caps='{}'::jsonb then raise exception 'INVALID_BUDGET'; end if;
  perform pg_advisory_xact_lock(hashtextextended(provider_name,0));
  for period_name, cap in select key,value::bigint from jsonb_each_text(caps) loop
    bucket_name:=case period_name when 'minute' then to_char(now() at time zone 'UTC','YYYY-MM-DD HH24:MI') when 'hour' then to_char(now() at time zone 'UTC','YYYY-MM-DD HH24') when 'day' then to_char(now() at time zone 'UTC','YYYY-MM-DD') when 'month' then to_char(now() at time zone 'UTC','YYYY-MM') when 'lifetime' then 'all' else null end;
    if bucket_name is null or cap<0 then raise exception 'INVALID_BUDGET'; end if;
    select calls into used from public.api_usage_counts where provider=provider_name and period=period_name and bucket=bucket_name;
    if coalesce(used,0)+units>cap then return false; end if;
  end loop;
  for period_name, cap in select key,value::bigint from jsonb_each_text(caps) loop
    bucket_name:=case period_name when 'minute' then to_char(now() at time zone 'UTC','YYYY-MM-DD HH24:MI') when 'hour' then to_char(now() at time zone 'UTC','YYYY-MM-DD HH24') when 'day' then to_char(now() at time zone 'UTC','YYYY-MM-DD') when 'month' then to_char(now() at time zone 'UTC','YYYY-MM') when 'lifetime' then 'all' end;
    insert into public.api_usage_counts values(provider_name,period_name,bucket_name,units)
      on conflict(provider,period,bucket) do update set calls=public.api_usage_counts.calls+excluded.calls;
  end loop;
  return true;
end $$;
revoke all on function public.reserve_api_calls(text,jsonb,integer) from public;
grant execute on function public.reserve_api_calls(text,jsonb,integer) to service_role;

-- Bounds shared writes, not provider-level Realtime traffic/egress or direct reads.
create function public.limit_order_writes() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not public.reserve_api_calls('shared-writes','{"day":1000}',1)
     or not public.reserve_api_calls('shared-user:'||auth.uid()::text,'{"day":200}',1) then raise exception 'SHARED_DAILY_LIMIT'; end if;
  return new;
end $$;
revoke all on function public.limit_order_writes() from public;
create trigger order_write_budget before insert or update on public.order_rooms for each row execute function public.limit_order_writes();
