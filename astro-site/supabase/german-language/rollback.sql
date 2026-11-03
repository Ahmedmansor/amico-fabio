-- German account-language support only. Grants, policies, consent and sending scope are preserved.
-- Captured live definitions on 2026-11-03; inspect before applying.
BEGIN;
SET LOCAL lock_timeout='3s';
ALTER TABLE account_marketing_private.signup_intents DROP CONSTRAINT signup_intents_locale_check;
ALTER TABLE account_marketing_private.signup_intents ADD CONSTRAINT signup_intents_locale_check CHECK ((locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));
ALTER TABLE public.account_locale_commands DROP CONSTRAINT account_locale_commands_check;
ALTER TABLE public.account_locale_commands ADD CONSTRAINT account_locale_commands_check CHECK ((((kind = 'email_follow_site'::text) AND (locale IS NULL)) OR ((kind = ANY (ARRAY['site'::text, 'email_explicit'::text])) AND (locale IS NOT NULL) AND (locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])))));
ALTER TABLE public.account_marketing_preferences DROP CONSTRAINT account_marketing_preferences_locale_check;
ALTER TABLE public.account_marketing_preferences ADD CONSTRAINT account_marketing_preferences_locale_check CHECK ((locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));
ALTER TABLE public.profiles DROP CONSTRAINT profiles_locale_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_locale_check CHECK ((locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));
ALTER TABLE public.wishlist_email_consent_events DROP CONSTRAINT wishlist_email_consent_events_consent_locale_check;
ALTER TABLE public.wishlist_email_consent_events ADD CONSTRAINT wishlist_email_consent_events_consent_locale_check CHECK ((consent_locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));
ALTER TABLE public.wishlist_email_consent_events DROP CONSTRAINT wishlist_email_consent_events_correspondence_locale_check;
ALTER TABLE public.wishlist_email_consent_events ADD CONSTRAINT wishlist_email_consent_events_correspondence_locale_check CHECK ((correspondence_locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));
ALTER TABLE public.wishlist_email_consent_events DROP CONSTRAINT wishlist_email_consent_events_locale_check;
ALTER TABLE public.wishlist_email_consent_events ADD CONSTRAINT wishlist_email_consent_events_locale_check CHECK ((locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));
ALTER TABLE public.wishlist_email_preferences DROP CONSTRAINT wishlist_email_preferences_locale_check;
ALTER TABLE public.wishlist_email_preferences ADD CONSTRAINT wishlist_email_preferences_locale_check CHECK ((locale = ANY (ARRAY['it'::text, 'en'::text, 'es'::text, 'pt'::text])));

