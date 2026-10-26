-- Auth Sending Path Protection Schema — Fabio Egypt
-- Step 2: Protection against disposable domains, malformed input, and abuse on the real Auth sending path.
-- Local review artifact. DO NOT RUN REMOTELY WITHOUT SEPARATE AUTHORIZATION.

begin;

-- 1. Maintainable catalog of known temporary / disposable email domains
create table if not exists public.disposable_email_domains (
  domain text primary key,
  reason text default 'Known disposable email provider',
  created_at timestamptz not null default now()
);

-- Seed initial known disposable domains
insert into public.disposable_email_domains (domain, reason) values
  ('mailinator.com', 'Disposable email service'),
  ('guerrillamail.com', 'Disposable email service'),
  ('guerrillamail.net', 'Disposable email service'),
  ('guerrillamail.org', 'Disposable email service'),
  ('guerrillamailblock.com', 'Disposable email service'),
  ('sharklasers.com', 'GuerrillaMail domain'),
  ('grr.la', 'GuerrillaMail domain'),
  ('spam4.me', 'GuerrillaMail domain'),
  ('tempmail.com', 'Temporary email service'),
  ('temp-mail.org', 'Temporary email service'),
  ('tempmail.net', 'Temporary email service'),
  ('tempail.com', 'Temporary email service'),
  ('tempmailaddress.com', 'Temporary email service'),
  ('10minutemail.com', '10 Minute Mail'),
  ('10minutemail.net', '10 Minute Mail'),
  ('throwawaymail.com', 'Throwaway Mail'),
  ('yopmail.com', 'YOPmail service'),
  ('yopmail.fr', 'YOPmail service'),
  ('yopmail.net', 'YOPmail service'),
  ('trashmail.com', 'TrashMail service'),
  ('trashmail.net', 'TrashMail service'),
  ('trashmail.org', 'TrashMail service'),
  ('dispostable.com', 'Dispostable service'),
  ('getairmail.com', 'AirMail disposable service'),
  ('nada.ltd', 'Nada disposable service'),
  ('mohmal.com', 'Mohmal temporary mail'),
  ('crazymailing.com', 'CrazyMailing service'),
  ('fakemailgenerator.com', 'Fake Mail Generator'),
  ('maildrop.cc', 'Maildrop disposable service'),
  ('inboxkitten.com', 'InboxKitten service'),
  ('burnermail.io', 'Burner Mail service'),
  ('emailondeck.com', 'EmailOnDeck disposable service'),
  ('disposablemail.com', 'Disposable Mail service'),
  ('generator.email', 'Generator Email service'),
  ('mytemp.email', 'MyTemp Email'),
  ('dropmail.me', 'DropMail service'),
  ('getnada.com', 'GetNada service'),
  ('temp-mail.io', 'TempMail IO service'),
  ('minuteinbox.com', 'MinuteInbox service'),
  ('tmailor.com', 'TMailor service')
on conflict (domain) do nothing;

-- 2. Email rate limiting table on the actual Auth sending path (per-email hash)
-- Prevents repeated resends to the same address
create table if not exists public.auth_email_rate_limits (
  email_hash text primary key,
  last_sent_at timestamptz not null default now(),
  send_count int not null default 1,
  window_start timestamptz not null default now(),
  check (send_count >= 1)
);

-- 3. Global rate limiting table for Auth emails
-- Protects the shared daily Brevo allowance (300 emails/day) against distributed attacks
-- rotating through different email addresses to exhaust the daily sending quota
create table if not exists public.auth_global_rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  send_count int not null default 1,
  max_per_window int not null default 30
);

-- Enable Row Level Security on all protection tables
alter table public.disposable_email_domains enable row level security;
alter table public.auth_email_rate_limits enable row level security;
alter table public.auth_global_rate_limits enable row level security;

-- Revoke all table-level access from client/browser roles
revoke all on public.disposable_email_domains from public, anon, authenticated;
revoke all on public.auth_email_rate_limits from public, anon, authenticated;
revoke all on public.auth_global_rate_limits from public, anon, authenticated;

