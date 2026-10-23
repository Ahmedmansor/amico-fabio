-- READ-ONLY metadata review after separately authorized execution.
-- No customer rows, account identifiers, emails or tokens are selected.
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('profiles', 'wishlists');

select tablename, policyname, roles, cmd, qual, with_check from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'wishlists', 'trips')
order by tablename, policyname;

select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('profiles', 'wishlists')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_name, grantee, privilege_type;

select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name in ('profiles', 'wishlists', 'trips')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_name, column_name, grantee, privilege_type;

select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'wishlists')
order by c.relname, con.conname;

select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('profiles', 'wishlists');
