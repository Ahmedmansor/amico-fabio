-- Local proposal only. Requires separate remote-write authorization and real role tests.
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


create table if not exists public.auth_email_rate_limits (
  email_hash text primary key, last_sent_at timestamptz not null,
  send_count int not null check(send_count >= 1), window_start timestamptz not null
);
create table if not exists public.auth_global_rate_limits (
  bucket text primary key, window_start timestamptz not null,
  send_count int not null check(send_count >= 1), max_per_window int not null
);
-- No recipient, token, URL, or message body retained in the delivery ledger.
create table if not exists public.auth_email_deliveries (
  delivery_key text primary key check(delivery_key ~ '^[a-f0-9]{64}$'),
  attempt_id uuid not null, state text not null check(state in ('sending','accepted','unknown','retryable','rejected')),
  updated_at timestamptz not null default now(), message_id text,
  check(message_id is null or length(message_id) between 1 and 512)
);
alter table public.disposable_email_domains enable row level security;
alter table public.auth_email_rate_limits enable row level security;
alter table public.auth_global_rate_limits enable row level security;
alter table public.auth_email_deliveries enable row level security;
revoke all on public.disposable_email_domains, public.auth_email_rate_limits,
  public.auth_global_rate_limits, public.auth_email_deliveries from public, anon, authenticated, supabase_auth_admin, service_role;
-- Writes go through the two definer RPCs only. Catalog maintenance is administrative.
create or replace function public.validate_auth_email_domain(p_email text)
returns text
language plpgsql stable security definer set search_path=''
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


create or replace function public.reserve_auth_email(
  p_email text, p_delivery_key text, p_max_hourly int, p_max_daily int,
  p_max_per_email int default 5, p_cooldown_seconds int default 60
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_email_hash text;
  v_delivery public.auth_email_deliveries%rowtype;
  v_rate public.auth_email_rate_limits%rowtype;
  v_hour public.auth_global_rate_limits%rowtype;
  v_day public.auth_global_rate_limits%rowtype;
  v_day_start timestamptz;
  v_attempt uuid := gen_random_uuid();
begin
  if p_delivery_key is null or p_delivery_key !~ '^[a-f0-9]{64}$'
    or p_max_hourly is null or p_max_hourly not between 1 and 300
    or p_max_daily is null or p_max_daily not between 1 and 300
    or p_max_per_email is null or p_max_per_email not between 1 and 20
    or p_cooldown_seconds is null or p_cooldown_seconds not between 60 and 3600 then
    return jsonb_build_object('outcome','blocked');
  end if;
  if public.validate_auth_email_domain(p_email) <> 'ok' then
    return jsonb_build_object('outcome','blocked');
  end if;
  -- One lock covers first insertion, all checks, quota updates, and ledger admission.
  -- finish_auth_email uses the same lock. No partial quota consumption on rejection.
  perform pg_advisory_xact_lock(72610, 1);
  v_now := clock_timestamp();
  v_day_start := date_trunc('day', v_now at time zone 'UTC') at time zone 'UTC';
  select * into v_delivery from public.auth_email_deliveries where delivery_key=p_delivery_key;
  if found then
    if v_delivery.state='accepted' then return jsonb_build_object('outcome','accepted'); end if;
    if v_delivery.state in ('sending','unknown') then return jsonb_build_object('outcome','uncertain'); end if;
    if v_delivery.state='rejected' or v_delivery.updated_at > v_now - interval '60 seconds' then
      return jsonb_build_object('outcome','blocked');
    end if;
  end if;
  v_email_hash := encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex');
  select * into v_rate from public.auth_email_rate_limits where email_hash=v_email_hash;
  select * into v_hour from public.auth_global_rate_limits where bucket='auth_hour';
  select * into v_day from public.auth_global_rate_limits where bucket='auth_day';
  if v_rate.last_sent_at > v_now - make_interval(secs => p_cooldown_seconds)
    or (v_rate.window_start > v_now - interval '1 hour' and v_rate.send_count >= p_max_per_email)
    or (v_hour.window_start > v_now - interval '1 hour' and v_hour.send_count >= p_max_hourly)
    or (v_day.window_start = v_day_start and v_day.send_count >= p_max_daily) then
    return jsonb_build_object('outcome','blocked');
  end if;
  insert into public.auth_global_rate_limits as g(bucket,window_start,send_count,max_per_window)
    values('auth_hour',v_now,1,p_max_hourly)
    on conflict(bucket) do update set
      send_count=case when g.window_start <= v_now-interval '1 hour' then 1 else g.send_count+1 end,
      window_start=case when g.window_start <= v_now-interval '1 hour' then v_now else g.window_start end,
      max_per_window=p_max_hourly;
  insert into public.auth_global_rate_limits as g(bucket,window_start,send_count,max_per_window)
    values('auth_day',v_day_start,1,p_max_daily)
    on conflict(bucket) do update set
      send_count=case when g.window_start=v_day_start then g.send_count+1 else 1 end,
      window_start=v_day_start,max_per_window=p_max_daily;
  insert into public.auth_email_rate_limits as e(email_hash,last_sent_at,send_count,window_start)
    values(v_email_hash,v_now,1,v_now)
    on conflict(email_hash) do update set last_sent_at=v_now,
      send_count=case when e.window_start <= v_now-interval '1 hour' then 1 else e.send_count+1 end,
      window_start=case when e.window_start <= v_now-interval '1 hour' then v_now else e.window_start end;
  insert into public.auth_email_deliveries(delivery_key,attempt_id,state,updated_at)
    values(p_delivery_key,v_attempt,'sending',v_now)
    on conflict(delivery_key) do update set attempt_id=v_attempt,state='sending',updated_at=v_now;
  return jsonb_build_object('outcome','send','attemptId',v_attempt);
end;
$$;

create or replace function public.finish_auth_email(p_delivery_key text,p_attempt_id uuid,p_state text,p_message_id text default null)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if p_state is null or p_state not in ('accepted','unknown','retryable','rejected')
    or (p_state='accepted' and (p_message_id is null or length(p_message_id) not between 1 and 512)) then return false; end if;
  perform pg_advisory_xact_lock(72610, 1);
  update public.auth_email_deliveries set state=p_state,message_id=p_message_id,updated_at=clock_timestamp()
    where delivery_key=p_delivery_key and attempt_id=p_attempt_id and state='sending';
  return found;
end;
$$;
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


-- Retire the old guard that could acknowledge mail without actually sending it.
drop function if exists public.hook_auth_send_email(jsonb);
drop function if exists public.check_and_consume_auth_rate_limit(text,int,int,int);
revoke all on function public.validate_auth_email_domain(text), public.hook_before_user_created(jsonb),
  public.reserve_auth_email(text,text,int,int,int,int), public.finish_auth_email(text,uuid,text,text)
  from public, anon, authenticated, supabase_auth_admin, service_role;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
grant execute on function public.reserve_auth_email(text,text,int,int,int,int),
  public.finish_auth_email(text,uuid,text,text) to service_role;
commit;
