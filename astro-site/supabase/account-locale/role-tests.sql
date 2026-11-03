-- Passed on fabioEgypt 2026-10-24 after disposable-write approval; ROLLBACK verified.
-- Retained test source. Re-execution needs permitted fixture scope. No emails/catalog.
begin;
do $$ begin
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal)
    or exists(select 1 from information_schema.columns where table_schema='auth' and table_name='users'
      and is_nullable='NO' and column_default is null and column_name<>'id') then
    raise exception 'Review Auth fixture requirements before inserting synthetic users.';
  end if;
end $$;
create temporary table qa_locale_fixture(a uuid,b uuid,r1 uuid,r2 uuid,r3 uuid,r4 uuid) on commit drop;
insert into qa_locale_fixture values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
grant select on qa_locale_fixture to service_role,authenticated,anon;
insert into auth.users(id) select a from qa_locale_fixture union all select b from qa_locale_fixture;
insert into public.profiles(user_id,locale) select a,'it' from qa_locale_fixture union all select b,'en' from qa_locale_fixture;

set local role service_role;
do $$ declare f record; r record; original_start timestamptz; original_updated timestamptz; audit_count bigint; begin
  select * into f from qa_locale_fixture;
  select * into r from public.change_account_locale(f.a,f.r1,0,'site','en');
  if r.outcome<>'applied' or r.revision<>1 or r.email_locale is not null then
    raise exception 'Guest-like site change created a preference or failed.'; end if;
  select * into r from public.change_account_locale(f.a,f.r2,1,'email_explicit','it');
  if r.outcome<>'missing-preference' then raise exception 'Missing preference was created implicitly.'; end if;
  perform public.change_wishlist_email_preference(f.a,gen_random_uuid(),true,'it','wishlist-reminders-v1','wishlist-page');
  if not exists(select 1 from public.wishlist_email_preferences where user_id=f.a and locale='en' and locale_source='follow_site')
    then raise exception 'New consent did not follow saved site language.'; end if;
  select enabled_since,updated_at into original_start,original_updated from public.wishlist_email_preferences where user_id=f.a;
  select count(*) into audit_count from public.wishlist_email_consent_events where user_id=f.a;
  select * into r from public.change_account_locale(f.a,f.r2,1,'email_explicit','it');
  if r.outcome<>'applied' or r.locale_source<>'explicit' or r.email_locale<>'it' or r.revision<>2
    then raise exception 'Explicit choice failed.'; end if;
  select * into r from public.change_account_locale(f.a,f.r3,1,'site','it');
  if r.outcome<>'conflict' or r.revision<>2 or r.site_locale<>'en' or r.email_locale<>'it'
    then raise exception 'Out-of-order choice overwrote newer state.'; end if;
  select * into r from public.change_account_locale(f.a,f.r1,0,'site','en');
  if r.outcome<>'duplicate' or r.revision<>2 or r.locale_source<>'explicit'
    then raise exception 'Old retry replayed an accepted command.'; end if;
  select * into r from public.change_account_locale(f.a,f.r1,2,'site','it');
  if r.outcome<>'invalid-input' then raise exception 'Request identity reused with new payload.'; end if;
  select * into r from public.change_account_locale(f.a,f.r3,2,'site','en');
  if r.outcome<>'applied' or r.locale_source<>'explicit' or r.email_locale<>'it' then raise exception 'Site choice replaced explicit mode/language.'; end if;
  select * into r from public.change_account_locale(f.a,f.r4,3,'email_follow_site',null);
  if r.outcome<>'applied' or r.revision<>4 or r.locale_source<>'follow_site' or r.email_locale<>'en'
    then raise exception 'Returning to follow-site failed.'; end if;
  select * into r from public.change_account_locale(f.a,gen_random_uuid(),4,'site','it');
  if r.outcome<>'applied' or r.email_locale<>'it' then raise exception 'Follow-site did not track site change.'; end if;
  if not exists(select 1 from public.wishlist_email_preferences where user_id=f.a and enabled
    and enabled_since=original_start and updated_at=original_updated)
    or (select count(*) from public.wishlist_email_consent_events where user_id=f.a)<>audit_count
    then raise exception 'Language change mutated consent or audit timing.'; end if;
  select * into r from public.change_account_locale(f.a,gen_random_uuid(),5,'site','ar');
  if r.outcome<>'invalid-input' then raise exception 'Unsupported locale accepted.'; end if;
  select * into r from public.read_account_locale(f.b);
  if r.site_locale<>'en' or r.revision<>0 or r.email_locale is not null then raise exception 'Account isolation failed.'; end if;
  -- Same request UUID is allowed in another verified account.
  select * into r from public.change_account_locale(f.b,f.r1,0,'site','it');
  if r.outcome<>'applied' then raise exception 'Request identity not scoped to account.'; end if;
  -- Consent resave and withdrawal preserve explicit correspondence language.
  perform public.change_account_locale(f.a,gen_random_uuid(),5,'email_explicit','en');
  perform public.change_wishlist_email_preference(f.a,gen_random_uuid(),true,'it','wishlist-reminders-v1','wishlist-page');
  if not exists(select 1 from public.wishlist_email_preferences where user_id=f.a and locale='en'
    and locale_source='explicit' and enabled_since=original_start) then raise exception 'Consent resave overwrote explicit language or start.'; end if;
  perform public.change_wishlist_email_preference(f.a,gen_random_uuid(),false,'en','wishlist-reminders-v1','email-unsubscribe');
  perform public.change_account_locale(f.a,gen_random_uuid(),6,'site','it');
  if exists(select 1 from public.wishlist_email_preferences where user_id=f.a and (enabled or enabled_since is not null))
    then raise exception 'Site switch restored withdrawn consent.'; end if;
end $$;
reset role;

-- Actual authenticated owner/cross-account RLS remains intact; no RPC/table browser access.
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from qa_locale_fixture),true);
do $$ declare f record; begin
  select * into f from qa_locale_fixture;
  if exists(select 1 from public.profiles where user_id=f.b) then raise exception 'Cross-account profile exposed.'; end if;
  begin
    update public.profiles set locale='en' where user_id=f.a;
    raise exception 'Direct browser locale write bypassed versioning.';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.account_locale_commands;
    raise exception 'Browser command ledger access allowed.'; exception when insufficient_privilege then null; end;
  begin perform public.change_account_locale(f.b,f.r1,0,'site','it');
    raise exception 'Browser locale RPC allowed.'; exception when insufficient_privilege then null; end;
  begin perform public.read_account_locale(f.a);
    raise exception 'Browser locale read RPC allowed.'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ declare f record; begin
  select * into f from qa_locale_fixture;
  begin perform 1 from public.account_locale_commands;
    raise exception 'Anonymous ledger access allowed.'; exception when insufficient_privilege then null; end;
  begin perform public.change_account_locale(f.a,f.r1,0,'site','it');
    raise exception 'Anonymous locale RPC allowed.'; exception when insufficient_privilege then null; end;
  begin perform public.read_account_locale(f.a);
    raise exception 'Anonymous locale read allowed.'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from auth.users where id in (select a from qa_locale_fixture union all select b from qa_locale_fixture);
do $$ begin
  if exists(select 1 from public.account_locale_commands where user_id in (select a from qa_locale_fixture union all select b from qa_locale_fixture))
    then raise exception 'Account command cascade failed.'; end if;
end $$;
select 'Locale role assertions reached; ROLLBACK follows.' as proposed_result;
rollback;
