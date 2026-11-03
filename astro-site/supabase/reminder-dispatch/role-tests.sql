-- DISPOSABLE PROPOSAL. No real send/provider configuration/Cron. ROLLBACK.
begin;
do $$ begin
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal)
    or exists(select 1 from wishlist_reminder_internal.jobs)
    or exists(select 1 from wishlist_reminder_internal.daily_budget)
    or exists(select 1 from wishlist_reminder_internal.cron_auth) then
    raise exception 'Use isolated pre-activation state; do not overwrite live jobs/control.';
  end if;
end $$;
create temporary table qa_dispatch(a uuid,b uuid,trip text) on commit drop;
insert into qa_dispatch values(gen_random_uuid(),gen_random_uuid(),(select id from public.trips where is_active order by id limit 1));
do $$ begin if exists(select 1 from qa_dispatch where trip is null) then raise exception 'Published fixture required.';end if;end $$;
grant select on qa_dispatch to service_role,authenticated;
create temporary table qa_claim(delivery_id uuid,user_id uuid,lease_id uuid,locale text,payload jsonb) on commit drop;
grant select,insert on qa_claim to service_role;
insert into auth.users(id) select a from qa_dispatch union all select b from qa_dispatch;
insert into public.profiles(user_id,locale) select a,'en' from qa_dispatch union all select b,'it' from qa_dispatch;
insert into wishlist_reminder_internal.cron_auth(id,token_hash,enabled,webhook_ready) values(1,repeat('a',64),true,true);
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from qa_dispatch),true);
insert into public.wishlists(user_id,trip_id) select a,trip from qa_dispatch;
reset role;
set local role service_role;
select public.change_wishlist_email_preference_v2(a,gen_random_uuid(),true,'en','en','wishlist-reminders-v1','wishlist-page') from qa_dispatch;
do $$ begin if exists(select 1 from public.claim_wishlist_reminders(1,120,(select array[a] from qa_dispatch))) then raise exception 'Sent before 24h.';end if;end $$;
reset role;
-- Trusted synthetic fixture timestamps only; real users/data never adjusted.
update public.wishlist_email_preferences set enabled_since=clock_timestamp()-interval '2 days' where user_id=(select a from qa_dispatch);
update wishlist_reminder_internal.activity set last_addition_at=clock_timestamp()-interval '2 days' where user_id=(select a from qa_dispatch);
set local role service_role;
insert into qa_claim select * from public.claim_wishlist_reminders(1,120,(select array[a] from qa_dispatch));
grant select on qa_claim to service_role;
do $$ declare claim record; begin
  select * into claim from qa_claim;
  if claim.delivery_id is null then raise exception 'Due reminder not claimed.';end if;
  if exists(select 1 from public.claim_wishlist_reminders(1,120,(select array[a] from qa_dispatch))) then raise exception 'Live lease claimed twice.';end if;
  if not public.seal_wishlist_reminder(claim.delivery_id,claim.lease_id,jsonb_build_object('deliveryId',claim.delivery_id,
    'recipient','synthetic@example.test','content',jsonb_build_object('subject','Test','htmlContent','<p>Test</p>','textContent','Test')),clock_timestamp()+interval '1 hour') then raise exception 'Seal failed.';end if;
  if public.begin_wishlist_reminder(claim.delivery_id,gen_random_uuid(),2,3) then raise exception 'Wrong lease allowed.';end if;
  if not public.begin_wishlist_reminder(claim.delivery_id,claim.lease_id,2,3) then raise exception 'Eligible send not admitted.';end if;
  if public.begin_wishlist_reminder(claim.delivery_id,claim.lease_id,2,3) then raise exception 'Attempt admitted twice.';end if;
  if not public.finish_wishlist_reminder(claim.delivery_id,claim.lease_id,'unknown',null,null,3) then raise exception 'Unknown not retained.';end if;
  if exists(select 1 from public.claim_wishlist_reminders(1,120,(select array[a] from qa_dispatch))) then raise exception 'Unknown automatically resent.';end if;
  if not public.record_wishlist_reminder_event(claim.delivery_id,'synthetic@example.test','request') then raise exception 'Late confirmation failed.';end if;
  perform public.record_wishlist_reminder_event(claim.delivery_id,'synthetic@example.test','request');
  if (select count(*) from wishlist_reminder_internal.provider_events where job_id=claim.delivery_id)<>1 then raise exception 'Provider replay duplicated event.';end if;
  perform public.record_wishlist_reminder_event(claim.delivery_id,'synthetic@example.test','delivered');
  perform public.record_wishlist_reminder_event(claim.delivery_id,'synthetic@example.test','unsubscribed');
  if not exists(select 1 from wishlist_reminder_internal.jobs where id=claim.delivery_id and status='accepted' and accepted_at is not null and delivered_at is not null and payload is null)
    then raise exception 'Acceptance/delivery/PII cleanup mismatch.';end if;
  if exists(select 1 from public.wishlist_email_preferences where user_id=claim.user_id and enabled) then raise exception 'Provider opt-out not applied.';end if;
  perform public.change_wishlist_email_preference_v2(claim.user_id,gen_random_uuid(),true,'en','en','wishlist-reminders-v1','wishlist-page');
  if exists(select 1 from public.claim_wishlist_reminders(1,120,(select array[a] from qa_dispatch))) then raise exception 'Consumed reminder requeued.';end if;
  if exists(select 1 from wishlist_reminder_internal.jobs where user_id=(select b from qa_dispatch)) then raise exception 'Account isolation failed.';end if;
end $$;
do $$ declare qa_id uuid:=gen_random_uuid(); identity uuid; result record; begin
  select a into identity from qa_dispatch;
  select * into result from public.claim_wishlist_summary_test(qa_id,identity,'it');
  if result.outcome<>'new' then raise exception 'QA first claim failed.';end if;
  select * into result from public.claim_wishlist_summary_test(qa_id,identity,'it');
  if result.outcome<>'unknown' then raise exception 'QA concurrent/ambiguous resend allowed.';end if;
  perform public.finish_wishlist_summary_test(qa_id,identity,'it','accepted','synthetic-qa@example.test');
  select * into result from public.claim_wishlist_summary_test(qa_id,identity,'it');
  if result.outcome<>'accepted' then raise exception 'QA acceptance not preserved.';end if;
  begin perform public.claim_wishlist_summary_test(qa_id,identity,'en');raise exception 'QA language rebound.';
    exception when invalid_parameter_value then null;end;
  if (select count(*) from wishlist_reminder_internal.jobs)<>1 then raise exception 'QA consumed real reminder allowance.';end if;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin perform public.claim_wishlist_reminders(1,120,(select array[a] from qa_dispatch));raise exception 'Browser claim allowed.';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'Dispatch assertions completed; no HTTP was made. ROLLBACK follows.' as verification;
rollback;
