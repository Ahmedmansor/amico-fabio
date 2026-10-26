-- Proposed Account Onboarding Schema
-- Local review artifact for Step 1 of Section 4.2.
-- DO NOT RUN REMOTELY WITHOUT SEPARATE AUTHORIZATION.

begin;

create table if not exists public.account_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rollout_version text not null default 'welcome-v1' check (length(rollout_version) > 0),
  is_eligible boolean not null default true,
  eligible_at timestamptz not null default now(),
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((completed_at is null) or (skipped_at is null))
);

-- Grandfather existing accounts created before this rollout boundary as ineligible
insert into public.account_onboarding (user_id, rollout_version, is_eligible, eligible_at, completed_at, skipped_at)
select id, 'welcome-v1', false, now(), null, now()
from auth.users
on conflict (user_id) do nothing;

-- Automatically create onboarding record for newly registered accounts
create or replace function public.handle_new_user_onboarding()
returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  insert into public.account_onboarding (user_id, rollout_version, is_eligible, eligible_at)
  values (new.id, 'welcome-v1', true, now())
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_onboarding on auth.users;
create trigger on_auth_user_created_onboarding
  after insert on auth.users
  for each row execute function public.handle_new_user_onboarding();

-- Enable Row Level Security
alter table public.account_onboarding enable row level security;

-- Revoke all table-level access from clients; access is mediated through RPC and least-privilege policies
revoke all on public.account_onboarding from public, anon, authenticated;
grant select on public.account_onboarding to authenticated;

-- Owner-only SELECT policy
create policy account_onboarding_owner_select on public.account_onboarding
  for select to authenticated using ((select auth.uid()) = user_id);

-- Read onboarding state RPC
create or replace function public.read_account_onboarding(p_user_id uuid)
returns table(
  user_id uuid,
  rollout_version text,
  is_eligible boolean,
  eligible_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz
)
language plpgsql security invoker set search_path=''
as $$
begin
  if p_user_id is null or (select auth.uid()) is distinct from p_user_id then
    return;
  end if;

  return query
  select o.user_id, o.rollout_version, o.is_eligible, o.eligible_at, o.completed_at, o.skipped_at
  from public.account_onboarding o
  where o.user_id = p_user_id;
end;
$$;

-- Record onboarding decision (complete or skip) RPC
create or replace function public.record_onboarding_decision(
  p_user_id uuid,
  p_decision text,
  p_version text
)
returns table(
  outcome text,
  completed_at timestamptz,
  skipped_at timestamptz
)
language plpgsql security invoker set search_path=''
as $$
declare
  current_record public.account_onboarding%rowtype;
begin
  if p_user_id is null or (select auth.uid()) is distinct from p_user_id
    or p_decision is null or p_decision not in ('complete', 'skip')
    or p_version is null or length(p_version) = 0 then
    return query select 'invalid-input'::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  -- Transaction advisory lock per account
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  select * into current_record
  from public.account_onboarding o
  where o.user_id = p_user_id;

  if not found then
    return query select 'missing-record'::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  if current_record.rollout_version is distinct from p_version then
    return query select 'version-mismatch'::text, current_record.completed_at, current_record.skipped_at;
    return;
  end if;

  if not current_record.is_eligible then
    return query select 'ineligible'::text, current_record.completed_at, current_record.skipped_at;
    return;
  end if;

  -- Idempotency: if already completed or skipped, return current state without error
  if current_record.completed_at is not null or current_record.skipped_at is not null then
    return query select 'already-resolved'::text, current_record.completed_at, current_record.skipped_at;
    return;
  end if;

  if p_decision = 'complete' then
    update public.account_onboarding
    set completed_at = now(), skipped_at = null, updated_at = now()
    where public.account_onboarding.user_id = p_user_id
    returning public.account_onboarding.completed_at, public.account_onboarding.skipped_at
    into current_record.completed_at, current_record.skipped_at;
  else
    update public.account_onboarding
    set completed_at = null, skipped_at = now(), updated_at = now()
    where public.account_onboarding.user_id = p_user_id
    returning public.account_onboarding.completed_at, public.account_onboarding.skipped_at
    into current_record.completed_at, current_record.skipped_at;
  end if;

  return query select 'applied'::text, current_record.completed_at, current_record.skipped_at;
end;
$$;

-- Revoke default execute and grant only to authenticated and service_role
revoke execute on function public.read_account_onboarding(uuid) from public, anon, authenticated;
grant execute on function public.read_account_onboarding(uuid) to authenticated, service_role;

revoke execute on function public.record_onboarding_decision(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_onboarding_decision(uuid, text, text) to authenticated, service_role;

commit;
