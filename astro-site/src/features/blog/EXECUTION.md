# Blog execution checklist

Status: ready for later implementation; implementation has not started.
Updated: 2026-10-28. Owner instruction: prepare structure and planning files only.

Read README.md, PLAN.md, DECISIONS.md and applicable repository instructions first.
An unchecked task is pending, not a claim of functionality. This checklist
expands PLAN.md's phase numbers; keep those numbers stable in future reports.

## Before the first implementation task

- [ ] Receive the owner's subsequent instruction to start implementation.
- [ ] Confirm the migration branch, inspect working-tree changes and preserve
      unrelated work. Never switch to main.
- [ ] Activate the existing external pinned Node runtime per project setup;
      confirm installed Astro/package versions without changing them.
- [ ] Recheck the documented APIs relevant to the phase being implemented.
- [ ] Identify exact task files and acceptance evidence before editing.

Do not install dependencies, run builds, add content, register collections or
change shared behavior as part of this preparation-only task.

## Phase 0 — Planning package

- [x] Record the self-contained feature plan and WhatsApp-only scope.
- [x] Add README, authoring guide, decisions, QA plan and this checklist.
- [x] Prepare empty data/domain/presentation directories with Git placeholders.
- [ ] Carry the completed preparation commit into the first implementation report.

Checked items above describe documentation/scaffolding only. They do not mark
any runtime phase complete.

## Phase 1 — Prove Astro 7 content processing

- [ ] Inspect supported native processor hooks and collection/render timing.
- [ ] Build an isolated technical test with colocated Markdown and local images.
- [ ] Prove figure/caption, one link transform and one CTA insertion preserve
      optimization, dimensions and valid HTML.
- [ ] Prove changed content invalidates the derived link information in dev.
- [ ] Keep temporary prototype inputs outside published content/routes or behind
      a verified guard; do not leave an unguarded fixture route in this commit.
- [ ] Record H01/H02 results in DECISIONS.md; justify any needed dependency.
- [ ] Run focused checks plus Astro check/build; review diff and commit.

**Done when:** the supported rendering approach has real output evidence and
does not require guessing about image transforms or circular content loading.

## Phase 2 — Pure domain foundation

- [ ] Define article/version IDs, taxonomy, publication context and inquiry types.
- [ ] Implement publication filtering with explicit time/policy arguments.
- [ ] Implement translation resolution, reading time and active taxonomy.
- [ ] Implement related scoring and deterministic tie-breaks.
- [ ] Test identity, filtering/time boundaries, language isolation and empty sets.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** pure rules have meaningful tests and no environment/Astro/data/DOM
dependency enters domain. Inquiry behavior is implemented in phase 10.

## Phase 3 — Collection and data layer

- [ ] Register the collection through the feature-owned schema and supported glob.
- [ ] Map directory, article ID and slug separately; validate folder language.
- [ ] Implement content reading and one validated publication index.
- [ ] Add metadata, date, taxonomy, image, author and duplicate checks.
- [ ] Add keyword-claim diagnostics with both file names and normalized phrase.
- [ ] Provide the content-check entry point without replacing existing tests.
- [ ] Test intended invalid inputs in isolation with expected error messages.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** pages/plugins can obtain consistent validated models and bad
inputs fail with useful record/field information.

## Phase 4 — Fixtures and production guards

- [ ] Add visibly artificial, colocated test articles/images covering QA.md.
- [ ] Include translated/untranslated, long/short, draft/future and pagination cases.
- [ ] Implement dev/approved-noindex-preview opt-in and production refusal.
- [ ] Connect output guards to the build path and scan derived public outputs.
- [ ] Prove forced opt-in is rejected in production and normal output is clean.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** test articles can be reviewed safely and cannot enter a production
artifact through a forgotten environment flag.

## Phase 5 — Index and taxonomy pages

- [ ] Before introducing asymmetric routes, land the minimal tested shared
      alternate-path/SEO-validation support needed for them (a prerequisite
      slice of phase 8). Preserve existing-route assertions. Never leave this
      until phase 8 if it would make the required phase 5/6 build fail; record
      the earlier slice in both phase reports. Full metadata QA remains phase 8.
- [ ] Build reusable cards, featured selection and localized empty states.
- [ ] Add home sections, hide empty taxonomy/fact sections and use reviewed copy.
- [ ] Generate home/city/interest routes with nine-item pagination.
- [ ] Ensure page one has one URL; omit empty and overflow pages.
- [ ] Capture 375/768/1280px IT/EN screenshots and inspect generated routes.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** listing routes render full static content using the shared shell.
Do not activate placeholder Blog navigation before valid routes exist.

