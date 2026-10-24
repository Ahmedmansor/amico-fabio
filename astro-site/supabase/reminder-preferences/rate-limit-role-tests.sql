-- LOCAL REVIEW ONLY. NOT RUN. Requires disposable-write authorization after schema approval.
-- Two synthetic Auth UUIDs without email; all changes end in ROLLBACK.
begin;
do $$ begin
  if to_regclass('public.wishlist_preference_rate_limits') is null then raise exception 'Rate schema must be separately approved and applied.';end if;
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal)
    or exists(select 1 from information_schema.columns where table_schema='auth' and table_name='users'
      and is_nullable='NO' and column_default is null and column_name<>'id') then
    raise exception 'Review Auth fixture requirements.';
  end if;
end $$;
create temporary table qa_preference_rate_fixture(a uuid,b uuid) on commit drop;
insert into qa_preference_rate_fixture values(gen_random_uuid(),gen_random_uuid());
grant select on qa_preference_rate_fixture to service_role,authenticated,anon;
insert into auth.users(id) select a from qa_preference_rate_fixture union all select b from qa_preference_rate_fixture;
set local role service_role;
do $$ declare f record; answer record; begin
  select * into f from qa_preference_rate_fixture;
  -- Test thresholds only. They are not deployment policy.
  select * into answer from public.consume_wishlist_preference_limit(f.a,'read',2,60);
  if not answer.allowed or answer.retry_after_seconds<>0 then raise exception 'First request denied.';end if;
  select * into answer from public.consume_wishlist_preference_limit(f.a,'read',2,60);
  if not answer.allowed then raise exception 'Second request denied.';end if;
  select * into answer from public.consume_wishlist_preference_limit(f.a,'read',2,60);
  if answer.allowed or answer.retry_after_seconds not between 1 and 60 then raise exception 'Limit not enforced.';end if;
  if (select requests from public.wishlist_preference_rate_limits where user_id=f.a and operation='read')<>2 then raise exception 'Denied request incremented counter.';end if;
  select * into answer from public.consume_wishlist_preference_limit(f.a,'write',1,60);
  if not answer.allowed then raise exception 'Read/write buckets not independent.';end if;
  select * into answer from public.consume_wishlist_preference_limit(f.b,'read',1,60);
  if not answer.allowed then raise exception 'Account buckets not independent.';end if;
  update public.wishlist_preference_rate_limits set window_started_at=clock_timestamp()-interval '61 seconds' where user_id=f.a and operation='read';
  select * into answer from public.consume_wishlist_preference_limit(f.a,'read',2,60);
  if not answer.allowed or (select requests from public.wishlist_preference_rate_limits where user_id=f.a and operation='read')<>1 then raise exception 'Window did not reset.';end if;
  begin perform public.consume_wishlist_preference_limit(f.a,'read',0,60);
    raise exception 'Zero threshold accepted.';exception when invalid_parameter_value then null;end;
  begin perform public.consume_wishlist_preference_limit(f.a,'arbitrary',2,60);
    raise exception 'Arbitrary bucket accepted.';exception when invalid_parameter_value then null;end;
end $$;
reset role;
set local role authenticated;
do $$ declare f record;begin
  select * into f from qa_preference_rate_fixture;
  begin perform 1 from public.wishlist_preference_rate_limits;
    raise exception 'Browser table read allowed.';exception when insufficient_privilege then null;end;
  begin perform public.consume_wishlist_preference_limit(f.a,'read',2,60);
    raise exception 'Browser RPC allowed.';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ declare f record;begin
  select * into f from qa_preference_rate_fixture;
  begin perform 1 from public.wishlist_preference_rate_limits;
    raise exception 'Anonymous table read allowed.';exception when insufficient_privilege then null;end;
  begin perform public.consume_wishlist_preference_limit(f.a,'read',2,60);
    raise exception 'Anonymous RPC allowed.';exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from auth.users where id in (select a from qa_preference_rate_fixture union all select b from qa_preference_rate_fixture);
do $$ begin
  if exists(select 1 from public.wishlist_preference_rate_limits where user_id in (select a from qa_preference_rate_fixture union all select b from qa_preference_rate_fixture))
    then raise exception 'Account cascade failed.';end if;
end $$;
select 'Rate role assertions reached; ROLLBACK follows.' as proposed_rate_test_result;
rollback;
