-- LOCAL PROPOSAL ONLY. This creates NO schedule, Vault secret or enabled token.
begin;
create table wishlist_reminder_internal.cron_auth(id integer primary key check(id=1),token_hash text not null check(token_hash~'^[a-f0-9]{64}$'),enabled boolean not null default false,webhook_ready boolean not null default false);
alter table wishlist_reminder_internal.cron_auth enable row level security;
revoke all on wishlist_reminder_internal.cron_auth from public,anon,authenticated,service_role;
grant select on wishlist_reminder_internal.cron_auth to service_role;
grant update(webhook_ready) on wishlist_reminder_internal.cron_auth to service_role;
create function public.confirm_wishlist_reminder_webhook()
returns boolean language plpgsql security invoker set search_path='' as $$ begin
  update wishlist_reminder_internal.cron_auth set webhook_ready=true where id=1 and enabled;return found;
end $$;
create function public.verify_wishlist_reminder_cron(p_token_hash text)
returns boolean language sql security invoker set search_path=''
as $$ select exists(select 1 from wishlist_reminder_internal.cron_auth a where a.id=1 and a.enabled and p_token_hash~'^[a-f0-9]{64}$'
  and a.token_hash=p_token_hash) $$;
revoke execute on function public.verify_wishlist_reminder_cron(text),public.confirm_wishlist_reminder_webhook() from public,anon,authenticated;
grant execute on function public.verify_wishlist_reminder_cron(text),public.confirm_wishlist_reminder_webhook() to service_role;
commit;
