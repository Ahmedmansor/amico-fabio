-- Unified Account & Email Language Update
-- Replaces change_account_locale so that any site language change automatically
-- updates existing email preferences, superseding independent overrides.
-- Preserves advisory transaction lock, audit log, idempotency and revisions.

begin;

create or replace function public.change_account_locale(
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

revoke execute on function public.change_account_locale(uuid,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.change_account_locale(uuid,uuid,bigint,text,text) to service_role;

commit;
