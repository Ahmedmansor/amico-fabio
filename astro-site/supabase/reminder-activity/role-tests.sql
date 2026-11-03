-- NOT RUN. Separately approve two disposable Auth users and favorite fixtures, ROLLBACK.
-- References existing published tour/package IDs; never alters the catalog or sends mail.
begin;
do $$ begin
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal)
    or exists(select 1 from information_schema.columns where table_schema='auth' and table_name='users'
      and is_nullable='NO' and column_default is null and column_name<>'id') then
    raise exception 'Review Auth fixture requirements before running.';
  end if;
end $$;
create temporary table qa_activity_fixture(a uuid,b uuid,trip text,package text) on commit drop;
insert into qa_activity_fixture values(gen_random_uuid(),gen_random_uuid(),
  (select id from public.trips where is_active order by id limit 1),
  (select id from public.packages where is_active order by id limit 1));
do $$ begin
  if exists(select 1 from qa_activity_fixture where trip is null or package is null) then
    raise exception 'Existing published tour and package required; do not invent records.';
  end if;
end $$;
grant select on qa_activity_fixture to service_role,authenticated,anon;
insert into auth.users(id) select a from qa_activity_fixture union all select b from qa_activity_fixture;
insert into public.profiles(user_id,locale) select a,'it' from qa_activity_fixture union all select b,'en' from qa_activity_fixture;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from qa_activity_fixture),true);
insert into public.wishlists(user_id,trip_id) select a,trip from qa_activity_fixture;
reset role;
create temporary table qa_activity_first as select a.* from wishlist_reminder_internal.activity a join qa_activity_fixture f on a.user_id=f.a;
select pg_catalog.pg_sleep(0.005);
set local role authenticated;
insert into public.package_wishlists(user_id,package_id) select a,package from qa_activity_fixture;
reset role;
create temporary table qa_activity_second as select a.* from wishlist_reminder_internal.activity a join qa_activity_fixture f on a.user_id=f.a;
do $$ begin
  if not exists(select 1 from qa_activity_second s join qa_activity_first f using(user_id)
    where s.favorite_count=2 and s.revision=f.revision+1 and s.last_addition_at>f.last_addition_at) then
    raise exception 'Combined count/new addition history mismatch.';
  end if;
end $$;
set local role authenticated;
-- Duplicate saves must not trigger another row event or postpone anything.
insert into public.package_wishlists(user_id,package_id) select a,package from qa_activity_fixture on conflict do nothing;
delete from public.package_wishlists where user_id=(select a from qa_activity_fixture);
reset role;
do $$ begin
  if not exists(select 1 from wishlist_reminder_internal.activity a join qa_activity_second s using(user_id)
    where a.favorite_count=1 and a.last_addition_at=s.last_addition_at and a.revision=s.revision+1) then
    raise exception 'Duplicate reset history or removing newest rewound the clock.';
  end if;
end $$;
set local role service_role;
do $$ declare f record; original_addition timestamptz; begin
  select * into f from qa_activity_fixture;
  select last_addition_at into original_addition from public.read_wishlist_reminder_activity(f.a);
  perform public.change_wishlist_email_preference_v2(f.a,gen_random_uuid(),true,'it','it','wishlist-reminders-v1','wishlist-page');
  perform public.change_account_locale(f.a,gen_random_uuid(),0,'site','en');
  if (select last_addition_at from public.read_wishlist_reminder_activity(f.a)) is distinct from original_addition then
    raise exception 'Consent or language changed real addition history.';
  end if;
  begin
    update wishlist_reminder_internal.activity set favorite_count=99 where user_id=f.a;
    raise exception 'Service role may directly forge activity.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
delete from public.wishlists where user_id=(select a from qa_activity_fixture);
reset role;
do $$ begin
  if not exists(select 1 from wishlist_reminder_internal.activity where user_id=(select a from qa_activity_fixture)
    and favorite_count=0 and last_addition_at is null) then raise exception 'Empty activity was not cleared.'; end if;
end $$;
select pg_catalog.pg_sleep(0.005);
set local role authenticated;
insert into public.package_wishlists(user_id,package_id) select a,package from qa_activity_fixture;
do $$ declare f record; begin
  select * into f from qa_activity_fixture;
  begin
    perform 1 from wishlist_reminder_internal.activity;
    raise exception 'Browser private activity SELECT allowed.';
  exception when insufficient_privilege then null; end;
  begin
    perform public.read_wishlist_reminder_activity(f.a);
    raise exception 'Browser activity RPC allowed.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wishlists(user_id,trip_id) values(f.b,f.trip);
    raise exception 'Cross-account activity insert allowed.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if not exists(select 1 from wishlist_reminder_internal.activity a join qa_activity_second s using(user_id)
    where a.favorite_count=1 and a.last_addition_at>s.last_addition_at)
    or exists(select 1 from wishlist_reminder_internal.activity where user_id=(select b from qa_activity_fixture)) then
    raise exception 'Refill or account isolation failed.';
  end if;
  -- Nested rollback must not leave an activity event behind.
  begin
    insert into public.wishlists(user_id,trip_id) select b,trip from qa_activity_fixture;
    raise exception 'synthetic rollback' using errcode='P0002';
  exception when no_data_found then null; end;
  if exists(select 1 from wishlist_reminder_internal.activity where user_id=(select b from qa_activity_fixture)) then
    raise exception 'Rolled-back favorite left durable activity.';
  end if;
end $$;
set local role anon;
do $$ begin
  begin perform public.read_wishlist_reminder_activity((select a from qa_activity_fixture));
    raise exception 'Anonymous RPC allowed.'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from auth.users where id in (select a from qa_activity_fixture union all select b from qa_activity_fixture);
do $$ begin
  if exists(select 1 from wishlist_reminder_internal.activity where user_id in (select a from qa_activity_fixture union all select b from qa_activity_fixture)) then
    raise exception 'Auth cascade recreated or retained activity.';
  end if;
end $$;
select 'Activity role assertions reached; ROLLBACK follows.' as proposed_result;
rollback;
