-- LOCAL REVIEW PROPOSAL ONLY. Not applied. No email or Cron activation.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
alter table public.wishlist_email_consent_events add column consent_locale text
  check(consent_locale in ('it','en'));
alter table public.wishlist_email_consent_events add column correspondence_locale text
  check(correspondence_locale in ('it','en'));
-- Historical records stay untouched: do not invent a missing consent snapshot.
update public.wishlist_email_preferences set locale_source='explicit'
  where locale_source='follow_site';

create function public.change_wishlist_email_preference_v2(
  p_user_id uuid,p_request_id uuid,p_enabled boolean,p_locale text,
  p_consent_locale text,p_wording_version text,p_source text
) returns table(enabled boolean,locale text,wording_version text,updated_at timestamptz,enabled_since timestamptz)
language plpgsql security invoker set search_path=''
as $$
declare previous public.wishlist_email_consent_events%rowtype;
  current_preference public.wishlist_email_preferences%rowtype;
  desired_action text; server_time timestamptz; email_language text;
begin
  if p_user_id is null or p_request_id is null or p_enabled is null
    or p_locale is null or p_locale not in ('it','en')
    or p_consent_locale is null or p_consent_locale not in ('it','en')
    or p_wording_version is distinct from 'wishlist-reminders-v1'
    or p_source is null or p_source not in ('wishlist-page','email-unsubscribe')
    or (p_source='email-unsubscribe' and p_enabled) then
    raise exception 'Invalid preference command.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  desired_action=case when p_enabled then 'grant' else 'withdraw' end;
  select * into previous from public.wishlist_email_consent_events e
    where e.user_id=p_user_id and e.request_id=p_request_id;
  if found then
    if (previous.action,previous.locale,previous.consent_locale,previous.wording_version,previous.source)
      is distinct from (desired_action,p_locale,p_consent_locale,p_wording_version,p_source) then
      raise exception 'Request identity already used.' using errcode='22023';
    end if;
    return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
      from public.wishlist_email_preferences p where p.user_id=p_user_id;
    return;
  end if;
  if not exists(select 1 from public.profiles p where p.user_id=p_user_id) then
    raise exception 'Profile required before consent.' using errcode='22023';
  end if;
  select * into current_preference from public.wishlist_email_preferences e where e.user_id=p_user_id;
  if not found and not p_enabled then raise exception 'Preference absent.' using errcode='22023'; end if;
  email_language=coalesce(current_preference.locale,p_locale);
  server_time=pg_catalog.clock_timestamp();
  insert into public.wishlist_email_preferences as target(user_id,enabled,locale,locale_source,wording_version,updated_at,enabled_since)
    values(p_user_id,p_enabled,email_language,'explicit',p_wording_version,server_time,case when p_enabled then server_time else null end)
    on conflict(user_id) do update set enabled=excluded.enabled,locale_source='explicit',
      wording_version=excluded.wording_version,updated_at=excluded.updated_at,
      enabled_since=case when not excluded.enabled then null when target.enabled then target.enabled_since else excluded.enabled_since end;
  insert into public.wishlist_email_consent_events(user_id,request_id,action,locale,consent_locale,correspondence_locale,wording_version,source,recorded_at)
    values(p_user_id,p_request_id,desired_action,p_locale,p_consent_locale,email_language,p_wording_version,p_source,server_time);
  return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
    from public.wishlist_email_preferences p where p.user_id=p_user_id;
end;
$$;
revoke execute on function public.change_wishlist_email_preference_v2(uuid,uuid,boolean,text,text,text,text) from public,anon,authenticated;
grant execute on function public.change_wishlist_email_preference_v2(uuid,uuid,boolean,text,text,text,text) to service_role;
-- Coordinate the reviewed Edge upgrade: old service must not continue accepting
-- grants without the new audit snapshot after activation.
revoke execute on function public.change_wishlist_email_preference(uuid,uuid,boolean,text,text,text) from service_role;
commit;
