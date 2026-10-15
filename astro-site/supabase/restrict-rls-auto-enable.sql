-- Authorized function-grant follow-up, 2026-10-15.
-- Keep the existing owner, SECURITY DEFINER body and ensure_rls event trigger.
-- No global default privileges or catalog-table permissions are changed.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;

DO $verify$
BEGIN
  IF has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') THEN
    RAISE EXCEPTION 'rls_auto_enable: public API roles still have EXECUTE';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_event_trigger
    WHERE evtname = 'ensure_rls'
      AND evtfoid = 'public.rls_auto_enable()'::regprocedure
      AND evtevent = 'ddl_command_end' AND evtenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'rls_auto_enable: expected enabled event trigger is missing';
  END IF;
END;
$verify$;
