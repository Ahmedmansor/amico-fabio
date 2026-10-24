-- Applied to fabioEgypt on 2026-10-24 after separate user authorization. Do not rerun.
-- Two private-to-backend tables and one service-role-only atomic RPC. No sender/Cron.
begin;

create table public.wishlist_email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  locale text not null check (locale in ('it','en')),
  wording_version text not null check (length(wording_version)>0),
  updated_at timestamptz not null default now(),
  enabled_since timestamptz,
  check ((enabled and enabled_since is not null) or (not enabled and enabled_since is null))
);
create table public.wishlist_email_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  action text not null check (action in ('grant','withdraw')),
  locale text not null check (locale in ('it','en')),
  wording_version text not null check (length(wording_version)>0),
  source text not null check (source in ('wishlist-page','email-unsubscribe')),
  recorded_at timestamptz not null default now(),
  unique(user_id,request_id)
);

alter table public.wishlist_email_preferences enable row level security;
alter table public.wishlist_email_consent_events enable row level security;
revoke all on public.wishlist_email_preferences,public.wishlist_email_consent_events
  from public,anon,authenticated,service_role;
-- No browser policies or table grants. A verified backend mediates access.
grant select,insert,update on public.wishlist_email_preferences to service_role;
grant select,insert on public.wishlist_email_consent_events to service_role;

create function public.change_wishlist_email_preference(
  p_user_id uuid,p_request_id uuid,p_enabled boolean,p_locale text,
  p_wording_version text,p_source text
) returns table(enabled boolean,locale text,wording_version text,updated_at timestamptz,enabled_since timestamptz)
language plpgsql security invoker set search_path=''
as $$
declare previous public.wishlist_email_consent_events%rowtype;
  desired_action text; server_time timestamptz;
begin
  if p_user_id is null or p_request_id is null or p_enabled is null
    or p_locale is null or p_locale not in ('it','en')
    or p_wording_version is distinct from 'wishlist-reminders-v1'
    or p_source is null or p_source not in ('wishlist-page','email-unsubscribe')
    or (p_source='email-unsubscribe' and p_enabled) then
    raise exception 'Invalid preference command.' using errcode='22023';
  end if;
  -- Serialize decisions and duplicate retries for one account, transactionally.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  desired_action=case when p_enabled then 'grant' else 'withdraw' end;
  select * into previous from public.wishlist_email_consent_events e
    where e.user_id=p_user_id and e.request_id=p_request_id;
  if found then
    if (previous.action,previous.locale,previous.wording_version,previous.source)
      is distinct from (desired_action,p_locale,p_wording_version,p_source) then
      raise exception 'Request identity already used for a different command.' using errcode='22023';
    end if;
    -- A retry never replays old consent over a later withdrawal/change.
    return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
      from public.wishlist_email_preferences p where p.user_id=p_user_id;
    return;
  end if;
  server_time=pg_catalog.clock_timestamp();
  insert into public.wishlist_email_preferences as target(user_id,enabled,locale,wording_version,updated_at,enabled_since)
    values(p_user_id,p_enabled,p_locale,p_wording_version,server_time,case when p_enabled then server_time else null end)
    on conflict(user_id) do update set enabled=excluded.enabled,locale=excluded.locale,
      wording_version=excluded.wording_version,updated_at=excluded.updated_at,
      enabled_since=case when not excluded.enabled then null when target.enabled then target.enabled_since else excluded.enabled_since end;
  insert into public.wishlist_email_consent_events(user_id,request_id,action,locale,wording_version,source,recorded_at)
    values(p_user_id,p_request_id,desired_action,p_locale,p_wording_version,p_source,server_time);
  return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
    from public.wishlist_email_preferences p where p.user_id=p_user_id;
end;
$$;
revoke execute on function public.change_wishlist_email_preference(uuid,uuid,boolean,text,text,text)
  from public,anon,authenticated;
grant execute on function public.change_wishlist_email_preference(uuid,uuid,boolean,text,text,text)
  to service_role;
commit;
