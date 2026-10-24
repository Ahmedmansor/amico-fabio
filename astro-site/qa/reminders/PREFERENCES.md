# Reminder consent/backend preparation — 2026-10-24

Local implementation only. No website opt-in, deployed endpoint, Cron, new
remote tables, real consent record or email has been activated by this task.

## Prepared source

- Pure preference commands: explicit boolean, language, current displayed
  wording version and retry request ID. Recipient/user/audit injection rejected.
  Withdrawal stays possible from stale pages. Signup/favorites never imply consent.
- Backend repository/service: owner-bound reads and one atomic preference RPC,
  neutral errors, strict provider mapping, bounded data requests. An absent row
  is returned as absent without creating a subscription. The client is injected;
  no backend key is read from files or browser config.
- Auth adapter uses remote getUser, not a locally decoded JWT or user metadata.
  HTTP boundary binds identity from this verifier, handles explicit CORS,
  noncached private responses, method/content-type/size checks and error statuses.
  It is portable source, not an Astro route or a deployed Edge Function.
- Pure schedule: approved latest-addition/consent +24h, exact due boundary,
  duplicate saves and repeated opt-in do not reset, newest-item removal cannot
  move time backward, empty-list cancellation/refill, withdrawal and no recurring
  reminder after provider acceptance (including a late send response).

## Database gate

Review ../../supabase/reminder-preferences/schema.sql, README.md, verify.sql
and role-tests.sql. Proposal: two RLS-enabled tables without browser grants,
service-only SECURITY INVOKER atomic RPC, append-only grant/withdrawal audit,
server-only timestamps, stable enabled_since and idempotent request binding.
The SQL/role fixtures have not been executed or parsed by a PostgreSQL engine.
Local tests exercise injected clients; they do not establish real RLS success.

Read-only remote preflight found both proposed tables absent and RPC absent;
Auth has no noninternal user triggers and id is its only required column
without a default. No customer rows or credentials were read.

Before activation: separately authorize schema and disposable tests, then
verify them on PostgreSQL; prepare the actual Edge Function entry/runtime,
trusted secret storage, network deadlines and rate limits; implement verified
unsubscribe tokens and queue/suppression integration; deploy only with explicit
approval. Source HTTP tests are not proof of live service security or delivery.

Actual checks: npm test — 143 Node tests passed, 0 failed; 15 Vitest files /
140 tests passed. npx astro check — 275 files, 0 errors/warnings/hints. Static
build — 94 pages in 5.37s, Complete. Prepared backend preference names are absent
from generated browser HTML/JS; no browser imports or new direct dependencies.
These outputs do not validate PostgreSQL syntax, grants or live HTTP integration.
