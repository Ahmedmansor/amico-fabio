-- Disposable role assertions for account onboarding
-- Always executed inside a transaction ending with ROLLBACK.
-- DO NOT RUN WITHOUT SEPARATE AUTHORIZATION.

begin;

-- Create synthetic test users in auth.users
insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'user_a1@example.test'),
  ('00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'user_b1@example.test'),
  ('00000000-0000-4000-8000-0000000000c1', 'authenticated', 'authenticated', 'user_c1@example.test')
on conflict (id) do nothing;

-- 1. Setup grandfathered state for user C (A and B were created as eligible by the trigger)
update public.account_onboarding
set is_eligible = false, completed_at = null, skipped_at = now()
where user_id = '00000000-0000-4000-8000-0000000000c1';

-- 2. Test anon role: cannot execute RPCs or select
set local role anon;
do $$
begin
  begin
    perform * from public.read_account_onboarding('00000000-0000-4000-8000-0000000000a1');
    raise exception 'Anon should not be able to execute read_account_onboarding';
  exception when insufficient_privilege then
    -- Expected
  end;
end;
$$;

-- 3. Test user A authenticated context
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}';

-- Can read own record
do $$
declare
  rec record;
begin
  select * into rec from public.read_account_onboarding('00000000-0000-4000-8000-0000000000a1');
  if rec.user_id is distinct from '00000000-0000-4000-8000-0000000000a1' or rec.is_eligible is not true then
    raise exception 'User A should read own eligible onboarding record';
  end if;
end;
$$;

-- Cannot read user B record (returns 0 rows)
do $$
declare
  rec record;
begin
  select * into rec from public.read_account_onboarding('00000000-0000-4000-8000-0000000000b1');
  if rec.user_id is not null then
    raise exception 'User A must not read user B onboarding record';
  end if;
end;
$$;

-- Direct UPDATE is completely denied for authenticated (enforcing RPC mediation and server timestamps)
do $$
begin
  begin
    update public.account_onboarding set completed_at = now() where user_id = '00000000-0000-4000-8000-0000000000a1';
    raise exception 'Authenticated user must not update account_onboarding directly';
  exception when insufficient_privilege then
    -- Expected: direct table UPDATE is not granted
  end;
end;
$$;

-- Direct DELETE is completely denied for authenticated
do $$
begin
  begin
    delete from public.account_onboarding where user_id = '00000000-0000-4000-8000-0000000000a1';
    raise exception 'Authenticated user must not delete from account_onboarding directly';
  exception when insufficient_privilege then
    -- Expected: direct table DELETE is not granted
  end;
end;
$$;

-- Cannot record decision for user B via RPC
do $$
declare
  out_res record;
begin
  select * into out_res from public.record_onboarding_decision('00000000-0000-4000-8000-0000000000b1', 'complete', 'welcome-v1');
  if out_res.outcome is not null and out_res.outcome <> 'invalid-input' then
    raise exception 'User A must not record decision for user B';
  end if;
end;
$$;

-- User A completes onboarding
do $$
declare
  out_res record;
begin
  select * into out_res from public.record_onboarding_decision('00000000-0000-4000-8000-0000000000a1', 'complete', 'welcome-v1');
  if out_res.outcome <> 'applied' or out_res.completed_at is null then
    raise exception 'User A complete decision failed to apply';
  end if;
end;
$$;

-- Idempotent duplicate returns 'already-resolved'
do $$
declare
  out_res record;
begin
  select * into out_res from public.record_onboarding_decision('00000000-0000-4000-8000-0000000000a1', 'complete', 'welcome-v1');
  if out_res.outcome <> 'already-resolved' then
    raise exception 'User A duplicate complete should return already-resolved';
  end if;
end;
$$;

-- 4. Test user B authenticated context: skips onboarding
set local "request.jwt.claims" to '{"sub": "00000000-0000-4000-8000-0000000000b1", "role": "authenticated"}';

do $$
declare
  out_res record;
begin
  select * into out_res from public.record_onboarding_decision('00000000-0000-4000-8000-0000000000b1', 'skip', 'welcome-v1');
  if out_res.outcome <> 'applied' or out_res.skipped_at is null then
    raise exception 'User B skip decision failed to apply';
  end if;
end;
$$;

-- 5. Test user C (grandfathered legacy account): cannot complete onboarding
set local "request.jwt.claims" to '{"sub": "00000000-0000-4000-8000-0000000000c1", "role": "authenticated"}';

do $$
declare
  out_res record;
begin
  select * into out_res from public.record_onboarding_decision('00000000-0000-4000-8000-0000000000c1', 'complete', 'welcome-v1');
  if out_res.outcome <> 'ineligible' then
    raise exception 'Ineligible account must return outcome=ineligible';
  end if;
end;
$$;

-- 6. Test trigger on auth.users for newly registered account
-- Must reset role before writing to auth.users
reset role;

insert into auth.users (id, aud, role, email)
values ('00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', 'user_d1@example.test');

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated"}';

do $$
declare
  rec record;
begin
  select * into rec from public.read_account_onboarding('00000000-0000-4000-8000-0000000000d1');
  if rec.user_id is distinct from '00000000-0000-4000-8000-0000000000d1' or rec.is_eligible is not true then
    raise exception 'New user D1 should have automatic eligible onboarding record created by trigger';
  end if;
end;
$$;

reset role;
rollback;

