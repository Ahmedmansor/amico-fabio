-- Applied 2026-10-24 to fabioEgypt (iiivnvwspoikfrlclhyr) after user authorization.
-- Retained as the reviewed source artifact; DO NOT RERUN on the existing schema.
-- Apply once, transactionally; fail on existing objects rather than overwrite.
begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Snapshot of src/shared/config/languages.ts at preparation time.
  locale text not null check (locale in ('it', 'en')),
  created_at timestamptz not null default now()
);

create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null references public.trips(id) on delete restrict,
  added_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);
-- The primary key covers ownership queries and user deletion. Index the other FK.
create index wishlists_trip_id_idx on public.wishlists (trip_id);

create table public.package_wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.packages(id) on delete restrict,
  added_at timestamptz not null default now(),
  primary key (user_id, package_id)
);
create index package_wishlists_package_id_idx on public.package_wishlists (package_id);

alter table public.profiles enable row level security;
alter table public.wishlists enable row level security;
alter table public.package_wishlists enable row level security;
revoke all privileges on table public.profiles, public.wishlists, public.package_wishlists
  from public, anon, authenticated;
grant usage on schema public to authenticated;

grant select on table public.profiles, public.wishlists, public.package_wishlists to authenticated;
grant insert (user_id, locale), update (locale) on public.profiles to authenticated;
grant insert (user_id, trip_id), delete on public.wishlists to authenticated;
grant insert (user_id, package_id), delete on public.package_wishlists to authenticated;
-- No client writes to timestamps, no wishlist UPDATE, no profile DELETE.

create policy profiles_owner_select on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_owner_insert on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Needed by the wishlist INSERT policy's published-tour lookup. Preserve all
-- existing anon catalog grants/policies. No authenticated full catalog access.
grant select (id, is_active) on public.trips to authenticated;
create policy trips_published_identity_select on public.trips
  for select to authenticated using (is_active);

create policy wishlists_owner_select on public.wishlists
  for select to authenticated using ((select auth.uid()) = user_id);
create policy wishlists_owner_insert on public.wishlists
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.trips t where t.id = wishlists.trip_id and t.is_active
    )
  );
create policy wishlists_owner_delete on public.wishlists
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select (id, is_active) on public.packages to authenticated;
create policy packages_published_identity_select on public.packages
  for select to authenticated using (is_active);
create policy package_wishlists_owner_select on public.package_wishlists
  for select to authenticated using ((select auth.uid()) = user_id);
create policy package_wishlists_owner_insert on public.package_wishlists
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.packages p where p.id = package_wishlists.package_id and p.is_active
    )
  );
create policy package_wishlists_owner_delete on public.package_wishlists
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
