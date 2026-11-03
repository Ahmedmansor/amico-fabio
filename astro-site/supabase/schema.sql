-- User-reviewed SQL Editor script for fabioEgypt (iiivnvwspoikfrlclhyr).
-- Apply once to an empty public catalog; this is not a remote migration run.
-- Existing Sheets catalog only. No Auth, leads, privileged functions or views.
begin;

create table public.trips (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  slug text not null unique check (slug ~ '^[a-z0-9_-]+$'),
  adult_price numeric(12,2) not null check (adult_price >= 0 and adult_price <> 'NaN'::numeric),
  child_price numeric(12,2) not null check (child_price >= 0 and child_price <> 'NaN'::numeric),
  min_pax integer not null check (min_pax >= 1),
  location text not null check (location ~ '^[a-z0-9_-]+$'),
  category text not null check (category ~ '^[a-z0-9_-]+$'),
  featured boolean not null,
  badge_it text default '',
  badge_en text default '',
  is_active boolean not null,
  source_order integer not null unique check (source_order >= 0)
);

create table public.packages (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  slug text not null unique check (slug ~ '^[a-z0-9_-]+$'),
  adult_price numeric(12,2) not null check (adult_price >= 0 and adult_price <> 'NaN'::numeric),
  child_price numeric(12,2) not null check (child_price >= 0 and child_price <> 'NaN'::numeric),
  min_pax integer not null check (min_pax >= 1),
  location text not null check (location ~ '^[a-z0-9_-]+$'),
  category text not null check (category ~ '^[a-z0-9_-]+$'),
  badge_key text default '',
  is_active boolean not null,
  source_order integer not null unique check (source_order >= 0)
);

create table public.package_trips (
  package_id text not null references public.packages(id),
  trip_id text not null references public.trips(id),
  position integer not null check (position >= 0),
  primary key (package_id, trip_id),
  unique (package_id, position)
);
-- The PK indexes package_id; the opposite FK needs its own index.
create index package_trips_trip_id_idx on public.package_trips (trip_id);

create table public.trip_addons (
  trip_id text not null references public.trips(id),
  addon_id text not null check (length(btrim(addon_id)) > 0),
  label_it text not null check (length(btrim(label_it)) > 0),
  label_en text not null check (length(btrim(label_en)) > 0),
  price numeric(12,2) not null check (price >= 0 and price <> 'NaN'::numeric),
  is_active boolean not null,
  source_order integer not null unique check (source_order >= 0),
  primary key (trip_id, addon_id)
);

create table public.public_settings (
  key text primary key check (key in ('promo_banner')),
  val_it text not null check (length(btrim(val_it)) > 0),
  val_en text not null check (length(btrim(val_en)) > 0),
  is_active boolean not null,
  -- Preserve the exact legacy date text; banner activation remains is_active only.
  start_date text default '',
  end_date text default '',
  source_order integer not null unique check (source_order >= 0)
);

alter table public.trips enable row level security;
alter table public.packages enable row level security;
alter table public.package_trips enable row level security;
alter table public.trip_addons enable row level security;
alter table public.public_settings enable row level security;

-- Override any inherited Supabase default grants on these five tables only.
revoke all privileges on table public.trips, public.packages,
  public.package_trips, public.trip_addons, public.public_settings
  from public, anon, authenticated;
grant usage on schema public to anon;
grant select on table public.trips, public.packages,
  public.package_trips, public.trip_addons, public.public_settings to anon;

create policy trips_published_select on public.trips
  for select to anon using (is_active);
create policy packages_published_select on public.packages
  for select to anon using (is_active);
create policy package_trips_published_select on public.package_trips
  for select to anon using (
    exists (select 1 from public.packages p where p.id = package_trips.package_id and p.is_active)
    and exists (select 1 from public.trips t where t.id = package_trips.trip_id and t.is_active)
  );
create policy trip_addons_published_select on public.trip_addons
  for select to anon using (
    is_active and exists (select 1 from public.trips t where t.id = trip_addons.trip_id and t.is_active)
  );
create policy public_settings_published_select on public.public_settings
  for select to anon using (is_active and key in ('promo_banner'));

commit;
