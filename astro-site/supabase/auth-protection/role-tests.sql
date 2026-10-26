-- Role & Permission Assertions for Auth Sending Protection — Fabio Egypt
-- Tests role switching between anon, authenticated, service_role, and supabase_auth_admin.
-- All assertions run inside an explicit transaction that ALWAYS terminates in ROLLBACK.
-- DO NOT RUN WITHOUT SEPARATE AUTHORIZATION.

begin;

-- Pre-flight sanity checks
do $$ begin
  if to_regclass('public.disposable_email_domains') is null
     or to_regclass('public.auth_email_rate_limits') is null
     or to_regclass('public.auth_global_rate_limits') is null then
    raise exception 'Required auth protection tables not found. Apply schema.sql first.';
  end if;
end $$;

-- =========================================================================
-- Phase 1: Test Anonymous Role (anon) — Zero Access
-- =========================================================================
set local role anon;

do $$
begin
  -- 1A: Table reads denied for anon
  begin
    perform 1 from public.disposable_email_domains limit 1;
    raise exception 'VULNERABILITY: anon can read public.disposable_email_domains';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.auth_email_rate_limits limit 1;
    raise exception 'VULNERABILITY: anon can read public.auth_email_rate_limits';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.auth_global_rate_limits limit 1;
    raise exception 'VULNERABILITY: anon can read public.auth_global_rate_limits';
  exception when insufficient_privilege then null;
  end;

  -- 1B: Table writes denied for anon
  begin
    insert into public.disposable_email_domains(domain) values ('leak.test');
    raise exception 'VULNERABILITY: anon can insert into public.disposable_email_domains';
  exception when insufficient_privilege then null;
  end;

  -- 1C: Function executions denied for anon
  begin
    perform public.validate_auth_email_domain('test@example.com');
    raise exception 'VULNERABILITY: anon can execute validate_auth_email_domain';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.check_and_consume_auth_rate_limit('test@example.com');
    raise exception 'VULNERABILITY: anon can execute check_and_consume_auth_rate_limit';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.hook_before_user_created('{"user":{"email":"test@example.com"}}'::jsonb);
    raise exception 'VULNERABILITY: anon can execute hook_before_user_created';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.hook_auth_send_email('{"user":{"email":"test@example.com"}}'::jsonb);
    raise exception 'VULNERABILITY: anon can execute hook_auth_send_email';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- =========================================================================
-- Phase 2: Test Authenticated Role (authenticated) — Zero Access
-- =========================================================================
set local role authenticated;

do $$
begin
  -- 2A: Table reads denied for authenticated
  begin
    perform 1 from public.disposable_email_domains limit 1;
    raise exception 'VULNERABILITY: authenticated can read public.disposable_email_domains';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.auth_email_rate_limits limit 1;
    raise exception 'VULNERABILITY: authenticated can read public.auth_email_rate_limits';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.auth_global_rate_limits limit 1;
    raise exception 'VULNERABILITY: authenticated can read public.auth_global_rate_limits';
  exception when insufficient_privilege then null;
  end;

  -- 2B: Function executions denied for authenticated
  begin
    perform public.validate_auth_email_domain('test@example.com');
    raise exception 'VULNERABILITY: authenticated can execute validate_auth_email_domain';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.check_and_consume_auth_rate_limit('test@example.com');
    raise exception 'VULNERABILITY: authenticated can execute check_and_consume_auth_rate_limit';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.hook_before_user_created('{"user":{"email":"test@example.com"}}'::jsonb);
    raise exception 'VULNERABILITY: authenticated can execute hook_before_user_created';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.hook_auth_send_email('{"user":{"email":"test@example.com"}}'::jsonb);
    raise exception 'VULNERABILITY: authenticated can execute hook_auth_send_email';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- =========================================================================
-- Phase 3: Test service_role / supabase_auth_admin — Full Protection Logic
-- =========================================================================
set local role service_role;

do $$
declare
  v_res text;
  v_rate jsonb;
  v_hook_res jsonb;
