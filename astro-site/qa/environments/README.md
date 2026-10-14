# Independent test and production origins

Canonical and hreflang identify the intended production content at
`https://fabioegypt.com`. Social page URLs and image URLs now identify the actual
environment instead of assuming production files are already deployed.

For noindex builds, Astro uses Vercel's build-time VERCEL_URL automatically.
Optional PUBLIC_SITE_URL selects a stable test alias or a local preview origin.
Missing test origin and test origins pointing to production fail before build.
Production always uses the shared production origin, ignoring test overrides.
The resolved origin is injected as a public build constant; no credentials or
environment secrets are exposed. A new deployment is required for existing
Vercel HTML to pick up these changes. No account/protection setting was changed.

`test.json` verifies a local build using the user-provided Vercel hostname;
it is not evidence that this new commit is already published there.
`production.json` verifies the normal build, which was restored last. Both check
every content page, local navigation/resources, Open Graph/Twitter page and image
origins, canonical/robots policy and the English home title. Test canonicals are
the only intentional links to production; UI files do not require the old site.
All 72 tour/package poster associations were also checked in the test build.

The approved English home title is now:
`Fabio Egypt | Private Italian Guide - Sharm, Cairo & Luxor`.
It translates the original claim (an Italian guide); it does not change the
service to an English-speaking guide. The existing meta description remains the
legacy Italian source pending a separately reviewed English description. No
visible page copy, price, image content or layout was rewritten.

```sh
# After building with the corresponding environment:
node scripts/verify-environment.mjs https://your-deployment.vercel.app
node scripts/verify-sharing.mjs https://your-deployment.vercel.app
node scripts/verify-flavor.mjs --test
# After a normal build with the test variable absent:
node scripts/verify-environment.mjs
node scripts/verify-flavor.mjs
```

See `DEPLOYMENT.md` for the complete commands, variable precedence and host
safeguards. Deployment protection still requires authentication; actual external
Facebook/WhatsApp fetches cannot be claimed successful merely from HTML tests.
