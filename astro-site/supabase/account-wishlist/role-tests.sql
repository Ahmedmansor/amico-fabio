-- REVIEW ONLY: NOT RUN. Requires explicit authorization for disposable remote
-- test writes AFTER schema.sql has been approved/applied. Run the whole script
-- in one session. It inserts two synthetic Auth identities (no email), one
-- unpublished synthetic trip and package plus test favorites, then ROLLBACKs.
-- Never substitute real account IDs. No Auth API, mail or secret keys are used.
-- If a statement errors, issue ROLLBACK before any further work; do not COMMIT.
begin;

do $$ begin
  if to_regclass('public.profiles') is null or to_regclass('public.wishlists') is null
    or to_regclass('public.package_wishlists') is null then
    raise exception 'Apply and verify the separately approved schema before role tests.';
  end if;
  if exists (select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal) then
    raise exception 'Review Auth user triggers before inserting disposable test identities.';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='auth'
    and table_name='users' and is_nullable='NO' and column_default is null and column_name<>'id') then
    raise exception 'Auth user requirements changed: review the synthetic fixture.';
  end if;
end $$;

create temporary table qa_wishlist_fixture (
  user_a uuid not null, user_b uuid not null, trip_id text not null, inactive_id text not null,
  package_id text not null
) on commit drop;
insert into qa_wishlist_fixture
select gen_random_uuid(),gen_random_uuid(),id,
  'qa_wishlist_'||replace(gen_random_uuid()::text,'-',''),
  (select id from public.packages where is_active order by source_order limit 1)
from public.trips where is_active order by source_order limit 1;
do $$ begin
  if (select count(*) from qa_wishlist_fixture)<>1 then
    raise exception 'A published tour is required; no catalog record has been altered.';
  end if;
end $$;
grant select on qa_wishlist_fixture to authenticated,anon;

insert into auth.users(id) select user_a from qa_wishlist_fixture
union all select user_b from qa_wishlist_fixture;
-- Synthetic unpublished record only; the existing published tour is never modified.
insert into public.trips(id,slug,adult_price,child_price,min_pax,location,category,
  featured,badge_it,badge_en,is_active,source_order)
select inactive_id,inactive_id,0,0,1,'qa','qa',false,'','',false,
  (select coalesce(max(source_order),-1)+1 from public.trips)
from qa_wishlist_fixture;
insert into public.profiles(user_id,locale) select user_b,'en' from qa_wishlist_fixture;
insert into public.wishlists(user_id,trip_id) select user_b,trip_id from qa_wishlist_fixture;
insert into public.packages(id,slug,adult_price,child_price,min_pax,location,category,
  badge_key,is_active,source_order)
select inactive_id,inactive_id,0,0,1,'qa','qa','',false,
  (select coalesce(max(source_order),-1)+1 from public.packages)
from qa_wishlist_fixture;
insert into public.package_wishlists(user_id,package_id)
select user_b,package_id from qa_wishlist_fixture;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select user_a::text from qa_wishlist_fixture),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',
  (select user_a from qa_wishlist_fixture),'role','authenticated')::text,true);

do $$
declare a uuid; b uuid; tour text; hidden_tour text; original_added timestamptz; affected integer;
begin
  select user_a,user_b,trip_id,inactive_id into a,b,tour,hidden_tour from qa_wishlist_fixture;
  if current_user<>'authenticated' or auth.uid() is distinct from a then
    raise exception 'Role/JWT fixture not active; RLS test would be invalid.';
  end if;
  insert into public.profiles(user_id,locale) values(a,'it');
  update public.profiles set locale='en' where user_id=a;
  if (select locale from public.profiles where user_id=a)<>'en' then raise exception 'Own locale update failed.'; end if;
  if exists(select 1 from public.profiles where user_id=b) then raise exception 'Cross-user profile disclosure.'; end if;
  begin
    update public.profiles set locale='zz' where user_id=a;
    raise exception 'Invalid locale accepted.';
  exception when check_violation then null; end;
  begin
    insert into public.profiles(user_id,locale) values(b,'it');
    raise exception 'Cross-user profile insert accepted.';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set user_id=b where user_id=a;
    raise exception 'Profile ownership transfer accepted.';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set created_at='2000-01-01' where user_id=a;
    raise exception 'Client profile timestamp update accepted.';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.profiles where user_id=a;
    raise exception 'Direct client profile delete accepted.';
  exception when insufficient_privilege then null; end;

  insert into public.wishlists(user_id,trip_id) values(a,tour);
  select added_at into original_added from public.wishlists where user_id=a and trip_id=tour;
  insert into public.wishlists(user_id,trip_id) values(a,tour)
    on conflict(user_id,trip_id) do nothing;
  if (select count(*) from public.wishlists where user_id=a)<>1
    or (select added_at from public.wishlists where user_id=a and trip_id=tour) is distinct from original_added then
    raise exception 'Duplicate insert changed membership/timestamp.';
  end if;
  if exists(select 1 from public.wishlists where user_id=b) then raise exception 'Cross-user wishlist disclosure.'; end if;
  begin
    insert into public.wishlists(user_id,trip_id) values(b,tour);
    raise exception 'Cross-user wishlist insert accepted.';
  exception when insufficient_privilege then null; end;
  delete from public.wishlists where user_id=b;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Cross-user wishlist delete accepted.'; end if;
  begin
    update public.wishlists set added_at='2000-01-01' where user_id=a;
    raise exception 'Wishlist UPDATE accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wishlists(user_id,trip_id,added_at) values(a,tour,'2000-01-01');
    raise exception 'Client wishlist timestamp insert accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wishlists(user_id,trip_id) values(a,hidden_tour);
    raise exception 'Unpublished tour insertion accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wishlists(user_id,trip_id) values(a,hidden_tour||'_missing');
    raise exception 'Unknown tour insertion accepted.';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.trips where id=hidden_tour) then raise exception 'Authenticated unpublished catalog disclosure.'; end if;
  begin
    perform adult_price from public.trips limit 1;
    raise exception 'Authenticated catalog grants exceed reviewed identity columns.';
  exception when insufficient_privilege then null; end;
  delete from public.wishlists where user_id=a and trip_id=tour;
  if exists(select 1 from public.wishlists where user_id=a) then raise exception 'Own wishlist deletion failed.'; end if;
