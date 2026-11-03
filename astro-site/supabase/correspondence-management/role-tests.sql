-- NOT RUN. Two disposable users, no emails/catalog changes. Separate approval.
begin;
do $$ begin
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal) then
    raise exception 'Review custom Auth triggers before disposable fixtures.';
  end if;
end $$;
create temporary table qa_management(a uuid,b uuid,hash text,withdraw_id uuid) on commit drop;
insert into qa_management values(gen_random_uuid(),gen_random_uuid(),repeat('a',64),gen_random_uuid());
grant select on qa_management to service_role,authenticated,anon;
insert into auth.users(id) select a from qa_management union all select b from qa_management;
insert into public.profiles(user_id,locale) select a,'en' from qa_management union all select b,'it' from qa_management;
set local role service_role;
select public.change_wishlist_email_preference_v2(a,gen_random_uuid(),true,'en','en','wishlist-reminders-v1','wishlist-page') from qa_management;
select public.change_wishlist_email_preference_v2(b,gen_random_uuid(),true,'it','it','wishlist-reminders-v1','wishlist-page') from qa_management;
select public.issue_wishlist_correspondence_token(a,hash,clock_timestamp()+interval '1 minute') from qa_management;
select public.manage_wishlist_correspondence(hash,'read',null,null,null,null) from qa_management;
select public.manage_wishlist_correspondence(hash,'unsubscribe',withdraw_id,null,null,'it') from qa_management;
select public.manage_wishlist_correspondence(hash,'language',gen_random_uuid(),'it',0,null) from qa_management;
-- Replay withdrawal after language changed: return current state, never resubscribe.
select public.manage_wishlist_correspondence(hash,'unsubscribe',withdraw_id,null,null,'it') from qa_management;
do $$ declare f record; before_events bigint; begin
  select * into f from qa_management;
  if not exists(select 1 from public.wishlist_email_preferences where user_id=f.a and not enabled and locale='it')
    or not exists(select 1 from public.wishlist_email_preferences where user_id=f.b and enabled and locale='it') then
    raise exception 'Capability escaped account or language re-enabled consent.';
  end if;
  if not exists(select 1 from public.wishlist_email_consent_events where user_id=f.a and request_id=f.withdraw_id and consent_locale='it') then
    raise exception 'Displayed withdrawal language missing.';
  end if;
  if exists(select 1 from public.manage_wishlist_correspondence(repeat('b',64),'read',null,null,null,null)) then
    raise exception 'Unknown capability allowed.';
  end if;
  select count(*) into before_events from public.wishlist_email_consent_events where user_id=f.a;
  perform public.manage_wishlist_correspondence(f.hash,'read',null,null,null,null);
  if (select count(*) from public.wishlist_email_consent_events where user_id=f.a)<>before_events then
    raise exception 'Opening preferences changed consent.';
  end if;
  update wishlist_correspondence_internal.tokens set revoked_at=clock_timestamp() where token_hash=f.hash;
  if exists(select 1 from public.manage_wishlist_correspondence(f.hash,'read',null,null,null,null)) then
    raise exception 'Revoked capability allowed.';
  end if;
end $$;
reset role;
-- Expired fixture is deliberately inserted administratively inside rollback.
insert into wishlist_correspondence_internal.tokens(token_hash,user_id,issued_at,expires_at)
  select repeat('c',64),a,clock_timestamp()-interval '2 minutes',clock_timestamp()-interval '1 minute' from qa_management;
set local role service_role;
do $$ begin
  if exists(select 1 from public.manage_wishlist_correspondence(repeat('c',64),'read',null,null,null,null)) then
    raise exception 'Expired capability allowed.';
  end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform public.manage_wishlist_correspondence(repeat('a',64),'read',null,null,null,null);
    raise exception 'Anonymous direct RPC allowed.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
