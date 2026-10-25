-- LOCAL UNEXECUTED PROPOSAL. Apply only after reviewed management schema.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
create table wishlist_correspondence_internal.ingress (
  id integer primary key check(id=1),
  window_started_at timestamptz not null,
  requests integer not null check(requests>=0),
  configured_limit integer not null check(configured_limit>0),
  window_seconds integer not null check(window_seconds>0)
);
alter table wishlist_correspondence_internal.ingress enable row level security;
revoke all on wishlist_correspondence_internal.ingress from public,anon,authenticated,service_role;
grant select,insert,update on wishlist_correspondence_internal.ingress to service_role;
create function public.consume_wishlist_management_limit(p_limit integer,p_window_seconds integer)
returns table(allowed boolean,retry_after_seconds integer)
language plpgsql security invoker set search_path=''
as $$
declare counter wishlist_correspondence_internal.ingress%rowtype; server_time timestamptz;
begin
  if p_limit is null or p_limit<1 or p_window_seconds is null or p_window_seconds<1 then
    raise exception 'Invalid management rate policy.' using errcode='22023';
  end if;
  insert into wishlist_correspondence_internal.ingress(id,window_started_at,requests,configured_limit,window_seconds)
    values(1,pg_catalog.clock_timestamp(),0,p_limit,p_window_seconds) on conflict(id) do nothing;
  select * into counter from wishlist_correspondence_internal.ingress where id=1 for update;
  -- Mixed rollout settings must not reset/alternate the shared quota. Changing
  -- policy needs an explicit reviewed singleton reset, not a request-side reset.
  if counter.configured_limit<>p_limit or counter.window_seconds<>p_window_seconds then
    raise exception 'Management ingress policy mismatch.' using errcode='22023';
  end if;
  server_time=pg_catalog.clock_timestamp();
  if server_time>=counter.window_started_at+pg_catalog.make_interval(secs=>p_window_seconds) then
    counter.window_started_at=server_time;counter.requests=0;
  end if;
  if counter.requests>=p_limit then
    return query select false,least(p_window_seconds,greatest(1,
      ceil(extract(epoch from(counter.window_started_at+pg_catalog.make_interval(secs=>p_window_seconds)-server_time)))::integer));
    return;
  end if;
  update wishlist_correspondence_internal.ingress set window_started_at=counter.window_started_at,requests=counter.requests+1 where id=1;
  return query select true,0;
end $$;
revoke execute on function public.consume_wishlist_management_limit(integer,integer) from public,anon,authenticated;
grant execute on function public.consume_wishlist_management_limit(integer,integer) to service_role;
commit;