begin
  -- 3A: Domain Validation: Italian & Corporate Providers MUST be accepted
  if public.validate_auth_email_domain('mario.rossi@libero.it') <> 'ok' then
    raise exception 'Italian provider libero.it rejected!';
  end if;
  if public.validate_auth_email_domain('giovanni@virgilio.it') <> 'ok' then
    raise exception 'Italian provider virgilio.it rejected!';
  end if;
  if public.validate_auth_email_domain('elena@alice.it') <> 'ok' then
    raise exception 'Italian provider alice.it rejected!';
  end if;
  if public.validate_auth_email_domain('paolo@tim.it') <> 'ok' then
    raise exception 'Italian provider tim.it rejected!';
  end if;
  if public.validate_auth_email_domain('francesca@poste.it') <> 'ok' then
    raise exception 'Italian provider poste.it rejected!';
  end if;
  if public.validate_auth_email_domain('marco@fastwebnet.it') <> 'ok' then
    raise exception 'Italian provider fastwebnet.it rejected!';
  end if;
  if public.validate_auth_email_domain('chiara@tiscali.it') <> 'ok' then
    raise exception 'Italian provider tiscali.it rejected!';
  end if;
  if public.validate_auth_email_domain('info@fabioegypt.com') <> 'ok' then
    raise exception 'Private brand domain fabioegypt.com rejected!';
  end if;
  if public.validate_auth_email_domain('partner@corporate-agency.de') <> 'ok' then
    raise exception 'Corporate private domain corporate-agency.de rejected!';
  end if;

  -- 3B: Domain Validation: Disposable Domains MUST be rejected
  if public.validate_auth_email_domain('test@mailinator.com') <> 'disposable-domain' then
    raise exception 'Disposable domain mailinator.com not rejected!';
  end if;
  if public.validate_auth_email_domain('user@tempmail.com') <> 'disposable-domain' then
    raise exception 'Disposable domain tempmail.com not rejected!';
  end if;
  if public.validate_auth_email_domain('bot@sub.guerrillamail.com') <> 'disposable-domain' then
    raise exception 'Disposable subdomain sub.guerrillamail.com not rejected!';
  end if;

  -- 3C: Domain Validation: Malformed Addresses MUST be rejected
  if public.validate_auth_email_domain('invalid-email') <> 'invalid-format' then
    raise exception 'Missing @ not rejected as invalid-format!';
  end if;
  if public.validate_auth_email_domain('user with spaces@domain.com') <> 'invalid-format' then
    raise exception 'Spaces not rejected as invalid-format!';
  end if;
  if public.validate_auth_email_domain('@nodomain.com') <> 'invalid-format' then
    raise exception 'Empty local-part not rejected as invalid-format!';
  end if;
  if public.validate_auth_email_domain('user@domain-without-tld') <> 'invalid-format' then
    raise exception 'Domain without dot not rejected as invalid-format!';
  end if;

  -- 3D: Rate Limiting: Per-Email Cooldown
  -- First request: allowed
  v_rate := public.check_and_consume_auth_rate_limit('qa-user-1@fabioegypt.test', 10, 3, 60);
  if (v_rate->>'allowed')::boolean is not true then
    raise exception 'First request unexpectedly rejected by rate limiter: %', v_rate;
  end if;

  -- Immediate second request: rejected with cooldown_active
  v_rate := public.check_and_consume_auth_rate_limit('qa-user-1@fabioegypt.test', 10, 3, 60);
  if (v_rate->>'allowed')::boolean is true or v_rate->>'reason' <> 'cooldown_active' then
    raise exception 'Immediate repeat request was not rejected with cooldown_active: %', v_rate;
  end if;
  if (v_rate->>'retry_after_seconds')::int < 1 then
    raise exception 'Invalid retry_after_seconds in cooldown response: %', v_rate;
  end if;

  -- 3E: Rate Limiting: Global Capacity Cap
  -- Consume remaining global allowance up to test cap of 3
  v_rate := public.check_and_consume_auth_rate_limit('qa-user-2@fabioegypt.test', 3, 5, 0);
  if (v_rate->>'allowed')::boolean is not true then
    raise exception 'Global request 2 unexpectedly rejected: %', v_rate;
  end if;

  v_rate := public.check_and_consume_auth_rate_limit('qa-user-3@fabioegypt.test', 3, 5, 0);
  if (v_rate->>'allowed')::boolean is not true then
    raise exception 'Global request 3 unexpectedly rejected: %', v_rate;
  end if;

  -- Global cap is 3; 4th request from a completely new email MUST be rejected with global_limit_exceeded
  v_rate := public.check_and_consume_auth_rate_limit('qa-user-4@fabioegypt.test', 3, 5, 0);
  if (v_rate->>'allowed')::boolean is true or v_rate->>'reason' <> 'global_limit_exceeded' then
    raise exception 'Request exceeding global limit was not rejected with global_limit_exceeded: %', v_rate;
  end if;

  -- 3F: Hook before_user_created verification
  -- Legitimate email -> returns {}
  v_hook_res := public.hook_before_user_created('{"user":{"email":"legit.customer@libero.it"}}'::jsonb);
  if v_hook_res <> '{}'::jsonb then
    raise exception 'hook_before_user_created rejected legitimate Italian email: %', v_hook_res;
  end if;

  -- Disposable email -> returns error with http_code 403
  v_hook_res := public.hook_before_user_created('{"user":{"email":"abuser@mailinator.com"}}'::jsonb);
  if v_hook_res->'error'->>'http_code' <> '403' then
    raise exception 'hook_before_user_created did not return 403 for disposable email: %', v_hook_res;
  end if;

  -- Invalid syntax email -> returns error with http_code 400
  v_hook_res := public.hook_before_user_created('{"user":{"email":"bad-email"}}'::jsonb);
  if v_hook_res->'error'->>'http_code' <> '400' then
    raise exception 'hook_before_user_created did not return 400 for bad email: %', v_hook_res;
  end if;
end $$;

reset role;

-- Always ROLLBACK so that no test data or state is retained
rollback;
