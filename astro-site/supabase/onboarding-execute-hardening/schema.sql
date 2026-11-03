-- Authorized security hardening, 2026-11-03. Preserve trigger, owner and body.
begin;
set local lock_timeout='2s';
set local statement_timeout='15s';
do $$ begin
  if (select md5(pg_get_functiondef('public.handle_new_user_onboarding()'::regprocedure)))
    <> '0882f9d6de8aff8c66e0e3371350c8d5' then
    raise exception 'Onboarding function changed: review before hardening';
  end if;
  if not exists(select 1 from pg_trigger
    where tgrelid='auth.users'::regclass
    and tgfoid='public.handle_new_user_onboarding()'::regprocedure
    and tgname='on_auth_user_created_onboarding' and tgenabled='O') then
    raise exception 'Expected enabled onboarding trigger missing';
  end if;
end $$;
revoke execute on function public.handle_new_user_onboarding() from public, anon, authenticated;
do $$ begin
  if has_function_privilege('anon','public.handle_new_user_onboarding()','EXECUTE')
    or has_function_privilege('authenticated','public.handle_new_user_onboarding()','EXECUTE') then
    raise exception 'Client EXECUTE remains enabled';
  end if;
end $$;
commit;
