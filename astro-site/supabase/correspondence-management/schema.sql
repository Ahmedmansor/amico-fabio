-- LOCAL REVIEW PROPOSAL ONLY. Requires correspondence-policy first. NOT APPLIED.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
create schema wishlist_correspondence_internal;
revoke all on schema wishlist_correspondence_internal from public,anon,authenticated,service_role;
grant usage on schema wishlist_correspondence_internal to service_role;
create table wishlist_correspondence_internal.tokens(
  token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  issued_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check(expires_at>issued_at)
);
create index correspondence_token_user_idx on wishlist_correspondence_internal.tokens(user_id);
alter table wishlist_correspondence_internal.tokens enable row level security;
revoke all on wishlist_correspondence_internal.tokens from public,anon,authenticated,service_role;
grant select on wishlist_correspondence_internal.tokens to service_role;
grant insert(token_hash,user_id,expires_at) on wishlist_correspondence_internal.tokens to service_role;
grant update(revoked_at) on wishlist_correspondence_internal.tokens to service_role;

create function public.issue_wishlist_correspondence_token(p_user_id uuid,p_token_hash text,p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path=''
as $$ begin
  if p_user_id is null or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_expires_at is null or p_expires_at<=pg_catalog.clock_timestamp() then
    raise exception 'Invalid capability issue.' using errcode='22023';
  end if;
  if not exists(select 1 from public.wishlist_email_preferences p where p.user_id=p_user_id) then return false; end if;
  insert into wishlist_correspondence_internal.tokens(user_id,token_hash,expires_at) values(p_user_id,p_token_hash,p_expires_at);
  return true;
end $$;
revoke execute on function public.issue_wishlist_correspondence_token(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.issue_wishlist_correspondence_token(uuid,text,timestamptz) to service_role;

create function public.manage_wishlist_correspondence(
  p_token_hash text,p_operation text,p_request_id uuid,p_locale text,p_expected_revision bigint,p_consent_locale text
) returns table(enabled boolean,locale text,revision bigint,conflict boolean)
language plpgsql security invoker set search_path=''
as $$
declare capability wishlist_correspondence_internal.tokens%rowtype; command_language text;
  current_preference public.wishlist_email_preferences%rowtype; mutation record;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_operation is null or p_operation not in ('read','unsubscribe','language')
    or (p_operation='read' and (p_request_id is not null or p_locale is not null or p_expected_revision is not null or p_consent_locale is not null))
    or (p_operation<>'read' and p_request_id is null)
    or (p_operation='unsubscribe' and (p_locale is not null or p_expected_revision is not null or p_consent_locale is null or p_consent_locale not in ('it','en')))
    or (p_operation='language' and (p_locale is null or p_locale not in ('it','en') or p_expected_revision is null or p_expected_revision<0 or p_consent_locale is not null)) then
    raise exception 'Invalid management command.' using errcode='22023';
  end if;
  select * into capability from wishlist_correspondence_internal.tokens t where t.token_hash=p_token_hash;
  if not found then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(capability.user_id::text,0));
  -- Recheck after waiting; a concurrent revocation/expiry must not be ignored.
  select * into capability from wishlist_correspondence_internal.tokens t where t.token_hash=p_token_hash for share;
  if not found or capability.revoked_at is not null or capability.expires_at<=pg_catalog.clock_timestamp() then return; end if;
  select * into current_preference from public.wishlist_email_preferences p where p.user_id=capability.user_id;
  if not found then return; end if;
  if p_operation='unsubscribe' then
    select e.locale into command_language from public.wishlist_email_consent_events e
      where e.user_id=capability.user_id and e.request_id=p_request_id;
    perform public.change_wishlist_email_preference_v2(capability.user_id,p_request_id,false,
      coalesce(command_language,current_preference.locale),p_consent_locale,'wishlist-reminders-v1','email-unsubscribe');
  elsif p_operation='language' then
    select * into mutation from public.change_account_locale(capability.user_id,p_request_id,p_expected_revision,'email_explicit',p_locale);
    -- This RPC preserves consent, timestamps, schedule and first-send allowance.
    if mutation.outcome='conflict' then
      return query select p.enabled,p.locale,f.locale_revision,true from public.wishlist_email_preferences p
        join public.profiles f using(user_id) where p.user_id=capability.user_id;
      return;
    end if;
  end if;
  return query select p.enabled,p.locale,f.locale_revision,false from public.wishlist_email_preferences p
    join public.profiles f using(user_id) where p.user_id=capability.user_id;
end;
$$;
revoke execute on function public.manage_wishlist_correspondence(text,text,uuid,text,bigint,text) from public,anon,authenticated;
grant execute on function public.manage_wishlist_correspondence(text,text,uuid,text,bigint,text) to service_role;
commit;
