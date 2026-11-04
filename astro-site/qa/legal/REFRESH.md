# Legal page visual refresh — 2026-11-03

Owner authorized a clean legal-page redesign consistent with the site's theme.
Reference URL http://127.0.0.1:4346/en/legal/ returned 200, and the updated layout
was verified there after the build. No production or test-host deployment.

The navy/orange legacy cards, repeated unscoped CSS and floating index have been
replaced with existing theme-aware surface, text, border and accent roles.
Montserrat body / Playfair headings, restrained cards, 72ch reading measure,
sticky desktop summary and native mobile disclosure reuse the site's visual
language. The mobile TOC works without JS; enhancement closes it after native
fragment activation and repositions the target clear of the sticky header.
Headings now use h1/h2, decorative icons have empty alt, focus remains visible.

21st contextual search succeeded with CLI @21st-dev/cli@1.17.1:
`search "legal policy table of contents" --context auto`.
Reference: https://21st.dev/@mohammadshehadeh/components/toc . Existing Astro/native
primitives were appropriate; no React, component installation or new dependency.
UI UX Pro Max line-length guidance informed the readable column width.
The design decision is recorded in .21st/design.json.

Automatic approval review rejected `21st review .../LegalPage.astro --json`
because it might upload local source to an external service. It was not retried
or bypassed. Manual source review and local screenshot/runtime checks were used;
the remote 21st source-review command is not reported as passing.

Actual implementation checks (Node v24.21.0):

```text
npx astro check
Result (737 files): 0 errors, 0 warnings, 0 hints
npm run build
572 page(s) built in 30.09s; Complete!
Verified canonical and reciprocal hreflang for 230 indexable pages.
QA_PHASE=before QA_ORIGIN=http://127.0.0.1:4346 node qa/legal/refresh.mjs
20 legal cases passed
QA_PHASE=after node qa/legal/refresh.mjs
20 legal cases passed
```

Existing legal domain tests also passed: `node --test
src/features/legal/domain/__tests__/legal.test.mjs` — 10 tests, 10 passed, 0 failed.

Both phases use actual WebKit at matching 390px/1280px viewports in IT/EN/ES/PT/DE
and light/dark. After checks compare every section ID, heading, paragraph/list
item, data chip and icon source against the baseline; no missing/wrong content.
Each checks section navigation and mobile disclosure dismissal, readable text
contrast >=4.5, one h1 with h2 sections, and no horizontal overflow. Full English
pages and matching first-view screenshots were visually inspected. Screenshots
stay local/ignored in qa/legal/screenshots/refresh-before/ and refresh-after/.
Machine evidence: refresh-before.json and refresh-after.json.

Content dictionaries remain untouched. The technical wording discrepancies found
by reading all sections are documented separately in CONTENT_REVIEW_AR.md; visual
completion is not a claim that those outdated statements have been corrected.