CREATE OR REPLACE FUNCTION account_marketing_private.capture_signup_intent()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.raw_app_meta_data->>'provider' = 'email'
    and new.raw_user_meta_data->'marketing_consent' = 'true'::jsonb
    and new.raw_user_meta_data->>'marketing_notice_version' = 'favorites-offers-v1'
    and new.raw_user_meta_data->>'site_locale' in ('it','en','es','pt') then
    insert into account_marketing_private.signup_intents(user_id,locale,notice_version)
    values(new.id,new.raw_user_meta_data->>'site_locale','favorites-offers-v1');
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.begin_wishlist_reminder(p_job_id uuid, p_lease_id uuid, p_daily_limit integer, p_attempt_limit integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ declare job wishlist_reminder_internal.jobs%rowtype; current_state record; budget wishlist_reminder_internal.daily_budget%rowtype; today date; begin
  if p_daily_limit is null or p_daily_limit<1 or p_attempt_limit is null or p_attempt_limit<1 then raise exception 'Invalid send policy.' using errcode='22023';end if;
  if not exists(select 1 from wishlist_reminder_internal.cron_auth where id=1 and enabled and webhook_ready) then return false;end if;
  today=(clock_timestamp() at time zone 'UTC')::date;
  insert into wishlist_reminder_internal.daily_budget(id,day,attempts,configured_limit) values(1,today,0,p_daily_limit) on conflict(id) do nothing;
  select * into budget from wishlist_reminder_internal.daily_budget where id=1 for update;
  if budget.configured_limit<>p_daily_limit then raise exception 'Daily policy mismatch.' using errcode='22023';end if;
  if budget.day<today then budget.day=today;budget.attempts=0;end if;
  select * into job from wishlist_reminder_internal.jobs where id=p_job_id;
  if not found then return false;end if;
  perform pg_advisory_xact_lock(hashtextextended(job.user_id::text,0));
  select * into job from wishlist_reminder_internal.jobs where id=p_job_id for update;
  if not found or job.lease_id is distinct from p_lease_id or job.status<>'leased' or job.lease_until<=clock_timestamp() or job.payload is null then return false;end if;
  select p.enabled,p.enabled_since,p.locale,f.locale_revision,a.favorite_count,a.last_addition_at,a.revision as activity_revision,s.user_id as suppressed
    into current_state from public.wishlist_email_preferences p join public.profiles f using(user_id)
    join wishlist_reminder_internal.activity a using(user_id) left join wishlist_reminder_internal.suppression s using(user_id) where p.user_id=job.user_id;
  if not found or not current_state.enabled or current_state.favorite_count=0 or current_state.suppressed is not null then
    update wishlist_reminder_internal.jobs set status=case when attempts=0 then 'suppressed' else 'failed' end,payload=null,lease_id=null where id=p_job_id;return false;
  end if;
  if current_state.enabled_since is null or greatest(current_state.enabled_since,current_state.last_addition_at)+interval '24 hours'>clock_timestamp()
    or current_state.locale_revision is distinct from job.locale_revision or current_state.activity_revision is distinct from job.activity_revision
    or current_state.enabled_since is distinct from job.consent_at or (case when current_state.locale in ('it','en','es','pt') then current_state.locale else 'it' end)<>job.locale then
    update wishlist_reminder_internal.jobs set status=case when attempts=0 then 'queued' else 'failed' end,payload=null,lease_id=null where id=p_job_id;return false;
  end if;
  if job.attempts>=p_attempt_limit or job.payload_expires_at is null or job.payload_expires_at<=clock_timestamp() then
    update wishlist_reminder_internal.jobs set status='failed',payload=null,lease_id=null where id=p_job_id;return false;
  end if;
  if budget.attempts>=p_daily_limit then return false;end if;
  update wishlist_reminder_internal.daily_budget set day=budget.day,attempts=budget.attempts+1 where id=1;
  update wishlist_reminder_internal.jobs set status='sending',attempts=attempts+1 where id=p_job_id;
  return true;
end $function$
;

CREATE OR REPLACE FUNCTION public.change_account_locale(p_user_id uuid, p_request_id uuid, p_expected_revision bigint, p_kind text, p_locale text)
 RETURNS TABLE(outcome text, site_locale text, revision bigint, email_locale text, locale_source text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  previous public.account_locale_commands%rowtype;
  profile_row record;
  preference_row public.wishlist_email_preferences%rowtype;
begin
  if p_user_id is null or p_request_id is null or p_expected_revision is null
    or p_expected_revision not between 0 and 9007199254740990
    or p_kind is null or p_kind not in ('site','email_explicit','email_follow_site')
    or (p_kind='email_follow_site' and p_locale is not null)
    or (p_kind<>'email_follow_site' and (p_locale is null or p_locale not in ('it','en','es','pt'))) then
    return query select 'invalid-input'::text,null::text,null::bigint,null::text,null::text;
    return;
  end if;
  -- Same transaction lock/key as consent writes. No client clock participates.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  select p.locale,p.locale_revision into profile_row from public.profiles p where p.user_id=p_user_id;
  if not found then
    return query select 'missing-profile'::text,null::text,null::bigint,null::text,null::text;
    return;
  end if;
  select * into previous from public.account_locale_commands c
    where c.user_id=p_user_id and c.request_id=p_request_id;
  if found then
    if (previous.expected_revision,previous.kind,previous.locale)
      is distinct from (p_expected_revision,p_kind,p_locale) then
      return query select 'invalid-input'::text,null::text,null::bigint,null::text,null::text;
    else
      -- Return current state; never replay an old command over a later explicit choice.
      return query select 'duplicate'::text,r.site_locale,r.revision,r.email_locale,r.locale_source
        from public.read_account_locale(p_user_id) r;
    end if;
    return;
  end if;
  if profile_row.locale_revision<>p_expected_revision then
    return query select 'conflict'::text,r.site_locale,r.revision,r.email_locale,r.locale_source
      from public.read_account_locale(p_user_id) r;
    return;
  end if;
  select * into preference_row from public.wishlist_email_preferences e where e.user_id=p_user_id;
  if not found and p_kind<>'site' then
    return query select 'missing-preference'::text,null::text,null::bigint,null::text,null::text;
    return;
  end if;
  if p_kind='site' then
    update public.profiles p set locale=p_locale where p.user_id=p_user_id;
    update public.wishlist_email_preferences e set locale=p_locale
      where e.user_id=p_user_id and e.locale is distinct from p_locale;
  elsif p_kind='email_explicit' then
    update public.profiles p set locale=p_locale where p.user_id=p_user_id;
    update public.wishlist_email_preferences e set locale=p_locale,locale_source='explicit' where e.user_id=p_user_id;
  else
    update public.wishlist_email_preferences e set locale=profile_row.locale,locale_source='follow_site' where e.user_id=p_user_id;
  end if;
  -- Consent timestamps, enabled state, wording and audit history are untouched.
  update public.profiles p set locale_revision=p.locale_revision+1 where p.user_id=p_user_id;
  insert into public.account_locale_commands(user_id,request_id,expected_revision,kind,locale)
    values(p_user_id,p_request_id,p_expected_revision,p_kind,p_locale);
  return query select 'applied'::text,r.site_locale,r.revision,r.email_locale,r.locale_source
    from public.read_account_locale(p_user_id) r;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.change_wishlist_email_preference(p_user_id uuid, p_request_id uuid, p_enabled boolean, p_locale text, p_wording_version text, p_source text)
 RETURNS TABLE(enabled boolean, locale text, wording_version text, updated_at timestamp with time zone, enabled_since timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare previous public.wishlist_email_consent_events%rowtype;
  desired_action text; server_time timestamptz; site_language text; email_language text;
begin
  if p_user_id is null or p_request_id is null or p_enabled is null
    or p_locale is null or p_locale not in ('it','en','es','pt')
    or p_wording_version is distinct from 'wishlist-reminders-v1'
    or p_source is null or p_source not in ('wishlist-page','email-unsubscribe')
    or (p_source='email-unsubscribe' and p_enabled) then
    raise exception 'Invalid preference command.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  desired_action=case when p_enabled then 'grant' else 'withdraw' end;
  select * into previous from public.wishlist_email_consent_events e where e.user_id=p_user_id and e.request_id=p_request_id;
  if found then
    if (previous.action,previous.locale,previous.wording_version,previous.source)
      is distinct from (desired_action,p_locale,p_wording_version,p_source) then
      raise exception 'Request identity already used for a different command.' using errcode='22023';
    end if;
    return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
      from public.wishlist_email_preferences p where p.user_id=p_user_id;
    return;
  end if;
  select p.locale into site_language from public.profiles p where p.user_id=p_user_id;
  if not found then raise exception 'Profile required before consent.' using errcode='22023'; end if;
  select case when e.locale_source='explicit' then e.locale else site_language end into email_language
    from public.wishlist_email_preferences e where e.user_id=p_user_id;
  email_language=coalesce(email_language,site_language);
  server_time=pg_catalog.clock_timestamp();
  insert into public.wishlist_email_preferences as target(user_id,enabled,locale,wording_version,updated_at,enabled_since)
    values(p_user_id,p_enabled,email_language,p_wording_version,server_time,case when p_enabled then server_time else null end)
    on conflict(user_id) do update set enabled=excluded.enabled,locale=excluded.locale,
      wording_version=excluded.wording_version,updated_at=excluded.updated_at,
      enabled_since=case when not excluded.enabled then null when target.enabled then target.enabled_since else excluded.enabled_since end;
  insert into public.wishlist_email_consent_events(user_id,request_id,action,locale,wording_version,source,recorded_at)
    values(p_user_id,p_request_id,desired_action,p_locale,p_wording_version,p_source,server_time);
  return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
    from public.wishlist_email_preferences p where p.user_id=p_user_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.change_wishlist_email_preference_v2(p_user_id uuid, p_request_id uuid, p_enabled boolean, p_locale text, p_consent_locale text, p_wording_version text, p_source text)
 RETURNS TABLE(enabled boolean, locale text, wording_version text, updated_at timestamp with time zone, enabled_since timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare previous public.wishlist_email_consent_events%rowtype;
  current_preference public.wishlist_email_preferences%rowtype;
  desired_action text; server_time timestamptz; email_language text;
begin
  if p_user_id is null or p_request_id is null or p_enabled is null
    or p_locale is null or p_locale not in ('it','en','es','pt')
    or p_consent_locale is null or p_consent_locale not in ('it','en','es','pt')
    or p_wording_version is distinct from 'wishlist-reminders-v1'
    or p_source is null or p_source not in ('wishlist-page','email-unsubscribe')
    or (p_source='email-unsubscribe' and p_enabled) then
    raise exception 'Invalid preference command.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  desired_action=case when p_enabled then 'grant' else 'withdraw' end;
  select * into previous from public.wishlist_email_consent_events e
    where e.user_id=p_user_id and e.request_id=p_request_id;
  if found then
    if (previous.action,previous.locale,previous.consent_locale,previous.wording_version,previous.source)
      is distinct from (desired_action,p_locale,p_consent_locale,p_wording_version,p_source) then
      raise exception 'Request identity already used.' using errcode='22023';
    end if;
    return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
      from public.wishlist_email_preferences p where p.user_id=p_user_id;
    return;
  end if;
  if not exists(select 1 from public.profiles p where p.user_id=p_user_id) then
    raise exception 'Profile required before consent.' using errcode='22023';
  end if;
  select * into current_preference from public.wishlist_email_preferences e where e.user_id=p_user_id;
  if not found and not p_enabled then raise exception 'Preference absent.' using errcode='22023'; end if;
  email_language=coalesce(current_preference.locale,p_locale);
  server_time=pg_catalog.clock_timestamp();
  insert into public.wishlist_email_preferences as target(user_id,enabled,locale,locale_source,wording_version,updated_at,enabled_since)
    values(p_user_id,p_enabled,email_language,'explicit',p_wording_version,server_time,case when p_enabled then server_time else null end)
    on conflict(user_id) do update set enabled=excluded.enabled,locale_source='explicit',
      wording_version=excluded.wording_version,updated_at=excluded.updated_at,
      enabled_since=case when not excluded.enabled then null when target.enabled then target.enabled_since else excluded.enabled_since end;
  insert into public.wishlist_email_consent_events(user_id,request_id,action,locale,consent_locale,correspondence_locale,wording_version,source,recorded_at)
    values(p_user_id,p_request_id,desired_action,p_locale,p_consent_locale,email_language,p_wording_version,p_source,server_time);
  return query select p.enabled,p.locale,p.wording_version,p.updated_at,p.enabled_since
    from public.wishlist_email_preferences p where p.user_id=p_user_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_wishlist_reminders(p_batch integer, p_lease_seconds integer, p_user_ids uuid[])
 RETURNS TABLE(delivery_id uuid, user_id uuid, lease_id uuid, locale text, payload jsonb)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ declare candidate record; lease uuid; begin
  if p_batch is null or p_batch not between 1 and 50 or p_lease_seconds is null or p_lease_seconds not between 10 and 3600
    or (p_user_ids is not null and (cardinality(p_user_ids)=0 or array_position(p_user_ids,null) is not null)) then raise exception 'Invalid claim policy.' using errcode='22023';end if;
  -- Expired sending leases are ambiguous, never eligible for automatic resend.
  update wishlist_reminder_internal.jobs set status='unknown' where id in
    (select j.id from wishlist_reminder_internal.jobs j where j.status='sending' and j.lease_until<=clock_timestamp()
      and (p_user_ids is null or j.user_id=any(p_user_ids)) for update skip locked limit p_batch);
  insert into wishlist_reminder_internal.jobs(user_id)
    select p.user_id from public.wishlist_email_preferences p join wishlist_reminder_internal.activity a using(user_id)
    left join wishlist_reminder_internal.jobs j using(user_id) left join wishlist_reminder_internal.suppression s using(user_id)
    where p.enabled and a.favorite_count>0 and p.enabled_since is not null and s.user_id is null and j.user_id is null
      and (p_user_ids is null or p.user_id=any(p_user_ids))
      and greatest(p.enabled_since,a.last_addition_at)+interval '24 hours'<=clock_timestamp()
    order by greatest(p.enabled_since,a.last_addition_at),p.user_id limit p_batch on conflict on constraint jobs_user_id_key do nothing;
  for candidate in
    select j.id,p.user_id,p.locale,f.locale_revision,a.revision as activity_revision,p.enabled_since
    from wishlist_reminder_internal.jobs j join public.wishlist_email_preferences p using(user_id)
    join public.profiles f using(user_id) join wishlist_reminder_internal.activity a using(user_id)
    left join wishlist_reminder_internal.suppression s using(user_id)
    where j.accepted_at is null and s.user_id is null and p.enabled and a.favorite_count>0 and p.enabled_since is not null
      and (p_user_ids is null or p.user_id=any(p_user_ids))
      and greatest(p.enabled_since,a.last_addition_at)+interval '24 hours'<=clock_timestamp()
      and (j.status in ('queued','suppressed') or (j.status='leased' and j.lease_until<=clock_timestamp()))
      and j.next_attempt_at<=clock_timestamp()
    order by j.next_attempt_at,j.id for update of j skip locked limit p_batch
  loop
    lease=gen_random_uuid();
    -- Sealed content may only change before the first possible HTTP attempt.
    update wishlist_reminder_internal.jobs j set payload=null,payload_expires_at=null
      where j.id=candidate.id and j.attempts=0 and (j.locale_revision is distinct from candidate.locale_revision or j.activity_revision is distinct from candidate.activity_revision or j.consent_at is distinct from candidate.enabled_since);
    update wishlist_reminder_internal.jobs j set status='leased',lease_id=lease,lease_until=clock_timestamp()+make_interval(secs=>p_lease_seconds),
      locale=case when j.payload is not null then j.locale when candidate.locale in ('it','en','es','pt') then candidate.locale else 'it' end,
      locale_revision=case when j.payload is null then candidate.locale_revision else j.locale_revision end,
      activity_revision=case when j.payload is null then candidate.activity_revision else j.activity_revision end,
      consent_at=case when j.payload is null then candidate.enabled_since else j.consent_at end where j.id=candidate.id;
    return query select j.id,j.user_id,j.lease_id,j.locale,j.payload from wishlist_reminder_internal.jobs j where j.id=candidate.id;
  end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.manage_wishlist_correspondence(p_token_hash text, p_operation text, p_request_id uuid, p_locale text, p_expected_revision bigint, p_consent_locale text)
 RETURNS TABLE(enabled boolean, locale text, revision bigint, conflict boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare capability wishlist_correspondence_internal.tokens%rowtype; command_language text;
  current_preference public.wishlist_email_preferences%rowtype; mutation record;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_operation is null or p_operation not in ('read','unsubscribe','language')
    or (p_operation='read' and (p_request_id is not null or p_locale is not null or p_expected_revision is not null or p_consent_locale is not null))
    or (p_operation<>'read' and p_request_id is null)
    or (p_operation='unsubscribe' and (p_locale is not null or p_expected_revision is not null or p_consent_locale is null or p_consent_locale not in ('it','en','es','pt')))
    or (p_operation='language' and (p_locale is null or p_locale not in ('it','en','es','pt') or p_expected_revision is null or p_expected_revision<0 or p_consent_locale is not null)) then
    raise exception 'Invalid management command.' using errcode='22023';
  end if;
  select * into capability from wishlist_correspondence_internal.tokens t where t.token_hash=p_token_hash;
  if not found then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(capability.user_id::text,0));
  -- Recheck after waiting; a concurrent revocation/expiry must not be ignored.
  select * into capability from wishlist_correspondence_internal.tokens t where t.token_hash=p_token_hash for share;
  if not found or capability.revoked_at is not null or capability.expires_at<=pg_catalog.clock_timestamp() then return; end if;
  select * into current_preference from public.wishlist_email_preferences p where p.user_id=capability.user_id;
  if not found then return; end if;
  if p_operation='unsubscribe' then
    select e.locale into command_language from public.wishlist_email_consent_events e
      where e.user_id=capability.user_id and e.request_id=p_request_id;
    perform public.change_wishlist_email_preference_v2(capability.user_id,p_request_id,false,
      coalesce(command_language,current_preference.locale),p_consent_locale,'wishlist-reminders-v1','email-unsubscribe');
  elsif p_operation='language' then
    select * into mutation from public.change_account_locale(capability.user_id,p_request_id,p_expected_revision,'email_explicit',p_locale);
    -- This RPC preserves consent, timestamps, schedule and first-send allowance.
    if mutation.outcome='conflict' then
      return query select p.enabled,p.locale,f.locale_revision,true from public.wishlist_email_preferences p
        join public.profiles f using(user_id) where p.user_id=capability.user_id;
      return;
    end if;
  end if;
  return query select p.enabled,p.locale,f.locale_revision,false from public.wishlist_email_preferences p
    join public.profiles f using(user_id) where p.user_id=capability.user_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_account_marketing_consent(p_expected_user_id uuid, p_expected_revision bigint, p_enabled boolean, p_locale text, p_notice_version text)
 RETURNS TABLE(marketing_consent boolean, revision bigint, verified boolean, pending_signup boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare current_revision bigint; current_enabled boolean; next_revision bigint;
begin
  if not account_marketing_private.verified_actor(p_expected_user_id) then
    raise exception 'Verified email required' using errcode='28000';
  end if;
  if p_enabled is null or p_expected_revision is null or p_expected_revision<0
    or p_locale not in ('it','en','es','pt') or p_locale is null
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
end $function$
;
COMMIT;
