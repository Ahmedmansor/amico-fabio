# Blog verification plan and evidence ledger

Status: phase 1 isolated pipeline checks passed; remaining feature cases below
are planned and unexecuted. See qa/blog/PHASE_1.md for exact scope/output.
Documentation scaffolding is not runtime verification.

## Evidence rules

- Record command, working directory, exact relevant output, exit code and tested
  revision. Do not call an unrun, mocked or older result a current pass.
- Latest owner instruction: focused tests for changed blog behavior; run broad
  Astro check/build at coherent integration milestones, not after every small
  change. Do not repeat unrelated feature checks without a concrete reason.
  Resolve failures in required scoped checks before committing the task.
- Preserve the existing npm test runner. Final QA includes the full suite plus
  the content/link/fixture scripts after they have been implemented.
- Negative cases pass only when the intended check rejects the intended problem
  with a useful diagnostic; a random build failure is not proof.
- Keep screenshots local and Git-ignored; commit scripts, sanitized JSON and
  textual reports. No personal form values/tokens in evidence or screenshots.

## Test matrix

| Area | Required cases | Evidence |
| --- | --- | --- |
| Domain publication | draft, fixture policy, future date, same captured clock | Unit tests and route output |
| Identity | distinct translated IDs; duplicate IDs/slugs; reserved slug; folder mismatch | Named-file diagnostics |
| Schema | missing title/alt, bad dates, bad interest, missing image/author/tour | Expected-rejection tests |
| Keyword claims | normalized case/whitespace collision; accents remain distinct | Error names both files/language |
| Related posts | nonempty shared city, shared interests, zero scores, self, ties, language | Deterministic unit results |
| Reading time | empty text, short text, boundary counts, markup handling | Domain/unit tests |
| Content pipeline | optimized images, dimensions, figures/captions, nested image, dev edit | Rendered HTML + changed-content rebuild |
| Temporary visuals | WebP validity, dimensions, stable source path, generated/temporary inventory and replacement | Decoded assets + inventory + post-replacement rebuild |
| Design direction | ui-ux-pro-max selected guidance, scoped fresh blog theme and shared behavior preserved | Recorded design decisions + responsive screenshots |
| CTA insertion | first body image; nested block; no-image second-H2 fallback; short post | Exactly zero/one correct CTA |
| Auto-links | first eligible match; longest overlap; one/target; cap five | Unit and rendered HTML assertions |
| Auto-link exclusions | heading, link, code/pre, caption, button, script/style, no-autolink, CTA | No generated anchors in excluded nodes |
| Link safety | self, manual target, hidden draft/future/fixture, language isolation | Positive and negative fixtures |
| Routes | 0/1/9/10/19 posts; page-one canonical; overflow; empty taxonomy | Generated route/file assertions |
| Translation | different slugs; missing translation; unequal listing pages | Existing reciprocal equivalents only |
| SEO | one H1/canonical, html lang, article OG, JSON-LD, image URLs, sitemap/robots | Output checker and named schema validator |
| Fixture safety | approved preview, normal production, forced opt-in, derived indexes | Production rejection and clean artifact |
| Related tour | valid/unknown/hidden ID, current language, first configured selection | Public data-access tests and HTML |
| Inquiry validation | required fields, invalid/past date, negative/fractional pax, optional note | Pure tests and localized UI errors |
| WhatsApp text | IT/EN, Unicode, apostrophes, newlines, &, %, #, clean article URL | Decode constructed URL and assert message |
| Handoff | review/cancel/confirm; popup fallback; preserve values | Browser checks without real send |
| Privacy/analytics | no storage/logging/PII event; analytics consent off/on | Sanitized intercept/event assertions |
| Author scaffold | bad locale/slug, duplicate folder, no overwrite, valid draft | Temporary-directory tests |

Future test inputs must be labeled placeholders, not asserted travel advice.
Use controlled fixtures instead of depending on remote catalog changes for pure
tests; exercise real build-time references through the normal build separately.

## Browser checklist

At 375, 768 and 1280px, in IT and EN where published:

- [ ] Blog home and populated listing: correct sections, cards and pagination.
- [ ] Long and short article: complete text, images, captions and related links.
- [ ] Desktop aside sticks without hiding fields or breaking the article column.
- [ ] Mobile aside is display:none; floating action does not cover footer/content.
- [ ] Dialog has accessible name, focus trap, Escape close and focus restoration.
- [ ] Review/cancel retains values; resizing between mounts preserves the draft.
- [ ] Labels/error associations/IDs are correct and unique across form instances.
- [ ] Existing cookie, wishlist and WhatsApp controls do not collide with new UI.
- [ ] Keyboard focus is visible; no horizontal overflow; tables scroll locally.
- [ ] Actual WhatsApp destination/message verified by interception or link inspect.
- [ ] No automated/real message sent and no UI claims that delivery occurred.
- [ ] Shared-header changes preserve existing mobile/desktop IT/EN navigation.

Do not claim successful WhatsApp sending based on opening a URL. The visitor
must send the prepared message themselves.

## Performance and structured data

Final measurements cover blog home and three representative fixture posts.
Targets: mobile Lighthouse Performance >=90, Accessibility >=95, SEO >=95,
CLS <0.1. Record tool/version, device profile, server/build context and numbers.
Measure rather than estimate; investigate misses and report remaining limitations.
Do not describe a fixture noindex SEO score as production indexing evidence.

Use a named structured-data validator and distinguish JSON syntax/schema checks
from rich-result eligibility. Preview remains noindex; production-mode artifact
validation can be performed locally without publishing or making it indexable.

## Future check integration

Content, link and fixture guard script names are proposals until implemented.
The guards must be connected to the applicable build path, not just listed here.
The link checker must account for current campaign routes and the bilingual 404;
do not impose blog-only assumptions on unrelated pages. Any discovered existing
issue gets its own explicit finding rather than a silent exemption.

## Per-phase report template

```text
Phase / task:
Date / revision tested:
Files and behavior changed:
Commands / working directory / exit codes:
Relevant real output:
Browser widths / locales / screenshot locations:
Negative case and expected rejection:
Known limitations or actual blockers:
Commit:
Next task:
```

## Current evidence

Preparation commits: 0e78f0a and cd152fa. Phase 1's isolated native-pipeline test
passed; it does not verify production blog functionality. Remaining browser and
feature cases are unexecuted. See qa/blog/PHASE_1.md and add later reports only
after their scoped checks actually run.