end $$;

-- Same ownership, catalog and timestamp guarantees for package favorites.
do $$ declare a uuid; b uuid; pack text; hidden_pack text; stamp timestamptz; affected integer;
begin
  select user_a,user_b,package_id,inactive_id into a,b,pack,hidden_pack from qa_wishlist_fixture;
  if auth.uid() is distinct from a then raise exception 'Package role fixture inactive.'; end if;
  insert into public.package_wishlists(user_id,package_id) values(a,pack);
  select added_at into stamp from public.package_wishlists where user_id=a and package_id=pack;
  if stamp is null then raise exception 'Own package insert/read failed.'; end if;
  insert into public.package_wishlists(user_id,package_id) values(a,pack) on conflict do nothing;
  if (select added_at from public.package_wishlists where user_id=a and package_id=pack) is distinct from stamp
    then raise exception 'Duplicate package reset timestamp.'; end if;
  if exists(select 1 from public.package_wishlists where user_id=b) then raise exception 'Cross-user package disclosure.'; end if;
  delete from public.package_wishlists where user_id=b;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Cross-user package delete accepted.'; end if;
  begin
    insert into public.package_wishlists(user_id,package_id) values(b,pack);
    raise exception 'Cross-user package insert accepted.';
  exception when insufficient_privilege then null; end;
  begin
    update public.package_wishlists set package_id=hidden_pack where user_id=a;
    raise exception 'Package UPDATE accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.package_wishlists(user_id,package_id,added_at) values(a,pack,'2000-01-01');
    raise exception 'Client package timestamp accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.package_wishlists(user_id,package_id) values(a,hidden_pack);
    raise exception 'Unpublished package accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.package_wishlists(user_id,package_id) values(a,hidden_pack||'_missing');
    raise exception 'Unknown package accepted.';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.packages where id=hidden_pack) then raise exception 'Hidden package catalog disclosed.'; end if;
  begin
    perform adult_price from public.packages limit 1;
    raise exception 'Package catalog grants exceed reviewed identity columns.';
  exception when insufficient_privilege then null; end;
  delete from public.package_wishlists where user_id=a and package_id=pack;
  if exists(select 1 from public.package_wishlists where user_id=a) then raise exception 'Own package delete failed.'; end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
do $$ begin
  begin
    perform 1 from public.package_wishlists;
    raise exception 'Anonymous package favorites SELECT accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.package_wishlists(user_id,package_id) select user_a,package_id from qa_wishlist_fixture;
    raise exception 'Anonymous package favorites INSERT accepted.';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.profiles;
    raise exception 'Anonymous profile SELECT accepted.';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.wishlists;
    raise exception 'Anonymous wishlist SELECT accepted.';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wishlists(user_id,trip_id) select user_a,trip_id from qa_wishlist_fixture;
    raise exception 'Anonymous wishlist INSERT accepted.';
  exception when insufficient_privilege then null; end;
  if not exists(select 1 from public.trips where id=(select trip_id from qa_wishlist_fixture)) then
    raise exception 'Original anonymous published catalog read failed.';
  end if;
  if exists(select 1 from public.trips where id=(select inactive_id from qa_wishlist_fixture)) then
    raise exception 'Anonymous unpublished catalog disclosure.';
  end if;
end $$;

reset role;
do $$ declare b uuid; begin
  select user_b into b from qa_wishlist_fixture;
  if (select count(*) from public.profiles where user_id=b)<>1
    or (select count(*) from public.wishlists where user_id=b)<>1
    or (select count(*) from public.package_wishlists where user_id=b)<>1 then
    raise exception 'Another account was modified during ownership tests.';
  end if;
  delete from auth.users where id=b;
  if exists(select 1 from public.profiles where user_id=b)
    or exists(select 1 from public.wishlists where user_id=b)
    or exists(select 1 from public.package_wishlists where user_id=b) then
    raise exception 'Account deletion did not cascade to its data.';
  end if;
  raise notice 'All account wishlist role assertions reached successfully; ROLLBACK follows. No live API/mail delivery was tested.';
end $$;
rollback;
