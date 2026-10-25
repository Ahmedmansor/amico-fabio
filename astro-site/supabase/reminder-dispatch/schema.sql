-- LOCAL PROPOSAL, NOT APPLIED. Requires activity + correspondence schemas.
begin;
set local lock_timeout='3s';set local statement_timeout='30s';
create table wishlist_reminder_internal.jobs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'queued' check(status in ('queued','leased','sending','accepted','unknown','failed','suppressed')),
  lease_id uuid,lease_until timestamptz,next_attempt_at timestamptz not null default clock_timestamp(),
  attempts integer not null default 0 check(attempts>=0),
  locale text,locale_revision bigint,activity_revision bigint,consent_at timestamptz,
  payload jsonb,payload_expires_at timestamptz,
  message_id text unique,accepted_at timestamptz,delivered_at timestamptz,
  check((accepted_at is null) or status='accepted')
);
create index reminder_jobs_work_idx on wishlist_reminder_internal.jobs(status,next_attempt_at,lease_until);
create table wishlist_reminder_internal.suppression(
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null,recorded_at timestamptz not null default clock_timestamp()
);
create table wishlist_reminder_internal.daily_budget(
  id integer primary key check(id=1),day date not null,attempts integer not null check(attempts>=0),configured_limit integer not null check(configured_limit>0)
);
alter table wishlist_reminder_internal.jobs enable row level security;
alter table wishlist_reminder_internal.suppression enable row level security;
alter table wishlist_reminder_internal.daily_budget enable row level security;
revoke all on wishlist_reminder_internal.jobs,wishlist_reminder_internal.suppression,wishlist_reminder_internal.daily_budget from public,anon,authenticated,service_role;
grant select,insert,update on wishlist_reminder_internal.jobs,wishlist_reminder_internal.suppression,wishlist_reminder_internal.daily_budget to service_role;

create function public.claim_wishlist_reminders(p_batch integer,p_lease_seconds integer,p_user_ids uuid[])
returns table(delivery_id uuid,user_id uuid,lease_id uuid,locale text,payload jsonb)
language plpgsql security invoker set search_path=''
as $$ declare candidate record; lease uuid; begin
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
      locale=case when j.payload is not null then j.locale when candidate.locale in ('it','en') then candidate.locale else 'it' end,
      locale_revision=case when j.payload is null then candidate.locale_revision else j.locale_revision end,
      activity_revision=case when j.payload is null then candidate.activity_revision else j.activity_revision end,
      consent_at=case when j.payload is null then candidate.enabled_since else j.consent_at end where j.id=candidate.id;
    return query select j.id,j.user_id,j.lease_id,j.locale,j.payload from wishlist_reminder_internal.jobs j where j.id=candidate.id;
  end loop;
end $$;

