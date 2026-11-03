-- UNEXECUTED isolated role proposal, no accounts or emails. ROLLBACK.
-- Refuse existing operational state: never overwrite a live rate bucket for QA.
begin;
lock table wishlist_correspondence_internal.ingress in share row exclusive mode;
do $$ begin
  if exists(select 1 from wishlist_correspondence_internal.ingress) then raise exception 'Existing management counter: use an isolated database.'; end if;
end $$;
set local role service_role;
do $$ declare result record; begin
  select * into result from public.consume_wishlist_management_limit(2,60);
  if not result.allowed or result.retry_after_seconds<>0 then raise exception 'First request denied.'; end if;
  select * into result from public.consume_wishlist_management_limit(2,60);
  if not result.allowed then raise exception 'Second request denied.'; end if;
  select * into result from public.consume_wishlist_management_limit(2,60);
  if result.allowed or result.retry_after_seconds not between 1 and 60 then raise exception 'Limit bypass.'; end if;
  begin perform public.consume_wishlist_management_limit(3,60);raise exception 'Policy change reset budget.';
    exception when invalid_parameter_value then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*) from wishlist_correspondence_internal.ingress)<>1 then raise exception 'Unbounded ingress storage.'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform public.consume_wishlist_management_limit(2,60);raise exception 'Anonymous counter RPC allowed.';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
