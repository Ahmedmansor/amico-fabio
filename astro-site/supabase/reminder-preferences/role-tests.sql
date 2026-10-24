-- LOCAL REVIEW ONLY. NOT RUN. Separate explicit disposable-write approval needed.
-- Two synthetic Auth UUIDs, no emails. All preference fixtures end in ROLLBACK.
begin;
do $$ begin
  if to_regclass('public.wishlist_email_preferences') is null
    or to_regclass('public.wishlist_email_consent_events') is null then
    raise exception 'Apply the separately approved preference schema first.';
  end if;
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal)
    or exists(select 1 from information_schema.columns where table_schema='auth' and table_name='users'
      and is_nullable='NO' and column_default is null and column_name<>'id') then
    raise exception 'Review Auth fixture requirements before inserting synthetic users.';
  end if;
end $$;
create temporary table qa_reminder_fixture(a uuid,b uuid,r1 uuid,r2 uuid,r3 uuid) on commit drop;
insert into qa_reminder_fixture values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
grant select on qa_reminder_fixture to service_role,authenticated,anon;
insert into auth.users(id) select a from qa_reminder_fixture union all select b from qa_reminder_fixture;

set local role service_role;
do $$ declare f record; first_start timestamptz; begin
  select * into f from qa_reminder_fixture;
  perform public.change_wishlist_email_preference(f.a,f.r1,true,'en','wishlist-reminders-v1','wishlist-page');
  select enabled_since into first_start from public.wishlist_email_preferences where user_id=f.a;
  if first_start is null then raise exception 'Initial consent was not recorded.'; end if;
  perform public.change_wishlist_email_preference(f.a,f.r1,true,'en','wishlist-reminders-v1','wishlist-page');
  if (select count(*) from public.wishlist_email_consent_events where user_id=f.a)<>1 then raise exception 'Duplicate audit event.'; end if;
  begin
    perform public.change_wishlist_email_preference(f.a,f.r1,false,'en','wishlist-reminders-v1','wishlist-page');
    raise exception 'Conflicting request identity accepted.';
  exception when invalid_parameter_value then null; end;
  perform public.change_wishlist_email_preference(f.a,f.r2,true,'it','wishlist-reminders-v1','wishlist-page');
  if (select enabled_since from public.wishlist_email_preferences where user_id=f.a) is distinct from first_start
    then raise exception 'Saving enabled preferences restarted consent time.'; end if;
  perform public.change_wishlist_email_preference(f.a,f.r3,false,'it','wishlist-reminders-v1','wishlist-page');
  perform public.change_wishlist_email_preference(f.a,f.r1,true,'en','wishlist-reminders-v1','wishlist-page');
  if exists(select 1 from public.wishlist_email_preferences where user_id=f.a and (enabled or enabled_since is not null))
    then raise exception 'Old retry reinstated consent.'; end if;
  if (select count(*) from public.wishlist_email_consent_events where user_id=f.a)<>3 then raise exception 'Audit history mismatch.'; end if;
  begin
    perform public.change_wishlist_email_preference(f.a,gen_random_uuid(),true,'en','old-copy','wishlist-page');
    raise exception 'Stale consent version accepted.';
  exception when invalid_parameter_value then null; end;
  if exists(select 1 from public.wishlist_email_preferences where user_id=f.a and enabled) then raise exception 'Invalid command changed consent.'; end if;
  perform public.change_wishlist_email_preference(f.b,f.r1,true,'en','wishlist-reminders-v1','wishlist-page');
  if not exists(select 1 from public.wishlist_email_preferences where user_id=f.b and enabled)
    then raise exception 'Request identities were not scoped per account.'; end if;
  begin
    update public.wishlist_email_consent_events set action='grant' where user_id=f.a;
    raise exception 'Audit UPDATE privilege unexpectedly granted.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from qa_reminder_fixture),true);
do $$ declare f record; begin
  select * into f from qa_reminder_fixture;
  begin perform 1 from public.wishlist_email_preferences;
    raise exception 'Browser preference SELECT allowed.'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.wishlist_email_consent_events;
    raise exception 'Browser audit SELECT allowed.'; exception when insufficient_privilege then null; end;
  begin perform public.change_wishlist_email_preference(f.a,f.r1,true,'en','wishlist-reminders-v1','wishlist-page');
    raise exception 'Browser RPC allowed.'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ declare f record; begin
  select * into f from qa_reminder_fixture;
  begin perform 1 from public.wishlist_email_preferences;
    raise exception 'Anonymous preference SELECT allowed.'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.wishlist_email_consent_events;
    raise exception 'Anonymous audit SELECT allowed.'; exception when insufficient_privilege then null; end;
  begin perform public.change_wishlist_email_preference(f.a,f.r1,true,'en','wishlist-reminders-v1','wishlist-page');
    raise exception 'Anonymous RPC allowed.'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from auth.users where id in (select a from qa_reminder_fixture union all select b from qa_reminder_fixture);
do $$ begin
  if exists(select 1 from public.wishlist_email_preferences where user_id in (select a from qa_reminder_fixture union all select b from qa_reminder_fixture))
    or exists(select 1 from public.wishlist_email_consent_events where user_id in (select a from qa_reminder_fixture union all select b from qa_reminder_fixture)) then
    raise exception 'Account-data cascade failed.';
  end if;
end $$;
select 'Preference role assertions reached; ROLLBACK follows.' as proposed_role_test_result;
rollback;
