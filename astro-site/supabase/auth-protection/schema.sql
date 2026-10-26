-- Auth Sending Path Protection Schema — Fabio Egypt
-- Step 2: Protection against disposable domains, malformed input, and abuse on the real Auth sending path.
-- Local review artifact. DO NOT RUN REMOTELY WITHOUT SEPARATE AUTHORIZATION.

begin;

-- Maintainable catalog of known temporary / disposable email domains
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

-- Email rate limiting table on the actual Auth sending path
-- Protects the shared daily Brevo allowance from rapid resends and bot abuse
create table if not exists public.auth_email_rate_limits (
  email_hash text primary key,
  last_sent_at timestamptz not null default now(),
  send_count int not null default 1,
  window_start timestamptz not null default now(),
  check (send_count >= 1)
);

-- Enable Row Level Security on both tables
alter table public.disposable_email_domains enable row level security;
alter table public.auth_email_rate_limits enable row level security;

-- Revoke all table-level access from clients; browser roles (anon, authenticated) have ZERO access.
revoke all on public.disposable_email_domains from public, anon, authenticated;
revoke all on public.auth_email_rate_limits from public, anon, authenticated;

-- Allow only supabase_auth_admin (the Supabase Auth daemon) to access these tables
grant all on public.disposable_email_domains to supabase_auth_admin;
grant all on public.auth_email_rate_limits to supabase_auth_admin;

-- Pure domain verification helper function
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

-- Send Email Auth Hook
-- Intercepts ALL outgoing Auth emails (signup, magiclink, recovery, email_change)
-- Runs for both new user registrations AND existing user login magic link requests!
create or replace function public.hook_auth_send_email(event jsonb)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_email text;
  v_email_hash text;
  v_status text;
  v_rate_record record;
  v_now timestamptz := now();
  v_cooldown_seconds int := 60;      -- Minimum interval between consecutive emails to same address
  v_max_per_window int := 5;         -- Max emails allowed per 1-hour window to same address
  v_window_interval interval := interval '1 hour';
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

  -- Validate syntax and check disposable domain
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

  -- Anonymized hash of recipient email for rate limiting (avoids storing cleartext email in limit log)
  v_email_hash := encode(digest(lower(trim(v_email)), 'sha256'), 'hex');

  -- Enforce rate limits & cooldown
  select * into v_rate_record
  from public.auth_email_rate_limits
  where email_hash = v_email_hash
  for update;

  if found then
    -- Check minimum cooldown between sends
    if (v_now - v_rate_record.last_sent_at) < (v_cooldown_seconds || ' seconds')::interval then
      return jsonb_build_object(
        'error', jsonb_build_object(
          'message', 'Too many requests. Please wait before requesting another sign-in link.',
          'http_code', 429
        )
      );
    end if;

    -- Check window sliding rate limit
    if (v_now - v_rate_record.window_start) > v_window_interval then
      -- New window
      update public.auth_email_rate_limits
      set last_sent_at = v_now,
          send_count = 1,
          window_start = v_now
      where email_hash = v_email_hash;
    else
      if v_rate_record.send_count >= v_max_per_window then
        return jsonb_build_object(
          'error', jsonb_build_object(
            'message', 'Hourly limit exceeded for this email address. Please try again later.',
            'http_code', 429
          )
        );
      end if;

      update public.auth_email_rate_limits
      set last_sent_at = v_now,
          send_count = v_rate_record.send_count + 1
      where email_hash = v_email_hash;
    end if;
  else
    insert into public.auth_email_rate_limits (email_hash, last_sent_at, send_count, window_start)
    values (v_email_hash, v_now, 1, v_now);
  end if;

  -- Allowed: return empty jsonb object indicating success
  return '{}'::jsonb;
end;
$$;

-- Before User Created Hook
-- Additional layer for early signup rejection before inserting into auth.users
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

-- Grant EXECUTE to supabase_auth_admin only
grant execute on function public.validate_auth_email_domain(text) to supabase_auth_admin;
grant execute on function public.hook_auth_send_email(jsonb) to supabase_auth_admin;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

-- Revoke EXECUTE from anon, authenticated, public
revoke execute on function public.validate_auth_email_domain(text) from authenticated, anon, public;
revoke execute on function public.hook_auth_send_email(jsonb) from authenticated, anon, public;
revoke execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

commit;
