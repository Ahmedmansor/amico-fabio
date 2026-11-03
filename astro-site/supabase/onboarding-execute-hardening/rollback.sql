-- Emergency rollback only; restores the previously inherited public EXECUTE.
-- Do not run during normal operation: this reintroduces the advisor warning.
begin;
grant execute on function public.handle_new_user_onboarding() to public;
commit;
