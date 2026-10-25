-- Applied 2026-10-24 after explicit user approval; DO NOT RERUN.
-- Remote migration 20261024203756 account_locale_preferences; retained reviewed source.
-- Prerequisites: applied account-wishlist and reminder-preferences schemas.
begin;

alter table public.profiles add column locale_revision bigint not null default 0
  check (locale_revision between 0 and 9007199254740991);
alter table public.wishlist_email_preferences add column locale_source text;
-- Preserve existing correspondence choices: do not silently enroll old rows in following the site.
update public.wishlist_email_preferences set locale_source='explicit';
alter table public.wishlist_email_preferences alter column locale_source set default 'follow_site';
alter table public.wishlist_email_preferences alter column locale_source set not null;
alter table public.wishlist_email_preferences add constraint wishlist_email_locale_source_check
  check (locale_source in ('follow_site','explicit'));

create table public.account_locale_commands (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  expected_revision bigint not null check (expected_revision between 0 and 9007199254740990),
  kind text not null check (kind in ('site','email_explicit','email_follow_site')),
  locale text,
  recorded_at timestamptz not null default now(),
  primary key(user_id,request_id),
  check ((kind='email_follow_site' and locale is null)
    or (kind in ('site','email_explicit') and locale is not null and locale in ('it','en')))
);
alter table public.account_locale_commands enable row level security;
revoke all on public.account_locale_commands from public,anon,authenticated,service_role;
grant select,insert on public.account_locale_commands to service_role;
-- Existing profile initialization INSERT remains unchanged. Subsequent updates must serialize.
revoke update(locale) on public.profiles from authenticated;
grant select(user_id,locale,locale_revision),update(locale,locale_revision) on public.profiles to service_role;
-- No new browser grants, policies, SECURITY DEFINER, catalog changes or sender activation.

create function public.read_account_locale(p_user_id uuid)
returns table(outcome text,site_locale text,revision bigint,email_locale text,locale_source text)
language plpgsql security invoker set search_path=''
as $$
begin
  if p_user_id is null then raise exception 'Verified account required.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  return query select 'read'::text,p.locale,p.locale_revision,e.locale,e.locale_source
    from public.profiles p left join public.wishlist_email_preferences e on e.user_id=p.user_id
    where p.user_id=p_user_id;
  if not found then return query select 'missing-profile'::text,null::text,null::bigint,null::text,null::text; end if;
end;
$$;

create function public.change_account_locale(
  p_user_id uuid,p_request_id uuid,p_expected_revision bigint,p_kind text,p_locale text
) returns table(outcome text,site_locale text,revision bigint,email_locale text,locale_source text)
language plpgsql security invoker set search_path=''
as $$
declare
  previous public.account_locale_commands%rowtype;
  profile_row record;
  preference_row public.wishlist_email_preferences%rowtype;
begin
  if p_user_id is null or p_request_id is null or p_expected_revision is null
    or p_expected_revision not between 0 and 9007199254740990
    or p_kind is null or p_kind not in ('site','email_explicit','email_follow_site')
    or (p_kind='email_follow_site' and p_locale is not null)
    or (p_kind<>'email_follow_site' and (p_locale is null or p_locale not in ('it','en'))) then
    return query select 'invalid-input'::text,null::text,null::bigint,null::text,null::text;
    return;
  end if;
  -- Same transaction lock/key as consent writes. No client clock participates.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  select p.locale,p.locale_revision into profile_row from public.profiles p where p.user_id=p_user_id;
  if not found then
    return query select 'missing-profile'::text,null::text,null::bigint,null::text,null::text;
    return;
  end if;
  select * into previous from public.account_locale_commands c
    where c.user_id=p_user_id and c.request_id=p_request_id;
  if found then
    if (previous.expected_revision,previous.kind,previous.locale)
      is distinct from (p_expected_revision,p_kind,p_locale) then
      return query select 'invalid-input'::text,null::text,null::bigint,null::text,null::text;
    else
      -- Return current state; never replay an old command over a later explicit choice.
      return query select 'duplicate'::text,r.site_locale,r.revision,r.email_locale,r.locale_source
        from public.read_account_locale(p_user_id) r;
    end if;
    return;
  end if;
  if profile_row.locale_revision<>p_expected_revision then
    return query select 'conflict'::text,r.site_locale,r.revision,r.email_locale,r.locale_source
      from public.read_account_locale(p_user_id) r;
    return;
  end if;
  select * into preference_row from public.wishlist_email_preferences e where e.user_id=p_user_id;
  if not found and p_kind<>'site' then
    return query select 'missing-preference'::text,null::text,null::bigint,null::text,null::text;
    return;
  end if;
  if p_kind='site' then
    update public.profiles p set locale=p_locale where p.user_id=p_user_id;
    update public.wishlist_email_preferences e set locale=p_locale
      where e.user_id=p_user_id and e.locale is distinct from p_locale;
  elsif p_kind='email_explicit' then
    update public.profiles p set locale=p_locale where p.user_id=p_user_id;
    update public.wishlist_email_preferences e set locale=p_locale,locale_source='explicit' where e.user_id=p_user_id;
  else
    update public.wishlist_email_preferences e set locale=profile_row.locale,locale_source='follow_site' where e.user_id=p_user_id;
  end if;
  -- Consent timestamps, enabled state, wording and audit history are untouched.
  update public.profiles p set locale_revision=p.locale_revision+1 where p.user_id=p_user_id;
  insert into public.account_locale_commands(user_id,request_id,expected_revision,kind,locale)
    values(p_user_id,p_request_id,p_expected_revision,p_kind,p_locale);
  return query select 'applied'::text,r.site_locale,r.revision,r.email_locale,r.locale_source
    from public.read_account_locale(p_user_id) r;
