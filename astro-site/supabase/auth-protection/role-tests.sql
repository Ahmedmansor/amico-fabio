-- Local proposal. Run only after explicit authorization, on a reviewed isolated test DB.
-- ROLLBACK also restores pre-existing counters/ledger. No Auth users or external mail.
begin;
select pg_advisory_xact_lock(72610,1);
delete from public.auth_email_deliveries;
delete from public.auth_email_rate_limits;
delete from public.auth_global_rate_limits;
insert into public.disposable_email_domains(domain) values('runtime-blocked.example') on conflict do nothing;

set local role anon;
do $$ begin
  begin perform public.reserve_auth_email('a@libero.it',repeat('a',64),30,100,5,60); raise exception 'anon reserve allowed'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.auth_email_deliveries; raise exception 'anon ledger read allowed'; exception when insufficient_privilege then null; end;
end $$;

reset role;
set local role authenticated;
do $$ begin
  begin perform public.reserve_auth_email('a@libero.it',repeat('a',64),30,100,5,60); raise exception 'client reserve allowed'; exception when insufficient_privilege then null; end;
  begin perform public.finish_auth_email(repeat('a',64),gen_random_uuid(),'accepted','id'); raise exception 'client finish allowed'; exception when insufficient_privilege then null; end;
  begin perform public.hook_before_user_created('{"user":{"email":"a@libero.it"}}'); raise exception 'client hook allowed'; exception when insufficient_privilege then null; end;
  begin update public.auth_email_deliveries set state='accepted'; raise exception 'client ledger write allowed'; exception when insufficient_privilege then null; end;
end $$;

reset role;
set local role service_role;
do $$ declare v jsonb; v_attempt uuid; begin
  if public.reserve_auth_email('a@runtime-blocked.example',repeat('b',64),30,100,5,60)->>'outcome' <> 'blocked' then raise exception 'runtime catalog bypass'; end if;
  if public.reserve_auth_email('a@libero.it',repeat('b',64),30,null,5,60)->>'outcome' <> 'blocked' then raise exception 'missing daily allowed'; end if;
  v := public.reserve_auth_email('a@libero.it',repeat('a',64),30,100,5,60);
  if v->>'outcome' <> 'send' then raise exception 'first send denied'; end if;
  v_attempt := (v->>'attemptId')::uuid;
  if public.reserve_auth_email('a@libero.it',repeat('a',64),30,100,5,60)->>'outcome' <> 'uncertain' then raise exception 'in-flight replay sent'; end if;
  if public.finish_auth_email(repeat('a',64),gen_random_uuid(),'accepted','id') then raise exception 'wrong attempt settled'; end if;
  if not public.finish_auth_email(repeat('a',64),v_attempt,'accepted','synthetic') then raise exception 'settlement failed'; end if;
  if public.reserve_auth_email('a@libero.it',repeat('a',64),30,100,5,60)->>'outcome' <> 'accepted' then raise exception 'accepted replay sent'; end if;
  if public.reserve_auth_email('a@libero.it',repeat('c',64),30,100,5,60)->>'outcome' <> 'blocked' then raise exception 'cooldown bypass'; end if;
end $$;

reset role;
do $$ begin
  if (select send_count from public.auth_global_rate_limits where bucket='auth_day') <> 1 then raise exception 'rejected request consumed day quota'; end if;
  if (select send_count from public.auth_global_rate_limits where bucket='auth_hour') <> 1 then raise exception 'rejected request consumed hour quota'; end if;
end $$;

-- Daily capacity must still hold when the hourly window rolls over.
update public.auth_global_rate_limits set window_start=now()-interval '2 hours' where bucket='auth_hour';
set local role service_role;
do $$ declare v jsonb; begin
  if public.reserve_auth_email('b@virgilio.it',repeat('d',64),30,1,5,60)->>'outcome' <> 'blocked' then raise exception 'daily ceiling bypass'; end if;
  v := public.reserve_auth_email('b@virgilio.it',repeat('d',64),30,100,5,60);
  if v->>'outcome' <> 'send' then raise exception 'new hourly window blocked'; end if;
  if not public.finish_auth_email(repeat('d',64),(v->>'attemptId')::uuid,'unknown') then raise exception 'unknown settlement failed'; end if;
  if public.reserve_auth_email('b@virgilio.it',repeat('d',64),30,100,5,60)->>'outcome' <> 'uncertain' then raise exception 'unknown delivery replayed'; end if;
end $$;

reset role;
-- Explicit 429 may retry after cooldown; uncertain states never expire into a resend.
insert into public.auth_email_deliveries(delivery_key,attempt_id,state,updated_at)
  values(repeat('e',64),gen_random_uuid(),'retryable',now()-interval '2 minutes');
set local role service_role;
do $$ declare v jsonb; begin
  v := public.reserve_auth_email('c@private-brand.example',repeat('e',64),30,100,5,60);
  if v->>'outcome' <> 'send' then raise exception 'explicit rejection cannot retry'; end if;
  if not public.finish_auth_email(repeat('e',64),(v->>'attemptId')::uuid,'accepted','retry-id') then raise exception 'retry finish failed'; end if;
end $$;

reset role;
rollback;
-- Concurrency gate (separate sessions on an isolated test DB): submit simultaneous
-- reserve_auth_email calls with the same fresh delivery key. Exactly one may return
-- send; the other returns uncertain (or accepted after settlement). A single-session
-- transaction cannot prove concurrency. Record both real session outputs before activation.
