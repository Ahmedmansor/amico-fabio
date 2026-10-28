-- UNEXECUTED disposable native-role test proposal. Review Auth triggers first.
-- Run after schema.sql in an approved isolated test database. No mail API calls.
-- Entire script is one transaction; never replace ROLLBACK with COMMIT.
begin;
set local lock_timeout='2s';
set local statement_timeout='15s';
do $$ begin
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal
    and tgname not in ('capture_account_marketing_signup','on_auth_user_created_onboarding')) then
    raise exception 'Review unexpected Auth triggers before disposable inserts';
  end if;
end $$;
create temporary table qa_marketing_ids(a uuid,b uuid,c uuid) on commit drop;
insert into qa_marketing_ids values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
grant select on qa_marketing_ids to authenticated,anon;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select a,'qa-'||a::text||'@example.invalid',null,'{"provider":"email"}'::jsonb,
  '{"marketing_consent":true,"marketing_notice_version":"favorites-offers-v1","site_locale":"it"}'::jsonb from qa_marketing_ids
union all select b,'qa-'||b::text||'@example.invalid',now(),'{}'::jsonb,'{}'::jsonb from qa_marketing_ids
union all select c,'qa-'||c::text||'@example.invalid',now(),'{}'::jsonb,'{}'::jsonb from qa_marketing_ids;

set local role anon;
do $$ begin
  begin perform public.read_account_marketing_consent((select a from qa_marketing_ids));raise exception 'Anonymous RPC allowed';
  exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select a::text from qa_marketing_ids),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select a from qa_marketing_ids),'role','authenticated')::text,true);
do $$ declare a uuid;b uuid;begin
  select q.a,q.b into a,b from qa_marketing_ids q;
  begin perform public.read_account_marketing_consent(b);raise exception 'Cross-account read allowed';exception when invalid_authorization_specification then null;end;
  begin perform public.set_account_marketing_consent(a,0,true,'it','favorites-offers-v1');raise exception 'Unverified grant allowed';exception when invalid_authorization_specification then null;end;
  begin perform public.activate_signup_marketing_intent(a);raise exception 'Unverified activation allowed';exception when invalid_authorization_specification then null;end;
  begin perform 1 from public.account_marketing_preferences;raise exception 'Direct table access allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.users set email_confirmed_at=now() where id=(select a from qa_marketing_ids);
-- Metadata edits on old/OAuth accounts must not create a captured signup grant.
update auth.users set raw_user_meta_data='{"marketing_consent":true,"marketing_notice_version":"favorites-offers-v1","site_locale":"en"}'::jsonb
where id=(select b from qa_marketing_ids);
set local role authenticated;
do $$ declare a uuid;b uuid;current_revision bigint;begin
  select q.a,q.b into a,b from qa_marketing_ids q;
  perform public.activate_signup_marketing_intent(a);
  if not (select p.marketing_consent from public.read_account_marketing_consent(a) p) then raise exception 'Verified signup not activated';end if;
  perform public.activate_signup_marketing_intent(a);
  if (select p.revision from public.read_account_marketing_consent(a) p)<>1 then raise exception 'Activation replay changed revision';end if;
  perform public.set_account_marketing_consent(a,1,false,'it','favorites-offers-v1');
  perform public.activate_signup_marketing_intent(a);
  if (select p.marketing_consent from public.read_account_marketing_consent(a) p) then raise exception 'Late activation undid withdrawal';end if;
  begin perform public.set_account_marketing_consent(a,1,true,'it','favorites-offers-v1');raise exception 'Stale revision allowed';exception when serialization_failure then null;end;
  perform public.set_account_marketing_consent(a,2,false,'it','favorites-offers-v1');
  if (select p.revision from public.read_account_marketing_consent(a) p)<>2 then raise exception 'Same-value save changed revision';end if;
end $$;
select set_config('request.jwt.claim.sub',(select b::text from qa_marketing_ids),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select b from qa_marketing_ids),'role','authenticated')::text,true);
do $$ declare b uuid;begin
  select q.b into b from qa_marketing_ids q;
  perform public.activate_signup_marketing_intent(b);
  if (select p.marketing_consent from public.read_account_marketing_consent(b) p) then raise exception 'Editable metadata granted consent';end if;
  perform public.set_account_marketing_consent(b,0,true,'en','favorites-offers-v1');
  if not (select p.marketing_consent from public.read_account_marketing_consent(b) p) then raise exception 'Verified explicit grant failed';end if;
end $$;
reset role;
do $$ begin
  if (select count(*) from account_marketing_private.consent_events where user_id=(select a from qa_marketing_ids))<>2 then raise exception 'Audit count mismatch';end if;
end $$;
rollback;
-- Concurrent opposite writes need a separately reviewed two-session fixture;
-- this single-session script is not concurrency evidence.
