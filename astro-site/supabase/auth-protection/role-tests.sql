-- Auth Protection Role Assertions — Fabio Egypt
-- Tests the backend Send Email Hook, disposable domain blocking, and rate limiting.
-- Runs inside a transaction and ALWAYS rolls back. Leaves zero permanent records.

begin;

-- 1. Test validation function
do $$
begin
  assert public.validate_auth_email_domain('mario@libero.it') = 'ok', 'Failed: libero.it should be ok';
  assert public.validate_auth_email_domain('mario@virgilio.it') = 'ok', 'Failed: virgilio.it should be ok';
  assert public.validate_auth_email_domain('guide@fabioegypt.com') = 'ok', 'Failed: corporate domain should be ok';
  assert public.validate_auth_email_domain('test@mailinator.com') = 'disposable-domain', 'Failed: mailinator.com must be disposable-domain';
  assert public.validate_auth_email_domain('bad..email@test.com') = 'invalid-format', 'Failed: invalid format must be rejected';
  assert public.validate_auth_email_domain('') = 'invalid-format', 'Failed: empty email must be rejected';
end $$;

-- 2. Test hook_auth_send_email for legitimate address (success: returns {})
do $$
declare
  v_payload jsonb;
  v_res jsonb;
begin
  v_payload := jsonb_build_object(
    'user', jsonb_build_object('email', 'test_user_legit@libero.it'),
    'email_data', jsonb_build_object('email_action_type', 'magiclink', 'token_hash', 'abc123hash')
  );

  v_res := public.hook_auth_send_email(v_payload);
  assert v_res = '{}'::jsonb, 'Failed: legitimate Italian provider should return {}';
end $$;

-- 3. Test hook_auth_send_email for disposable domain (blocked: returns 403 error)
do $$
declare
  v_payload jsonb;
  v_res jsonb;
begin
  v_payload := jsonb_build_object(
    'user', jsonb_build_object('email', 'abuser@10minutemail.com'),
    'email_data', jsonb_build_object('email_action_type', 'magiclink', 'token_hash', 'abc123hash')
  );

  v_res := public.hook_auth_send_email(v_payload);
  assert (v_res->'error'->>'http_code')::int = 403, 'Failed: disposable domain must return HTTP 403';
end $$;

-- 4. Test hook_auth_send_email cooldown rate limiting (blocked: returns 429 error on rapid repeat)
do $$
declare
  v_payload jsonb;
  v_res1 jsonb;
  v_res2 jsonb;
begin
  v_payload := jsonb_build_object(
    'user', jsonb_build_object('email', 'rapid_caller@outlook.it'),
    'email_data', jsonb_build_object('email_action_type', 'magiclink', 'token_hash', 'hash1')
  );

  -- First request succeeds
  v_res1 := public.hook_auth_send_email(v_payload);
  assert v_res1 = '{}'::jsonb, 'Failed: first request should succeed';

  -- Immediate second request to same email must be rate limited
  v_res2 := public.hook_auth_send_email(v_payload);
  assert (v_res2->'error'->>'http_code')::int = 429, 'Failed: second immediate request must return HTTP 429 cooldown';
end $$;

-- 5. Test hook_before_user_created early signup check
do $$
declare
  v_payload_ok jsonb;
  v_payload_disposable jsonb;
  v_res_ok jsonb;
  v_res_disposable jsonb;
begin
  v_payload_ok := jsonb_build_object('user', jsonb_build_object('email', 'newuser@virgilio.it'));
  v_res_ok := public.hook_before_user_created(v_payload_ok);
  assert v_res_ok = '{}'::jsonb, 'Failed: hook_before_user_created should allow legitimate user';

  v_payload_disposable := jsonb_build_object('user', jsonb_build_object('email', 'bot@yopmail.com'));
  v_res_disposable := public.hook_before_user_created(v_payload_disposable);
  assert (v_res_disposable->'error'->>'http_code')::int = 403, 'Failed: hook_before_user_created must reject disposable email with 403';
end $$;

-- Always rollback to leave database completely unchanged
rollback;
