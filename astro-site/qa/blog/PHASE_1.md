# Blog phase 1 — native Markdown pipeline proof

Date: 2026-10-28. Runtime: external Node v24.21.0; Astro 7.3.8;
@astrojs/markdown-satteri 0.4.3 (new exact direct dev declaration, previously
transitive); Sätteri 0.10.5. No new runtime/browser dependency.

## Result

Native Sätteri supports the required foundation. An isolated temporary Astro app
uses colocated PNG placeholders, glob metadata/schema validation, a metadata-first
index, supported renderMarkdown and final rendered-store entries. Native AST
transforms preserve image processing. No application routes/collections/config
are changed by the runner. Its generated project is removed in finally; the
scratch parent is Git-ignored.

Manual command from astro-site/:

```text
node scripts/blog/verify-pipeline.mjs
Exit code: 0
PASS: metadata-first two-pass collection rendering avoids a collection/render cycle.
PASS: colocated hero/body images produce real WebP, dimensions and responsive srcset.
PASS: escaped caption, link and exactly one CTA survive native AST transforms.
PASS: dev target keyword edit updates links in an unchanged source article.
PASS: dev draft change removes stale target links.
PASS: temporary project removed; no fixture route/content added to the application.
```

The sandbox blocked loopback fetch with EACCES; the successful run used permitted
local-network access. The test app does not read catalog/Auth environment files,
contact external services or send WhatsApp messages. This is rendered-output and
local HTTP verification, not visual UX acceptance.

## Decisions and limits

- Direct deferred-render module invalidation alone did not refresh unchanged
  source links reliably in the experiment. Keep that approach out of production.
- Final rendered entries must use a digest including derived HTML: Astro skips
  store.set() when an existing digest matches, even if supplied rendered HTML
  differs. A body-only digest preserves stale generated links.
- The verified approach uses Astro's own store updates/invalidation rather than
  manipulating Vite private caches. It rerenders the prototype collection when
  metadata changes. Production-scale scheduling/error handling/filtering belongs
  to later data-layer implementation.
- The prototype linker/CTA only proves pipeline compatibility. It is deliberately
  not the complete domain matching algorithm, no-image fallback or live form.
- No application fixture/article route, author/content publication, full SEO
  integration or production fixture guard is claimed implemented.

## Integration checks already run for the shared theme task

```text
npx astro check
Result (449 files): 0 errors, 0 warnings, 0 hints. Exit code: 0.

npm run build
Unmodified local configuration: failed the existing Auth email/Turnstile gate.

$env:PUBLIC_AUTH_PASSWORD_ENABLED='0'; npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
Verified canonical and reciprocal hreflang for 90 indexable pages.
99 page(s) built. Complete! Exit code: 0.
```

The build override was process-scoped only; no local env file or hosting setting
changed. Earlier sandbox network failure required permitted catalog-read access.
These are the theme task's results, not later blog integration verification.
Per the owner's subsequent instruction, no repeat whole-site build was run for
the isolated prototype; verification remained limited to the changed pipeline.
