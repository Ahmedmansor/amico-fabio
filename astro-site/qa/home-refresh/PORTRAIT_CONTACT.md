# Portrait depth, mobile CTA and floating contact — 2026-11-02

The owner requested stronger desktop hover/mobile portrait depth, a biography
button clear of the face, and a cohesive professional WhatsApp control with a
periodic shake on every device class. Existing words/images/contact URL remain.

Portrait now has a separate clipping/perspective viewport. On mobile it occupies
its own grid row below the copy/button, so 3D movement cannot cover the CTA.
Foreground depth is 110px desktop / 70px mobile, with opposing background shift,
stronger pointer rotations and a deeper visible-only mobile CSS drift. Mobile
portrait size was visually refined to 112% before perspective scaling. No
sensors, continuously running JS animation loop, dependencies or business logic.

WhatsApp uses one white/orange pill with its original contact text inside the
link. Only the icon performs a brief shake once per eight seconds. Text and hit
area stay still. The existing link/number, detail-page hiding and footer hiding
remain. Native dialog, consent, hidden-tab/footer and reduced-motion gates stop
the relevant animation; a small visibility listener has no timer. Existing
brand palette/fonts and 21st project design context are reused.

Verification: Astro check and static preview build logs are local ignored files.
The focused browser script captures the actual prior deployed home in both
languages at matching 375/430/820/1280 widths, then compares the new build.
It checks original copy/image/contact URL equality, mobile button separation,
stronger pointer/touch rotation and Z depth, running contact animation, fixed
label integration, dialog pause, reduced motion, overflow and page errors.
Screenshots remain ignored under screenshots/portrait-contact-*.

The first test exposed the CSS animation shorthand outranking the modal pause
selector; state selectors were corrected and the browser checks rerun. Initial
screenshots also prompted a larger mobile portrait within the isolated viewport.
Final actual outputs and deployment identity are recorded below once verified.

Final local output: Astro check 604 files, 0 errors/warnings/hints; static
noindex/demo build 171 pages, 70 editorial link/metadata checks and 50 JSON-LD
checks. `portrait-contact.mjs after`: all 9 cases passed against the 8 matching
deployed before cases. Phone/desktop screenshots inspected after the final
portrait size correction. These are Chromium viewport/touch checks, not a claim
of physical iPad/Safari testing. No external WhatsApp message or lead was sent.
`git diff --check` passed and explicit task files only were staged.

## Actual test deployment

Application b820fe16083642d051c591b242a09d00d30d7835 is Ready at existing test
project amico-fabio-test, deployment mhwk64c1v (20s build). Vercel inspect
confirmed public alias https://amico-fabio-iyzo.vercel.app . Both languages
returned 200/noindex/new markup. All nine focused portrait/contact cases passed
on that actual host, including the stronger touch/hover depth, CTA separation,
contact animation/dialog pause, preserved copy/link and reduced motion. See
portrait-contact-deployed.json and portrait-contact-deployment.json.
No hosting settings, production domain/main, catalog or campaign source changed.

The previously pending mobile-motion deployment verification also passed all
seven real-time cases on this source. Isolated deployed mobile Lighthouse:
performance 94, accessibility 100, LCP 2.705s, TBT 80ms, CLS 0; no failed
accessibility audits. One cold lab run, not a controlled regression comparison
or physical-device/field-INP guarantee. See portrait-contact-performance.json.