## Phase 6 — Article layout and inquiry entry points

- [ ] Build breadcrumbs/chips/byline/hero/body/related-article composition.
- [ ] Add verified figure/caption and inline CTA insertion transforms.
- [ ] Implement sticky desktop aside and mobile action/dialog with focus handling.
- [ ] Keep inquiry controls explicitly preparatory until phase 10; no fake submit.
- [ ] Check short/no-image/nested-image cases and existing floating-control overlap.
- [ ] Capture all three widths; run keyboard/dialog walkthroughs.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** article structure/CTAs/dialog work and no placeholder claims a
request was sent. Keep any incomplete form state clearly nonfunctional.

## Phase 7 — Internal linking and output checks

- [ ] Implement normalized longest-first keyword selection and exclusion rules.
- [ ] Apply automatic linking to eligible article AST nodes only.
- [ ] Respect manual target links, self-exclusion, one/target and five-link cap.
- [ ] Build internal-path/fragment/language/alt/heading checks with correct scope.
- [ ] Prove both valid output and intentional broken-link/language-leak rejection.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** all QA.md link cases have rendered-output evidence, not just pure
algorithm tests.

## Phase 8 — Shared navigation and SEO integration

- [ ] Forward page-specific navigation and head alternate maps separately.
- [ ] Extend the existing SEO generator/validator for actual translated routes.
- [ ] Add article OG/social/JSON-LD and accurate author/date metadata.
- [ ] Verify unpaired articles and unequal paginated listings without fake hreflang.
- [ ] Activate the existing Blog nav item once routes are ready and verified.
- [ ] Regression-check current shared-shell routes and noindex behavior.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** one sitemap/head system describes real pages and shared navigation
preserves existing site behavior. Real author details may block only publication
of real articles; fixtures must remain visibly artificial.

## Phase 9 — Related tour references

- [ ] Resolve explicit stable trip IDs through getTrips(), respecting visibility.
- [ ] Select the first eligible configured tour deterministically.
- [ ] Render approved locale title/image/link; do not calculate article prices.
- [ ] Reject unknown references and test hidden/missing-locale cases explicitly.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** references are validated through the owning feature's public
data interface and cards lead to the proper booking page.

## Phase 10 — WhatsApp inquiry

- [ ] Implement pure validation and localized message generation from PLAN.md.
- [ ] Reuse approved country/label data through an acyclic shared/public interface.
- [ ] Add unique labeled form IDs, localized errors and in-memory draft continuity.
- [ ] Add review/cancel/confirm flow and clean article context in the message.
- [ ] Open the encoded shared-number link from an explicit user action, with
      usable fallback; never add a request-received or delivered success state.
- [ ] Add consent-gated shared analytics without personal values.
- [ ] Test text/encoding and intercept navigation without sending a real message.
- [ ] Capture both mount points/all widths; run focused tests and Astro check/build.
- [ ] Review diff and commit.

**Done when:** the visitor can review a valid inquiry and open WhatsApp to send it
themselves. No Supabase, persistence, email or backend acceptance exists here.

## Phase 11 — Authoring tools

- [ ] Implement the safe local draft scaffold and reference/keyword report.
- [ ] Test invalid names/locales and existing-directory refusal using temp inputs.
- [ ] Replace proposed command descriptions in AUTHORING.md with actual syntax.
- [ ] Check the template against the implemented schema and route rules.
- [ ] Run focused tests plus Astro check/build; review diff and commit.

**Done when:** the owner can prepare a new draft without guessing metadata paths
or overwriting an existing article.

## Phase 12 — Final QA and handoff

- [ ] Run the full existing test suite and implemented content/link/fixture guards.
- [ ] Run Astro check and final static build; record actual outputs.
- [ ] Complete QA.md browser/translation/negative-test matrix.
- [ ] Measure performance/CLS and validate structured data with named tools.
- [ ] Record outstanding editorial inputs and specific limitations honestly.
- [ ] Produce final report and focused commit for any final fixes/evidence.

**Done when:** acceptance is backed by the tested revision and remaining real
publication dependencies are explicit. A deploy/push is a separate applicable
scope decision; do not alter hosting during preparation or inherit Auth-only
deployment authorization.

## Progress reporting

After each future completed task, report in Egyptian Arabic:

1. What changed and why.
2. Files and real check results.
3. Exact local route/artifact to inspect, when available.
4. Commit hash and any actual blocker.
5. Next numbered task and its acceptance criterion.

Do not send a checklist that implies unchecked implementation is finished.
Routine choices within later authorized implementation do not need repeated
permission; the current preparation-only boundary remains in force.
