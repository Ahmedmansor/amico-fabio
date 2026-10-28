-- LOCAL PROPOSAL. Not executed or verified against real roles.
-- No email sending, reminder enrollment or existing-account backfill.
begin;
create schema if not exists account_marketing_private;
revoke all on schema account_marketing_private from public, anon, authenticated;

create table public.account_marketing_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  marketing_consent boolean not null default false,
  revision bigint not null default 1 check (revision > 0),
  notice_version text not null check (notice_version = 'favorites-offers-v1'),
  locale text not null check (locale in ('it','en')),
  updated_at timestamptz not null default now()
);
create table account_marketing_private.signup_intents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null check (locale in ('it','en')),
  notice_version text not null check (notice_version = 'favorites-offers-v1'),
  requested_at timestamptz not null default now(),
  consumed_at timestamptz
);
create table account_marketing_private.consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null,
  revision bigint not null,
  locale text not null,
  notice_version text not null,
  source text not null check (source in ('verified-signup','account')),
  recorded_at timestamptz not null default now(),
  unique (user_id, revision)
);
alter table public.account_marketing_preferences enable row level security;
alter table account_marketing_private.signup_intents enable row level security;
alter table account_marketing_private.consent_events enable row level security;
revoke all on public.account_marketing_preferences from public,anon,authenticated;
revoke all on all tables in schema account_marketing_private from public,anon,authenticated;
revoke all on all sequences in schema account_marketing_private from public,anon,authenticated;

-- Capture a one-time unverified intention at INSERT only. Later user_metadata
-- edits cannot create/alter this snapshot or authorize a marketing grant.
create function account_marketing_private.capture_signup_intent() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.raw_app_meta_data->>'provider' = 'email'
    and new.raw_user_meta_data->'marketing_consent' = 'true'::jsonb
    and new.raw_user_meta_data->>'marketing_notice_version' = 'favorites-offers-v1'
    and new.raw_user_meta_data->>'site_locale' in ('it','en') then
    insert into account_marketing_private.signup_intents(user_id,locale,notice_version)
    values(new.id,new.raw_user_meta_data->>'site_locale','favorites-offers-v1');
  end if;
  return new;
end $$;
revoke all on function account_marketing_private.capture_signup_intent() from public,anon,authenticated;
create trigger capture_account_marketing_signup after insert on auth.users
for each row execute function account_marketing_private.capture_signup_intent();

create function account_marketing_private.verified_actor(p_expected_user_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare confirmed timestamptz;
begin
  if auth.uid() is null or auth.uid() is distinct from p_expected_user_id then
    raise exception 'Account changed or unavailable' using errcode='28000';
  end if;
  select email_confirmed_at into confirmed from auth.users where id=auth.uid() and deleted_at is null;
  if not found then raise exception 'Account unavailable' using errcode='28000'; end if;
  return confirmed is not null;
end $$;
revoke all on function account_marketing_private.verified_actor(uuid) from public,anon,authenticated;

create function public.read_account_marketing_consent(p_expected_user_id uuid)
returns table(marketing_consent boolean,revision bigint,verified boolean,pending_signup boolean)
language plpgsql security definer set search_path='' as $$
declare is_verified boolean;
begin
  is_verified:=account_marketing_private.verified_actor(p_expected_user_id);
  return query select coalesce(p.marketing_consent,false),coalesce(p.revision,0::bigint),is_verified,
    exists(select 1 from account_marketing_private.signup_intents i where i.user_id=p_expected_user_id and i.consumed_at is null)
    from (select 1) seed left join public.account_marketing_preferences p on p.user_id=p_expected_user_id;
end $$;

create function public.set_account_marketing_consent(p_expected_user_id uuid,p_expected_revision bigint,p_enabled boolean,p_locale text,p_notice_version text)
returns table(marketing_consent boolean,revision bigint,verified boolean,pending_signup boolean)
language plpgsql security definer set search_path='' as $$
declare current_revision bigint; current_enabled boolean; next_revision bigint;
begin
  if not account_marketing_private.verified_actor(p_expected_user_id) then
    raise exception 'Verified email required' using errcode='28000';
  end if;
  if p_enabled is null or p_expected_revision is null or p_expected_revision<0
    or p_locale not in ('it','en') or p_locale is null
    or p_notice_version is distinct from 'favorites-offers-v1' then
    raise exception 'Invalid consent request' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_expected_user_id::text,528));
  select p.revision,p.marketing_consent into current_revision,current_enabled
    from public.account_marketing_preferences p where p.user_id=p_expected_user_id for update;
  current_revision:=coalesce(current_revision,0);
  if current_revision<>p_expected_revision then raise exception 'Preference changed; reload before saving' using errcode='40001'; end if;
  -- A delayed signup activation can never re-enable an explicit account choice.
  update account_marketing_private.signup_intents set consumed_at=coalesce(consumed_at,now()) where user_id=p_expected_user_id;
  if current_enabled is not distinct from p_enabled then
    return query select * from public.read_account_marketing_consent(p_expected_user_id);return;
  end if;
  next_revision:=current_revision+1;
  insert into public.account_marketing_preferences(user_id,marketing_consent,revision,notice_version,locale)
    values(p_expected_user_id,p_enabled,next_revision,p_notice_version,p_locale)
    on conflict(user_id) do update set marketing_consent=excluded.marketing_consent,revision=excluded.revision,
      notice_version=excluded.notice_version,locale=excluded.locale,updated_at=now();
  insert into account_marketing_private.consent_events(user_id,enabled,revision,locale,notice_version,source)
    values(p_expected_user_id,p_enabled,next_revision,p_locale,p_notice_version,'account');
  return query select * from public.read_account_marketing_consent(p_expected_user_id);
end $$;

create function public.activate_signup_marketing_intent(p_expected_user_id uuid)
returns table(marketing_consent boolean,revision bigint,verified boolean,pending_signup boolean)
language plpgsql security definer set search_path='' as $$
declare intent account_marketing_private.signup_intents%rowtype;
begin
  if not account_marketing_private.verified_actor(p_expected_user_id) then
    raise exception 'Verified email required' using errcode='28000';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_expected_user_id::text,528));
  select * into intent from account_marketing_private.signup_intents i
    where i.user_id=p_expected_user_id and i.consumed_at is null for update;
  if found then
    update account_marketing_private.signup_intents set consumed_at=now() where user_id=p_expected_user_id;
    if not exists(select 1 from public.account_marketing_preferences p where p.user_id=p_expected_user_id) then
      insert into public.account_marketing_preferences(user_id,marketing_consent,notice_version,locale)
        values(p_expected_user_id,true,intent.notice_version,intent.locale);
      insert into account_marketing_private.consent_events(user_id,enabled,revision,locale,notice_version,source)
        values(p_expected_user_id,true,1,intent.locale,intent.notice_version,'verified-signup');
    end if;
  end if;
  return query select * from public.read_account_marketing_consent(p_expected_user_id);
end $$;

revoke all on function public.read_account_marketing_consent(uuid) from public,anon,authenticated;
revoke all on function public.set_account_marketing_consent(uuid,bigint,boolean,text,text) from public,anon,authenticated;
revoke all on function public.activate_signup_marketing_intent(uuid) from public,anon,authenticated;
grant execute on function public.read_account_marketing_consent(uuid) to authenticated;
grant execute on function public.set_account_marketing_consent(uuid,bigint,boolean,text,text) to authenticated;
grant execute on function public.activate_signup_marketing_intent(uuid) to authenticated;
commit;
