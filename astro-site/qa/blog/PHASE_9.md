# Phase 9 — explicit related trips

2026-10-28. References use the tours feature's `getTrips()` public data function;
no provider bypass, browser catalog request or price calculation was introduced.
The selector validates all configured IDs against published trips, then selects
the first configured one with the actual locale title. Empty references omit the
section; missing translations are never invented. The card reuses the owning
presentation's image metadata and links to the localized booking page.

Read-only catalog verification through `getTrips()` returned:

```
{"published":22,"example":"ras_mohammed_white_island_vip"}
```

That verified ID is attached only to the guarded IT/EN diving fixtures to exercise
the card. No real article association or catalog mutation is claimed.

Focused real output from astro-site/:

```
vitest run src/features/blog/domain/__tests__/related-trip.test.ts
Test Files 1 passed (1); Tests 3 passed (3)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
```

Cases: configured ordering, actual locale, missing-locale skip, no references,
unknown/unpublished reference (including one after an eligible first item).
Card HTML/image and route acceptance will be recorded with the grouped artifact
check, rather than running another site build for this component alone.
