-- Read-only verification for the user after importing the reviewed CSVs.
begin read only;

-- Owner totals: expected trips 27 (22 active), packages 14, relations 20,
-- addons 3, public settings 1 for the reviewed snapshot.
select 'trips' as catalog_table, count(*) as total, count(*) filter(where is_active) as published from public.trips
union all select 'packages',count(*),count(*) filter(where is_active) from public.packages
union all select 'package_trips',count(*),count(*) from public.package_trips
union all select 'trip_addons',count(*),count(*) filter(where is_active) from public.trip_addons
union all select 'public_settings',count(*),count(*) filter(where is_active) from public.public_settings;

-- Every table must have RLS on; anon SELECT true; all anon writes false.
-- Authenticated has no table privileges in this Auth-free phase.
select c.relname, c.relrowsecurity,
  has_table_privilege('anon',c.oid,'SELECT') as anon_select,
  has_table_privilege('anon',c.oid,'INSERT') as anon_insert,
  has_table_privilege('anon',c.oid,'UPDATE') as anon_update,
  has_table_privilege('anon',c.oid,'DELETE') as anon_delete,
  has_table_privilege('anon',c.oid,'TRUNCATE') as anon_truncate,
  has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_select
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('trips','packages','package_trips','trip_addons','public_settings')
order by c.relname;

select tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename in ('trips','packages','package_trips','trip_addons','public_settings')
order by tablename,policyname;

set local role anon;
-- Public totals: 22, 14, 20, 3, 1 respectively.
select 'trips' as catalog_table,count(*) as visible from public.trips
union all select 'packages',count(*) from public.packages
union all select 'package_trips',count(*) from public.package_trips
union all select 'trip_addons',count(*) from public.trip_addons
union all select 'public_settings',count(*) from public.public_settings;

-- All three counts must be zero. These are reads, not attempted mutations.
select (select count(*) from public.trips where not is_active) as leaked_inactive_trips,
  (select count(*) from public.packages where not is_active) as leaked_inactive_packages,
  (select count(*) from public.public_settings where key<>'promo_banner') as leaked_settings;

rollback;
