-- Applied to fabioEgypt on 2026-10-24 after explicit authorization. Do not rerun.
-- Operational counters only. No email sender, queue or Cron.
begin;
create table public.wishlist_preference_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check(operation in ('read','write')),
  window_started_at timestamptz not null,
  requests integer not null check(requests>=0),
  primary key(user_id,operation)
);
alter table public.wishlist_preference_rate_limits enable row level security;
revoke all on public.wishlist_preference_rate_limits from public,anon,authenticated,service_role;
grant select,insert,update on public.wishlist_preference_rate_limits to service_role;

create function public.consume_wishlist_preference_limit(
  p_user_id uuid,p_operation text,p_limit integer,p_window_seconds integer
) returns table(allowed boolean,retry_after_seconds integer)
language plpgsql security invoker set search_path=''
as $$
declare counter public.wishlist_preference_rate_limits%rowtype; server_time timestamptz;
begin
  if p_user_id is null or p_operation is null or p_operation not in ('read','write')
    or p_limit is null or p_limit<1 or p_window_seconds is null or p_window_seconds<1 then
    raise exception 'Invalid rate command.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('reminder-rate:'||p_user_id::text||':'||p_operation,0));
  server_time=pg_catalog.clock_timestamp();
  insert into public.wishlist_preference_rate_limits(user_id,operation,window_started_at,requests)
    values(p_user_id,p_operation,server_time,0) on conflict(user_id,operation) do nothing;
  select * into counter from public.wishlist_preference_rate_limits r
    where r.user_id=p_user_id and r.operation=p_operation for update;
  if server_time>=counter.window_started_at+pg_catalog.make_interval(secs=>p_window_seconds) then
    counter.window_started_at=server_time;counter.requests=0;
  end if;
  if counter.requests>=p_limit then
    return query select false,greatest(1,ceil(extract(epoch from (counter.window_started_at+pg_catalog.make_interval(secs=>p_window_seconds)-server_time)))::integer);
    return;
  end if;
  update public.wishlist_preference_rate_limits r set window_started_at=counter.window_started_at,requests=counter.requests+1
    where r.user_id=p_user_id and r.operation=p_operation;
  return query select true,0;
end;
$$;
revoke execute on function public.consume_wishlist_preference_limit(uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_wishlist_preference_limit(uuid,text,integer,integer) to service_role;
commit;
