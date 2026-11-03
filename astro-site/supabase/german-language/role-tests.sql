-- Disposable language/consent regression only. No sending API or recipient changes.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal
    AND tgname NOT IN ('capture_account_marketing_signup','on_auth_user_created_onboarding')) THEN
    RAISE EXCEPTION 'Review unexpected Auth triggers before disposable inserts';
  END IF;
END $$;
CREATE TEMPORARY TABLE qa_site_languages(a uuid,b uuid) ON COMMIT DROP;
INSERT INTO qa_site_languages VALUES(gen_random_uuid(),gen_random_uuid());
GRANT SELECT ON qa_site_languages TO service_role,authenticated,anon;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
SELECT a,'qa-i18n-'||a::text||'@example.invalid',NULL,'{"provider":"email"}'::jsonb,
  '{"marketing_consent":true,"marketing_notice_version":"favorites-offers-v1","site_locale":"de"}'::jsonb FROM qa_site_languages
UNION ALL SELECT b,'qa-i18n-'||b::text||'@example.invalid',now(),'{}'::jsonb,'{}'::jsonb FROM qa_site_languages;
INSERT INTO public.profiles(user_id,locale) SELECT a,'it' FROM qa_site_languages UNION ALL SELECT b,'pt' FROM qa_site_languages;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM account_marketing_private.signup_intents WHERE user_id=(SELECT a FROM qa_site_languages) AND locale='de')
    OR EXISTS(SELECT 1 FROM public.account_marketing_preferences WHERE user_id=(SELECT a FROM qa_site_languages)) THEN
    RAISE EXCEPTION 'DE signup intention was lost or treated as verified consent';
  END IF;
END $$;
SET LOCAL ROLE service_role;
DO $$ DECLARE f record;r record;start_time timestamptz;updated_time timestamptz;audit_count bigint;BEGIN
  SELECT * INTO f FROM qa_site_languages;
  SELECT * INTO r FROM public.change_account_locale(f.a,gen_random_uuid(),0,'site','de');
  IF r.outcome<>'applied' OR r.site_locale<>'de' OR r.email_locale IS NOT NULL THEN RAISE EXCEPTION 'DE account change failed or granted consent';END IF;
  SELECT * INTO r FROM public.change_account_locale(f.a,gen_random_uuid(),1,'site','fr');
  IF r.outcome<>'invalid-input' THEN RAISE EXCEPTION 'Unsupported locale accepted';END IF;
  PERFORM public.change_wishlist_email_preference_v2(f.a,gen_random_uuid(),true,'de','de','wishlist-reminders-v1','wishlist-page');
  SELECT enabled_since,updated_at INTO start_time,updated_time FROM public.wishlist_email_preferences WHERE user_id=f.a;
  SELECT count(*) INTO audit_count FROM public.wishlist_email_consent_events WHERE user_id=f.a;
  SELECT * INTO r FROM public.change_account_locale(f.a,gen_random_uuid(),1,'site','pt');
  IF r.outcome<>'applied' OR r.site_locale<>'pt' OR r.email_locale<>'pt' OR r.revision<>2 THEN RAISE EXCEPTION 'PT site/email language failed';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.wishlist_email_preferences WHERE user_id=f.a AND enabled AND enabled_since=start_time AND updated_at=updated_time)
    OR (SELECT count(*) FROM public.wishlist_email_consent_events WHERE user_id=f.a)<>audit_count THEN RAISE EXCEPTION 'Language change altered consent/timing';END IF;
  SELECT * INTO r FROM public.change_account_locale(f.a,gen_random_uuid(),1,'site','de');
  IF r.outcome<>'conflict' OR r.revision<>2 THEN RAISE EXCEPTION 'Stale language overwrote PT';END IF;
  PERFORM public.change_wishlist_email_preference_v2(f.a,gen_random_uuid(),false,'pt','de','wishlist-reminders-v1','wishlist-page');
  SELECT * INTO r FROM public.change_account_locale(f.a,gen_random_uuid(),2,'site','de');
  IF r.outcome<>'applied' OR r.email_locale<>'de' OR EXISTS(SELECT 1 FROM public.wishlist_email_preferences WHERE user_id=f.a AND (enabled OR enabled_since IS NOT NULL)) THEN
    RAISE EXCEPTION 'Language update re-enabled withdrawn reminder';END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.change_account_locale((SELECT a FROM qa_site_languages),gen_random_uuid(),3,'site','pt');RAISE EXCEPTION 'Anonymous locale RPC allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;END;
  BEGIN PERFORM public.set_account_marketing_consent((SELECT a FROM qa_site_languages),0,true,'pt','favorites-offers-v1');RAISE EXCEPTION 'Anonymous marketing RPC allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT a::text FROM qa_site_languages),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',(SELECT a FROM qa_site_languages),'role','authenticated')::text,true);
DO $$ BEGIN
  BEGIN PERFORM public.set_account_marketing_consent((SELECT a FROM qa_site_languages),0,true,'pt','favorites-offers-v1');RAISE EXCEPTION 'Unverified actor granted marketing';
  EXCEPTION WHEN invalid_authorization_specification THEN NULL;END;
END $$;
RESET ROLE;
UPDATE auth.users SET email_confirmed_at=now() WHERE id=(SELECT a FROM qa_site_languages);
SET LOCAL ROLE authenticated;
DO $$ DECLARE f record;r record;BEGIN
  SELECT * INTO f FROM qa_site_languages;
  PERFORM public.activate_signup_marketing_intent(f.a);
  SELECT * INTO r FROM public.read_account_marketing_consent(f.a);
  IF NOT r.marketing_consent OR NOT r.verified THEN RAISE EXCEPTION 'Verified DE signup activation failed';END IF;
  PERFORM public.set_account_marketing_consent(f.a,r.revision,false,'pt','favorites-offers-v1');
  PERFORM public.activate_signup_marketing_intent(f.a);
  SELECT * INTO r FROM public.read_account_marketing_consent(f.a);
  IF r.marketing_consent THEN RAISE EXCEPTION 'Late activation restored withdrawn marketing';END IF;
  BEGIN PERFORM public.set_account_marketing_consent(f.b,0,true,'de','favorites-offers-v1');RAISE EXCEPTION 'Cross-account write allowed';
  EXCEPTION WHEN invalid_authorization_specification THEN NULL;END;
END $$;
RESET ROLE;
DO $$ BEGIN
  BEGIN UPDATE public.profiles SET locale='fr' WHERE user_id=(SELECT b FROM qa_site_languages);RAISE EXCEPTION 'Unsupported profile language accepted';
  EXCEPTION WHEN check_violation THEN NULL;END;
  IF EXISTS(SELECT 1 FROM wishlist_reminder_internal.jobs WHERE user_id IN (SELECT a FROM qa_site_languages UNION SELECT b FROM qa_site_languages)) THEN
    RAISE EXCEPTION 'Language regression test created a reminder job';END IF;
END $$;
ROLLBACK;
SELECT 'DE/PT locale, stale update, consent timing, withdrawal, verified signup and role isolation assertions passed; ROLLBACK completed.' AS result;
