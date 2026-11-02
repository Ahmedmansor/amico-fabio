# Explore destination filter — 2026-11-02

Owner requested a destination selector above categories so Sharm, Cairo and
Luxor/Aswan do not appear mixed unless explicitly choosing all cities.

Added four native city links above category/price controls, with selected state,
existing site pill styling, real SVG pin and responsive two-column phone layout.
City names reuse shared IT/EN location labels; two new interface labels exist in
both explore dictionaries. Reuse existing static routes and location matching.
Links work without JavaScript; enhanced links preserve the current price order
and reset category/page to all/1 on city changes. Category and language controls
continue using their existing behavior. No catalog/pricing/ordering policy,
provider, framework or dependency changes; domain changes are message types only.

Actual focused verification: Astro check 606 files, no diagnostics; static build
171 pages (existing guards: 70 editorial links/metadata, 50 JSON-LD). Two browser
scenarios only, EN 375 / IT 1280: each visited all four city choices, verified
every rendered card matched its destination, descending price order survived,
category reset/current indicator worked, no overflow/page errors. Screenshots
inspected and kept ignored/local. See explore-location.mjs/json. No broad test
suite or Lighthouse run, no external submissions or hosting environment changes.
Remote readiness is recorded separately after publication.
