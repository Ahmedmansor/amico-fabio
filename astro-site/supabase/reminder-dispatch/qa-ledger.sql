-- LOCAL PROPOSAL. Restricted QA only; never consumes the real reminder allowance.
begin;
create table wishlist_reminder_internal.summary_tests(
  id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null check(locale in ('it','en')),
  status text not null check(status in ('sending','accepted','unknown','retryable')),
  message_id text,created_at timestamptz not null default clock_timestamp()
);
alter table wishlist_reminder_internal.summary_tests enable row level security;
revoke all on wishlist_reminder_internal.summary_tests from public,anon,authenticated,service_role;
grant select,insert,update on wishlist_reminder_internal.summary_tests to service_role;
create function public.claim_wishlist_summary_test(p_job_id uuid,p_user_id uuid,p_locale text)
returns table(outcome text,message_id text) language plpgsql security invoker set search_path=''
as $$ declare existing wishlist_reminder_internal.summary_tests%rowtype;begin
  if p_job_id is null or p_user_id is null or p_locale is null or p_locale not in ('it','en') then raise exception 'Invalid QA command.' using errcode='22023';end if;
  insert into wishlist_reminder_internal.summary_tests(id,user_id,locale,status) values(p_job_id,p_user_id,p_locale,'sending') on conflict(id) do nothing;
  if found then return query select 'new'::text,null::text;return;end if;
  select * into existing from wishlist_reminder_internal.summary_tests t where t.id=p_job_id for update;
  if existing.user_id<>p_user_id or existing.locale<>p_locale then raise exception 'QA identity mismatch.' using errcode='22023';end if;
  if existing.status='retryable' then
    update wishlist_reminder_internal.summary_tests set status='sending' where id=p_job_id;
    return query select 'new'::text,null::text;
  else return query select case when existing.status='accepted' then 'accepted' else 'unknown' end,existing.message_id;end if;
end $$;
create function public.finish_wishlist_summary_test(p_job_id uuid,p_user_id uuid,p_locale text,p_status text,p_message_id text)
returns boolean language plpgsql security invoker set search_path=''
as $$ begin
  if p_status is null or p_status not in ('accepted','retryable','unknown')
    or(p_status='accepted' and(p_message_id is null or length(p_message_id) not between 1 and 512 or p_message_id~'[[:cntrl:]]')) then
    raise exception 'Invalid QA settlement.' using errcode='22023';end if;
  update wishlist_reminder_internal.summary_tests set status=p_status,message_id=p_message_id
    where id=p_job_id and user_id=p_user_id and locale=p_locale and status='sending';return found;
end $$;
revoke execute on function public.claim_wishlist_summary_test(uuid,uuid,text),public.finish_wishlist_summary_test(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_wishlist_summary_test(uuid,uuid,text),public.finish_wishlist_summary_test(uuid,uuid,text,text,text) to service_role;
commit;