end;
$$;
revoke execute on function public.read_account_locale(uuid) from public,anon,authenticated;
revoke execute on function public.change_account_locale(uuid,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.read_account_locale(uuid),public.change_account_locale(uuid,uuid,bigint,text,text) to service_role;

-- Preserve consent API/signature and its immutable command audit semantics.
-- Existing consent calls must no longer overwrite an explicit correspondence locale.
create or replace function public.change_wishlist_email_preference(
  p_user_id uuid,p_request_id uuid,p_enabled boolean,p_locale text,p_wording_version text,p_source text
) returns table(enabled boolean,locale text,wording_version text,updated_at timestamptz,enabled_since timestamptz)
language plpgsql security invoker set search_path=''
as $$
declare previous public.wishlist_email_consent_events%rowtype;
  desired_action text; server_time timestamptz; site_language text; email_language text;
begin
  if p_user_id is null or p_request_id is null or p_enabled is null
    or p_locale is null or p_locale not in ('it','en')
    or p_wording_version is distinct from 'wishlist-reminders-v1'
    or p_source is null or p_source not in ('wishlist-page','email-unsubscribe')
    or (p_source='email-unsubscribe' and p_enabled) then
    raise exception 'Invalid preference command.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  desired_action=case when p_enabled then 'grant' else 'withdraw' end;
  select * into previous from public.wishlist_email_consent_events e where e.user_id=p_user_id and e.request_id=p_request_id;
  if found then
    if (previous.action,previous.locale,previous.wording_version,previous.source)
      is distinct from (desired_action,p_locale,p_wording_version,p_source) then
      raise exception 'Request identity already used for a different command.' using errcode='22023';
    end if;
    return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
      from public.wishlist_email_preferences p where p.user_id=p_user_id;
    return;
  end if;
  select p.locale into site_language from public.profiles p where p.user_id=p_user_id;
  if not found then raise exception 'Profile required before consent.' using errcode='22023'; end if;
  select case when e.locale_source='explicit' then e.locale else site_language end into email_language
    from public.wishlist_email_preferences e where e.user_id=p_user_id;
  email_language=coalesce(email_language,site_language);
  server_time=pg_catalog.clock_timestamp();
  insert into public.wishlist_email_preferences as target(user_id,enabled,locale,wording_version,updated_at,enabled_since)
    values(p_user_id,p_enabled,email_language,p_wording_version,server_time,case when p_enabled then server_time else null end)
    on conflict(user_id) do update set enabled=excluded.enabled,locale=excluded.locale,
      wording_version=excluded.wording_version,updated_at=excluded.updated_at,
      enabled_since=case when not excluded.enabled then null when target.enabled then target.enabled_since else excluded.enabled_since end;
  insert into public.wishlist_email_consent_events(user_id,request_id,action,locale,wording_version,source,recorded_at)
    values(p_user_id,p_request_id,desired_action,p_locale,p_wording_version,p_source,server_time);
  return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
    from public.wishlist_email_preferences p where p.user_id=p_user_id;
end;
$$;
revoke execute on function public.change_wishlist_email_preference(uuid,uuid,boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.change_wishlist_email_preference(uuid,uuid,boolean,text,text,text) to service_role;
commit;
