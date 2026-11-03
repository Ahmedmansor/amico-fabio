-- NOT RUN. Separately approve disposable Auth rows; no emails/catalog changes.
begin;
do $$ begin
  if exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal) then
    raise exception 'Review custom Auth triggers before disposable fixtures.';
  end if;
end $$;
create temporary table qa_correspondence(user_id uuid,grant_id uuid,withdraw_id uuid) on commit drop;
insert into qa_correspondence values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into auth.users(id) select user_id from qa_correspondence;
insert into public.profiles(user_id,locale) select user_id,'en' from qa_correspondence;
grant select on qa_correspondence to service_role,authenticated,anon;
set local role service_role;
select public.change_wishlist_email_preference_v2(user_id,grant_id,true,'it','en','wishlist-reminders-v1','wishlist-page') from qa_correspondence;
do $$ begin
  if not exists(select 1 from public.wishlist_email_consent_events e
    join qa_correspondence f on e.user_id=f.user_id
    join public.wishlist_email_preferences p on p.user_id=e.user_id
    where e.request_id=f.grant_id and e.consent_locale='en' and e.correspondence_locale='it'
      and p.locale='it' and p.locale_source='explicit' and e.recorded_at=p.enabled_since
      and e.recorded_at=p.updated_at) then raise exception 'Consent snapshot mismatch.'; end if;
end $$;
select public.change_wishlist_email_preference_v2(user_id,withdraw_id,false,'en','it','wishlist-reminders-v1','wishlist-page') from qa_correspondence;
-- Lost grant acknowledgment replay must return current withdrawn state.
select public.change_wishlist_email_preference_v2(user_id,grant_id,true,'it','en','wishlist-reminders-v1','wishlist-page') from qa_correspondence;
do $$ begin
  if exists(select 1 from public.wishlist_email_preferences p join qa_correspondence f using(user_id)
    where p.enabled or p.locale<>'it') then raise exception 'Retry re-enabled or changed language.'; end if;
end $$;
select public.change_wishlist_email_preference_v2(user_id,gen_random_uuid(),true,'en','en','wishlist-reminders-v1','wishlist-page') from qa_correspondence;
do $$ begin
  if exists(select 1 from public.wishlist_email_preferences p join qa_correspondence f using(user_id)
    where not p.enabled or p.locale<>'it') then raise exception 'Re-enable changed correspondence.'; end if;
  if (select count(*) from public.wishlist_email_consent_events e join qa_correspondence f using(user_id))<>3
    then raise exception 'Duplicate event or missing audit.'; end if;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform public.change_wishlist_email_preference_v2(user_id,gen_random_uuid(),true,'it','it','wishlist-reminders-v1','wishlist-page') from qa_correspondence;
    raise exception 'Browser RPC allowed.';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'Proposed role assertions reached; rollback follows.' as proposed_result;
rollback;
