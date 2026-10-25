-- LOCAL REVIEW ONLY. SEPARATE ACTIVATION: schedules real sends when enabled.
-- Requires pg_cron, pg_net and vault, reviewed daily budget/recipient allowlist,
-- deployed enabled worker and verified management + webhook. No key is printed.
begin;
do $$ declare scoped_token text; begin
  if exists(select 1 from cron.job where jobname='fabio-wishlist-reminders')
    or exists(select 1 from vault.secrets where name='fabio_reminder_cron') then
    raise exception 'Existing reminder schedule/token: review instead of duplicating.';
  end if;
  scoped_token=encode(extensions.gen_random_bytes(32),'hex');
  perform vault.create_secret(scoped_token,'fabio_reminder_cron','Fixed reminder worker/bootstrap only; no account/data access.');
  insert into wishlist_reminder_internal.cron_auth(id,token_hash,enabled)
    values(1,encode(sha256(convert_to(scoped_token,'UTF8')),'hex'),true);
end $$;
-- Only the fixed authenticated bootstrap may configure this exact callback.
-- begin refuses delivery until that bootstrap confirms the callback is ready.
select net.http_post(
  url:='https://iiivnvwspoikfrlclhyr.supabase.co/functions/v1/wishlist-reminder-dispatch/configure-webhook',
  headers:=jsonb_build_object('Content-Type','application/json','x-fabio-reminder-token',
    (select decrypted_secret from vault.decrypted_secrets where name='fabio_reminder_cron')),
  body:='{}'::jsonb
);
select cron.schedule('fabio-wishlist-reminders','*/15 * * * *',$job$
  select net.http_post(
    url:='https://iiivnvwspoikfrlclhyr.supabase.co/functions/v1/wishlist-reminder-dispatch',
    headers:=jsonb_build_object('Content-Type','application/json','x-fabio-reminder-token',
      (select decrypted_secret from vault.decrypted_secrets where name='fabio_reminder_cron')),
    body:='{}'::jsonb
  );
$job$);
commit;
