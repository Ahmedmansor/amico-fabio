-- LOCAL PROPOSAL, NOT APPLIED. Requires dispatch schema.
begin;
create table wishlist_reminder_internal.provider_events(
  job_id uuid not null references wishlist_reminder_internal.jobs(id) on delete cascade,
  event text not null,recorded_at timestamptz not null default clock_timestamp(),
  primary key(job_id,event)
);
alter table wishlist_reminder_internal.provider_events enable row level security;
revoke all on wishlist_reminder_internal.provider_events from public,anon,authenticated,service_role;
grant select,insert on wishlist_reminder_internal.provider_events to service_role;
create function public.record_wishlist_reminder_event(p_job_id uuid,p_message_id text,p_event text)
returns boolean language plpgsql security invoker set search_path=''
as $$ declare job wishlist_reminder_internal.jobs%rowtype; begin
  if p_job_id is null or p_message_id is null or length(p_message_id) not between 1 and 512 or p_message_id ~ '[[:space:]<>]'
    or p_event is null or p_event not in ('request','delivered','hard_bounce','soft_bounce','blocked','spam','unsubscribed','invalid_email') then
    raise exception 'Invalid provider event.' using errcode='22023';end if;
  select * into job from wishlist_reminder_internal.jobs where id=p_job_id;
  if not found then return false;end if;
  perform pg_advisory_xact_lock(hashtextextended(job.user_id::text,0));
  select * into job from wishlist_reminder_internal.jobs where id=p_job_id for update;
  if not found or job.attempts=0 or (job.message_id is not null and job.message_id<>p_message_id) then return false;end if;
  insert into wishlist_reminder_internal.provider_events(job_id,event) values(p_job_id,p_event) on conflict do nothing;
  if not found then return true;end if;
  if p_event in ('request','delivered') then
    update wishlist_reminder_internal.jobs set status='accepted',message_id=p_message_id,accepted_at=coalesce(accepted_at,clock_timestamp()),
      delivered_at=case when p_event='delivered' then coalesce(delivered_at,clock_timestamp()) else delivered_at end,payload=null where id=p_job_id;
  else
    update wishlist_reminder_internal.jobs set message_id=p_message_id,
      status=case when accepted_at is not null then 'accepted' else 'unknown' end where id=p_job_id;
  end if;
  if p_event in ('hard_bounce','blocked','spam','unsubscribed','invalid_email') then
    insert into wishlist_reminder_internal.suppression(user_id,reason) values(job.user_id,p_event) on conflict(user_id) do nothing;
  end if;
  if p_event='unsubscribed' then
    update public.wishlist_email_preferences set enabled=false,enabled_since=null,updated_at=clock_timestamp() where user_id=job.user_id;
    -- Provider opt-out is trusted, but its displayed wording/language is not
    -- our consent form. Do not fabricate a consent-text snapshot for it.
    insert into public.wishlist_email_consent_events(user_id,request_id,action,locale,consent_locale,correspondence_locale,wording_version,source)
      select job.user_id,md5(p_job_id::text||':brevo-unsubscribed')::uuid,'withdraw',job.locale,null,p.locale,p.wording_version,'email-unsubscribe'
      from public.wishlist_email_preferences p where p.user_id=job.user_id on conflict(user_id,request_id) do nothing;
  end if;
  return true;
end $$;
revoke execute on function public.record_wishlist_reminder_event(uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_wishlist_reminder_event(uuid,text,text) to service_role;
commit;
