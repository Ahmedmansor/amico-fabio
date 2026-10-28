# Blog technical handoff — 2026-10-28

Implementation is complete locally on the existing migration branch. Legacy
source/main, hosting, public domain and remote database settings were unchanged.
No deployment or push occurred. The new blog uses data/domain/presentation,
static Astro, scoped Vanilla JS and the owner's centralized palette. Its
editorial visual direction was selected using ui-ux-pro-max, independently of
the older site shell. Other pages only gain a working localized Blog nav link.

Review: http://127.0.0.1:4327/it/blog/ and /en/blog/. The running dev server uses
guarded noindex fixture content. The production build excludes all fixtures and
currently contains only empty bilingual blog home pages until approved real
articles exist. Generated WebP illustrations are replaceable per ASSETS.md.

## Real grouped verification

Working implementation based on e4527b0, plus the final guard/accessibility fix.
All commands below ran from astro-site/ with external Node 24.21.0.

```
vitest run src/features/blog
Test Files 8 passed (8); Tests 72 passed (72)
node --test scripts/blog/check-links.test.mjs scripts/blog/new-post.test.mjs
tests 7; pass 7; fail 0
node --test src/features/blog/data/__tests__/guard.test.mjs
tests 4; pass 4; fail 0
npx astro check --tsconfig scripts/blog/tsconfig.json
Result (47 files): 0 errors; 0 warnings; 0 hints
```

The first sandboxed Astro sync could not reach the catalog after adding explicit
tour references; the permitted read-only network run above passed. No provider
fallback or remote write was used. The unrelated existing test suites were not
rerun, following the owner's latest focused-verification instruction.

One grouped noindex-fixture build, process-only Auth password flag disabled:

```
141 page(s) built in 12.44s
Verified canonical and reciprocal hreflang for 138 pages
Test flavor: all content is noindex; sitemap has no indexable URLs
Checked 200 generated text files; fixture artifact policy verified
Checked links and metadata structure on 42 blog pages
Complete! exit 0
```

One distinct normal-production-policy build (PUBLIC_NOINDEX empty,
BLOG_INCLUDE_FIXTURES=0, process-only Auth password flag disabled):

```
101 page(s) built in 10.78s
Verified canonical and reciprocal hreflang for 92 indexable pages
Checked 160 generated text files; fixture artifact policy verified
Checked links and metadata structure on 2 blog pages
Verified visible-content JSON-LD contract on 0 blog articles
Complete! exit 0
```

An initial production invocation used unsupported PUBLIC_NOINDEX=0 and stopped
at configuration validation; corrected to the documented empty value before the
successful build. Environment files/hosting settings were never edited. Build
logs remain local under ignored .astro/. This production build includes the
accessible-language-name correction and the structured-data guard integration.

The local Blog JSON-LD contract validator checked **20** built fixture article
graphs against visible title, description, author, dates, canonical, language,
actual optimized image file and ordered breadcrumbs. It is a named local
field-contract validator, not Google's Rich Results Test or a full schema.org
vocabulary validator. Search eligibility/inbox/indexing/GEO citation is not
claimed. The build now runs this contract automatically for real articles too.

The authoring reference command ran successfully through the validated snapshot
and public `getTrips()` interface, showing exact phrase/file owners, no approved
real authors and 22 published catalog trip IDs. It performs no catalog writes.

## Browser and measurement evidence

- Prior listing matrix: 12 IT/EN cases at 375/768/1280px, LISTING_COMPARISON.json.
- Prior article matrix: 9 long/short cases, ARTICLE_COMPARISON.json.
- Built-output recheck: IT mobile / EN desktop validation, review, intercepted
  encoded WhatsApp handoff, Escape/focus, cross-width draft and reload reset all
  passed. WHATSAPP_HANDOFF.json. No actual WhatsApp request/message was sent.
- Shared-header localized Blog/language links and explicit tour card title/image/
  route passed in IT/EN at 375/1280px. No horizontal overflow. No-JS form stays
  hidden and exposes a bare WhatsApp link. FINAL_BROWSER.json. Final targeted dev
  follow-up checks the language label correction and unobstructed card captures.
- Screenshots remain local/ignored in qa/blog/screenshots/; reports/scripts are
  committed. Cookie consent was dismissed with necessary-only for final captures.

Pinned Lighthouse **13.6.0** ran from npm cache against the static preview, using
mobile simulated throttling and 4x CPU slowdown. No project dependency was added.

| Page | Performance | Accessibility | SEO | CLS |
| --- | ---: | ---: | ---: | ---: |
| IT home | 97 | 100 | 69 | 0 |
| IT long Cairo fixture | 93 | 100 | 69 | 0.000128 |
| EN short fixture | 94 | 100 | 69 | 0.000010 |
| EN diving / tour fixture | 90 | 100 | 69 | 0.000073 |

PERFORMANCE.json contains the actual measurements/configuration. All scored SEO
audits other than intentional noindex passed. The >=95 SEO target cannot be
claimed for these noindex fixtures; production article Lighthouse/rich-results
checks remain an editorial release check once real approved content exists.
No adjusted or hypothetical SEO score is reported. Lighthouse also identified
an unscored visible-label/accessibility-name mismatch on IT/EN links: fixed by
prefixing the accessible name with the visible code. The measurements precede
that prefix-only correction; DOM/browser verification follows it. No costly
performance rerun was needed for that non-layout text-attribute correction.

## Owner's next steps

1. Review the new blog locally in IT/EN; the form prepares a conversation and the
   visitor sends it through WhatsApp. No Supabase/email/inquiry persistence exists.
2. Supply approved article text and author identity/type. Add the author registry
   entry; use AUTHORING.md's real `blog:new` command. No invented author default.
3. Replace generated assets via the stable paths/inventory in ASSETS.md; review
   rights/alt/captions and factual/native-language/legal copy before publication.
4. At a content release, validate content and review the static production
   artifact. Deployment remains outside this blog implementation authorization.

No outstanding technical access blocker remains. Real content/author approval,
production article measurements and external rich-results validation are the
explicit release dependencies, not claims already verified by fixture tests.
