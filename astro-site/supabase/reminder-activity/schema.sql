-- LOCAL REVIEW PROPOSAL ONLY. NOT EXECUTED. No queue, sender or Cron activation.
-- Private trigger-backed history affects real favorite writes: review/approve separately.
-- Retained source proposal, not a fabricated Supabase CLI migration-history file.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
-- Maintenance lock order prevents an Auth cascade racing the initial FK backfill.
-- Auth/favorite/consent writes may briefly wait; SELECT and catalog reads continue.
lock table auth.users,public.wishlists,public.package_wishlists,public.wishlist_email_preferences
  in share row exclusive mode;
do $$ begin
  if exists(select 1 from public.wishlist_email_preferences where enabled) then
    raise exception 'Active consent exists: review historical last-addition backfill before proceeding.';
  end if;
  if exists(select 1 from public.wishlists where added_at>pg_catalog.clock_timestamp())
    or exists(select 1 from public.package_wishlists where added_at>pg_catalog.clock_timestamp()) then
    raise exception 'Future favorite timestamps: review trusted history before proceeding.';
  end if;
end $$;

create schema wishlist_reminder_internal;
revoke all on schema wishlist_reminder_internal from public,anon,authenticated,service_role;
grant usage on schema wishlist_reminder_internal to service_role;
create table wishlist_reminder_internal.activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_count bigint not null check (favorite_count between 0 and 9007199254740991),
  last_addition_at timestamptz,
  revision bigint not null default 0 check (revision between 0 and 9007199254740991),
  check ((favorite_count=0 and last_addition_at is null)
    or (favorite_count>0 and last_addition_at is not null))
);
alter table wishlist_reminder_internal.activity enable row level security;
revoke all on wishlist_reminder_internal.activity from public,anon,authenticated,service_role;
grant select(user_id,favorite_count,last_addition_at,revision) on wishlist_reminder_internal.activity to service_role;
create index reminder_activity_nonempty_idx on wishlist_reminder_internal.activity(last_addition_at,user_id)
  where favorite_count>0;

-- No active consent is permitted above. Future opt-in time dominates all old
-- additions, so surviving-row baseline cannot rewind an already running timer.
-- This is NOT a general reconstruction of previously removed historical items.
insert into wishlist_reminder_internal.activity(user_id,favorite_count,last_addition_at,revision)
  select f.user_id,pg_catalog.count(*),pg_catalog.max(f.added_at),0
  from (
    select user_id,added_at from public.wishlists
    union all select user_id,added_at from public.package_wishlists
  ) f group by f.user_id;

create function wishlist_reminder_internal.capture_favorite_activity()
returns trigger language plpgsql volatile security definer set search_path=''
as $$
declare owner_id uuid; server_time timestamptz;
begin
  if tg_table_schema<>'public' or tg_table_name not in ('wishlists','package_wishlists')
    or tg_op not in ('INSERT','DELETE') or tg_level<>'ROW' or tg_nargs<>0 then
    raise exception 'Unexpected activity trigger context.' using errcode='22023';
  end if;
  owner_id=case when tg_op='INSERT' then new.user_id else old.user_id end;
  if owner_id is null then raise exception 'Missing activity owner.' using errcode='22023'; end if;
  -- Auth cascades must not recreate a deleted user's private state.
  if not exists(select 1 from auth.users u where u.id=owner_id) then return null; end if;
  -- Same key/order as locale and consent RPCs. VOLATILE queries obtain fresh
  -- snapshots after waiting; caller timestamps/user_metadata never participate.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text,0));
  server_time=pg_catalog.clock_timestamp();
  if tg_op='INSERT' then
    insert into wishlist_reminder_internal.activity as target(user_id,favorite_count,last_addition_at,revision)
      values(owner_id,1,server_time,1)
      on conflict(user_id) do update set favorite_count=target.favorite_count+1,
        last_addition_at=greatest(target.last_addition_at,excluded.last_addition_at),revision=target.revision+1;
  else
    update wishlist_reminder_internal.activity a set favorite_count=a.favorite_count-1,
      last_addition_at=case when a.favorite_count=1 then null else a.last_addition_at end,revision=a.revision+1
      where a.user_id=owner_id;
    if not found then
      raise exception 'Missing activity baseline; favorite change rolled back for review.';
    end if;
  end if;
  return null; -- AFTER trigger return value does not change the source row.
end;
$$;
-- Definer is required only to maintain a private table that browsers cannot
-- write. Ownership is checked by the original source table's caller RLS first.
-- No public definer RPC and no caller-controlled table/schema/SQL are introduced.
revoke execute on function wishlist_reminder_internal.capture_favorite_activity()
  from public,anon,authenticated,service_role;
create trigger wishlist_reminder_activity after insert or delete on public.wishlists
  for each row execute function wishlist_reminder_internal.capture_favorite_activity();
create trigger package_wishlist_reminder_activity after insert or delete on public.package_wishlists
  for each row execute function wishlist_reminder_internal.capture_favorite_activity();

create function public.read_wishlist_reminder_activity(p_user_id uuid)
returns table(favorite_count bigint,last_addition_at timestamptz,revision bigint)
language plpgsql security invoker set search_path=''
as $$ begin
  if p_user_id is null then raise exception 'Account required.' using errcode='22023'; end if;
  return query select a.favorite_count,a.last_addition_at,a.revision
    from wishlist_reminder_internal.activity a where a.user_id=p_user_id;
end $$;
revoke execute on function public.read_wishlist_reminder_activity(uuid) from public,anon,authenticated;
grant execute on function public.read_wishlist_reminder_activity(uuid) to service_role;
commit;