create function public.seal_wishlist_reminder(p_job_id uuid,p_lease_id uuid,p_payload jsonb,p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path=''
as $$ begin
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or p_payload->>'deliveryId' is distinct from p_job_id::text
    or octet_length(p_payload::text)>2097152 or p_expires_at is null or p_expires_at<=clock_timestamp() then return false;end if;
  update wishlist_reminder_internal.jobs j set payload=p_payload,payload_expires_at=p_expires_at
    where j.id=p_job_id and j.lease_id=p_lease_id and j.status='leased' and j.lease_until>clock_timestamp() and j.payload is null;
  return found;
end $$;

create function public.begin_wishlist_reminder(p_job_id uuid,p_lease_id uuid,p_daily_limit integer,p_attempt_limit integer)
returns boolean language plpgsql security invoker set search_path=''
as $$ declare job wishlist_reminder_internal.jobs%rowtype; current_state record; budget wishlist_reminder_internal.daily_budget%rowtype; today date; begin
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
    or current_state.enabled_since is distinct from job.consent_at or (case when current_state.locale in ('it','en') then current_state.locale else 'it' end)<>job.locale then
    update wishlist_reminder_internal.jobs set status=case when attempts=0 then 'queued' else 'failed' end,payload=null,lease_id=null where id=p_job_id;return false;
  end if;
  if job.attempts>=p_attempt_limit or job.payload_expires_at is null or job.payload_expires_at<=clock_timestamp() then
    update wishlist_reminder_internal.jobs set status='failed',payload=null,lease_id=null where id=p_job_id;return false;
  end if;
  if budget.attempts>=p_daily_limit then return false;end if;
  update wishlist_reminder_internal.daily_budget set day=budget.day,attempts=budget.attempts+1 where id=1;
  update wishlist_reminder_internal.jobs set status='sending',attempts=attempts+1 where id=p_job_id;
  return true;
end $$;

create function public.finish_wishlist_reminder(p_job_id uuid,p_lease_id uuid,p_status text,p_message_id text,p_retry_seconds integer,p_attempt_limit integer)
returns boolean language plpgsql security invoker set search_path=''
as $$ declare job wishlist_reminder_internal.jobs%rowtype; begin
  if p_status is null or p_status not in ('accepted','retry','unknown','failed') or p_attempt_limit is null or p_attempt_limit<1
    or (p_status='accepted' and (p_message_id is null or length(p_message_id) not between 1 and 512 or p_message_id ~ '[[:space:]<>]'))
    or (p_status='retry' and (p_retry_seconds is null or p_retry_seconds<1)) then raise exception 'Invalid settlement.' using errcode='22023';end if;
  select * into job from wishlist_reminder_internal.jobs where id=p_job_id for update;
  if not found or job.lease_id is distinct from p_lease_id then return false;end if;
  if job.status='accepted' then return p_status<>'accepted' or job.message_id=p_message_id;end if;
  if job.status not in ('sending','unknown') then return false;end if;
  -- Late definitive acceptance can resolve the same expired attempt. Nothing
  -- else turns an unknown attempt back into an automatically sendable job.
  if p_status='accepted' then
    update wishlist_reminder_internal.jobs set status='accepted',message_id=p_message_id,accepted_at=coalesce(accepted_at,clock_timestamp()),payload=null where id=p_job_id;
  elsif job.status='sending' then
    update wishlist_reminder_internal.jobs set status=case when p_status='retry' then case when attempts<p_attempt_limit then 'queued' else 'failed' end else p_status end,
      next_attempt_at=case when p_status='retry' then clock_timestamp()+make_interval(secs=>p_retry_seconds) else next_attempt_at end,
      payload=case when p_status='failed' or (p_status='retry' and attempts>=p_attempt_limit) then null else payload end where id=p_job_id;
  end if;
  return true;
end $$;

create function public.release_wishlist_reminder(p_job_id uuid,p_lease_id uuid,p_retry_seconds integer)
returns boolean language plpgsql security invoker set search_path=''
as $$ begin
  if p_retry_seconds is null or p_retry_seconds<1 then raise exception 'Retry policy required.' using errcode='22023';end if;
  update wishlist_reminder_internal.jobs set status=case when attempts=0 then 'queued' else 'failed' end,
    payload=null,next_attempt_at=clock_timestamp()+make_interval(secs=>p_retry_seconds),lease_id=null
    where id=p_job_id and lease_id=p_lease_id and status='leased';return found;
end $$;

-- Wishlist owns this read contract; only trusted claimed accounts reach it.
grant select(user_id,trip_id) on public.wishlists to service_role;
grant select(user_id,package_id) on public.package_wishlists to service_role;
create function public.read_reminder_wishlist_items(p_user_id uuid)
returns table(kind text,id text) language sql security invoker set search_path=''
as $$ select 'trip'::text,w.trip_id from public.wishlists w where w.user_id=p_user_id
  union all select 'package'::text,w.package_id from public.package_wishlists w where w.user_id=p_user_id $$;

revoke execute on function public.claim_wishlist_reminders(integer,integer,uuid[]),public.seal_wishlist_reminder(uuid,uuid,jsonb,timestamptz),public.begin_wishlist_reminder(uuid,uuid,integer,integer),public.finish_wishlist_reminder(uuid,uuid,text,text,integer,integer),public.release_wishlist_reminder(uuid,uuid,integer),public.read_reminder_wishlist_items(uuid) from public,anon,authenticated;
grant execute on function public.claim_wishlist_reminders(integer,integer,uuid[]),public.seal_wishlist_reminder(uuid,uuid,jsonb,timestamptz),public.begin_wishlist_reminder(uuid,uuid,integer,integer),public.finish_wishlist_reminder(uuid,uuid,text,text,integer,integer),public.release_wishlist_reminder(uuid,uuid,integer),public.read_reminder_wishlist_items(uuid) to service_role;
commit;