-- Allow only supabase_auth_admin and service_role to access these tables
grant all on public.disposable_email_domains to supabase_auth_admin, service_role;
grant all on public.auth_email_rate_limits to supabase_auth_admin, service_role;
grant all on public.auth_global_rate_limits to supabase_auth_admin, service_role;

-- 4. Pure domain verification helper function
create or replace function public.validate_auth_email_domain(p_email text)
returns text
language plpgsql immutable security definer set search_path=''
as $$
declare
  v_trimmed text;
  v_at_pos int;
  v_local text;
  v_domain text;
  v_is_disposable boolean;
begin
  if p_email is null then
    return 'invalid-format';
  end if;

  v_trimmed := trim(p_email);
  if length(v_trimmed) = 0 or length(v_trimmed) > 254 or v_trimmed ~ '\s' then
    return 'invalid-format';
  end if;

  v_at_pos := position('@' in v_trimmed);
  if v_at_pos < 2 or position('@' in substring(v_trimmed from v_at_pos + 1)) > 0 then
    return 'invalid-format';
  end if;

  v_local := substring(v_trimmed from 1 for v_at_pos - 1);
  v_domain := lower(substring(v_trimmed from v_at_pos + 1));

  if length(v_local) > 64 or v_local ~ '[<>()[\]\\,;:"]'
     or v_local like '.%' or v_local like '%.' or v_local like '%..%' then
    return 'invalid-format';
  end if;

  if length(v_domain) < 3 or length(v_domain) > 253 or position('.' in v_domain) = 0
     or v_domain ~ '[/:?#\\%]' then
    return 'invalid-format';
  end if;

  -- Check direct domain or parent domain match in disposable catalog
  select exists (
    select 1
    from public.disposable_email_domains d
    where v_domain = d.domain
       or v_domain like '%.' || d.domain
  ) into v_is_disposable;

  if v_is_disposable then
    return 'disposable-domain';
  end if;

  return 'ok';
end;
$$;

