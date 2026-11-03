-- Authorized disposable registration test. No Auth HTTP/email calls.
-- Reviewed both existing auth.users INSERT triggers before executing.
begin;
set local lock_timeout='2s';
set local statement_timeout='15s';
do $$ begin
  if exists(select 1 from auth.users where id='711ea2a4-34be-4a88-810a-2371c10eaa83') then
    raise exception 'Disposable fixture ID already exists';
  end if;
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal
    and tgname not in ('capture_account_marketing_signup','on_auth_user_created_onboarding')) then
    raise exception 'Unexpected Auth trigger: review before test';
  end if;
end $$;
-- MCP cannot SET ROLE supabase_auth_admin. Exercise the real INSERT trigger
-- using the connected SQL role; this is not an end-to-end Auth HTTP test.
insert into auth.users(id) values ('711ea2a4-34be-4a88-810a-2371c10eaa83');
do $$ begin
  if not exists(select 1 from public.account_onboarding
    where user_id='711ea2a4-34be-4a88-810a-2371c10eaa83'
    and is_eligible and rollout_version='welcome-v1') then
    raise exception 'Registration trigger failed to create onboarding';
  end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform public.handle_new_user_onboarding();
    raise exception 'Anonymous direct execution allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform public.handle_new_user_onboarding();
    raise exception 'Authenticated direct execution allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select json_build_object(
  'registration_trigger_assertion','passed before rollback',
  'anon_direct_execution','denied',
  'authenticated_direct_execution','denied',
  'fixture_users_remaining',(select count(*) from auth.users where id='711ea2a4-34be-4a88-810a-2371c10eaa83'),
  'fixture_onboarding_remaining',(select count(*) from public.account_onboarding where user_id='711ea2a4-34be-4a88-810a-2371c10eaa83'),
  'fixture_marketing_remaining',(select count(*) from account_marketing_private.signup_intents where user_id='711ea2a4-34be-4a88-810a-2371c10eaa83')
) as verification;
