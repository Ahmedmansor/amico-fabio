-- Metadata only after separately authorized execution; no customer rows.
select tablename,rowsecurity from pg_tables where schemaname='public'
  and tablename in ('wishlist_email_preferences','wishlist_email_consent_events');
select table_name,grantee,privilege_type from information_schema.role_table_grants
  where table_schema='public' and table_name in ('wishlist_email_preferences','wishlist_email_consent_events')
    and grantee in ('PUBLIC','anon','authenticated','service_role');
select p.proname,p.prosecdef,p.proconfig,pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='change_wishlist_email_preference';