-- 5. Atomic check and consume rate limiting function (Global + Per-Email)
-- Uses extensions.digest for secure anonymized hashing under search_path=''
create or replace function public.check_and_consume_auth_rate_limit(
  p_email text,
  p_max_global int default 30,
  p_max_per_email int default 5,
  p_cooldown_seconds int default 60
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_email_hash text;
  v_now timestamptz := now();
  v_global_rec record;
  v_rate_rec record;
  v_retry_after int;
begin
  if p_email is null or trim(p_email) = '' then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_email');
  end if;

  -- Anonymized hash of recipient email
  v_email_hash := encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex');

  -- Step 5A: Global rate limit check (protects overall daily Brevo quota)
  select * into v_global_rec
  from public.auth_global_rate_limits
  where bucket = 'auth_email_global'
  for update;

  if found then
    if (v_now - v_global_rec.window_start) > interval '1 hour' then
      update public.auth_global_rate_limits
      set window_start = v_now, send_count = 1, max_per_window = p_max_global
      where bucket = 'auth_email_global';
    else
      if v_global_rec.send_count >= p_max_global then
        v_retry_after := greatest(1, extract(epoch from (v_global_rec.window_start + interval '1 hour' - v_now))::int);
        return jsonb_build_object(
          'allowed', false,
          'reason', 'global_limit_exceeded',
          'retry_after_seconds', v_retry_after
        );
      end if;
      update public.auth_global_rate_limits
      set send_count = send_count + 1
      where bucket = 'auth_email_global';
    end if;
  else
    insert into public.auth_global_rate_limits (bucket, window_start, send_count, max_per_window)
    values ('auth_email_global', v_now, 1, p_max_global);
  end if;

  -- Step 5B: Per-email rate limit check (cooldown + hourly cap)
  select * into v_rate_rec
  from public.auth_email_rate_limits
  where email_hash = v_email_hash
  for update;

  if found then
    -- Check minimum cooldown
    if (v_now - v_rate_rec.last_sent_at) < (p_cooldown_seconds || ' seconds')::interval then
      v_retry_after := greatest(1, extract(epoch from (v_rate_rec.last_sent_at + (p_cooldown_seconds || ' seconds')::interval - v_now))::int);
      return jsonb_build_object(
        'allowed', false,
        'reason', 'cooldown_active',
        'retry_after_seconds', v_retry_after
      );
    end if;

    -- Check per-email 1-hour window
    if (v_now - v_rate_rec.window_start) > interval '1 hour' then
      update public.auth_email_rate_limits
      set window_start = v_now, send_count = 1, last_sent_at = v_now
      where email_hash = v_email_hash;
    else
      if v_rate_rec.send_count >= p_max_per_email then
        v_retry_after := greatest(1, extract(epoch from (v_rate_rec.window_start + interval '1 hour' - v_now))::int);
        return jsonb_build_object(
          'allowed', false,
          'reason', 'per_email_limit_exceeded',
          'retry_after_seconds', v_retry_after
        );
      end if;
      update public.auth_email_rate_limits
      set send_count = send_count + 1, last_sent_at = v_now
      where email_hash = v_email_hash;
    end if;
  else
    insert into public.auth_email_rate_limits (email_hash, last_sent_at, send_count, window_start)
    values (v_email_hash, v_now, 1, v_now);
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

-- 6. Before User Created Hook (PostgreSQL Function)
-- Fires before inserting a new user row into auth.users.
-- Note: Does NOT replace SMTP. Validates input and aborts registration for disposable/malformed emails.
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_email text;
  v_status text;
begin
  v_email := event->'user'->>'email';
  v_status := public.validate_auth_email_domain(v_email);

  if v_status = 'invalid-format' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Invalid email address format.',
        'http_code', 400
      )
    );
  elsif v_status = 'disposable-domain' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Temporary or disposable email domains are not allowed.',
        'http_code', 403
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- 7. Send Email Hook Guard & Validation Function
-- CRITICAL ARCHITECTURAL NOTICE:
-- In Supabase Auth, when a Send Email Hook is activated, Supabase DOES NOT use built-in SMTP.
-- The hook is responsible for dispatching the email.
-- Returning {} tells Supabase the email was sent; if no dispatch occurred, the user will NEVER receive their link!
-- For real dispatch via Brevo REST API with DNS MX verification and localized templates,
-- configure Send Email Hook as an HTTP Hook pointing to the 'auth-send-email' Edge Function.
create or replace function public.hook_auth_send_email(event jsonb)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_email text;
  v_status text;
  v_rate_res jsonb;
begin
  v_email := event->'user'->>'email';
  if v_email is null or length(v_email) = 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Missing recipient email address.',
        'http_code', 400
      )
    );
  end if;

  -- Validate syntax and disposable domain
  v_status := public.validate_auth_email_domain(v_email);
  if v_status = 'invalid-format' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Invalid email address format.',
        'http_code', 400
      )
    );
  elsif v_status = 'disposable-domain' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Temporary or disposable email domains are not allowed.',
        'http_code', 403
      )
    );
  end if;

  -- Atomic rate limits
  v_rate_res := public.check_and_consume_auth_rate_limit(v_email);
  if (v_rate_res->>'allowed')::boolean is not true then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Too many requests. Please wait before requesting another sign-in link.',
        'http_code', 429
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Grants: allow supabase_auth_admin and service_role to execute functions
grant execute on function public.validate_auth_email_domain(text) to supabase_auth_admin, service_role;
grant execute on function public.check_and_consume_auth_rate_limit(text, int, int, int) to supabase_auth_admin, service_role;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin, service_role;
grant execute on function public.hook_auth_send_email(jsonb) to supabase_auth_admin, service_role;

-- Revocations: strictly revoke execute from public, anon, and authenticated
revoke execute on function public.validate_auth_email_domain(text) from authenticated, anon, public;
revoke execute on function public.check_and_consume_auth_rate_limit(text, int, int, int) from authenticated, anon, public;
revoke execute on function public.hook_before_user_created(jsonb) from authenticated, anon, public;
revoke execute on function public.hook_auth_send_email(jsonb) from authenticated, anon, public;

commit;
