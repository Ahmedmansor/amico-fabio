# Editorial foundation checkpoint

The shared static pipeline now coordinates blog and places metadata before native
rendering. Pure domain helpers validate place ancestry and stable localized
references; presentation uses one shared editorial shell and a separate guide
reading/sidebar template. No browser provider request or new service was added.

Focused real results during implementation:

```
vitest run src/features/places/domain/__tests__
Test Files 2 passed (2); Tests 7 passed (7)
vitest run src/features/places/domain/__tests__ src/features/blog/presentation/markdown/__tests__/processor.test.ts
Test Files 3 passed (3); Tests 19 passed (19)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
```

Real native dev routes:

```
/en/egypt/giza-pyramids/ -> 200
products: /en/tours/cairo_plane_flexible_museum/,
          /en/packages/cairo_piramidi_saqqara_vip/
/it/egypt/luxor/ -> 200
products: /it/tours/luxor_plane_classic/,
          /it/packages/nile_cruise_luxor_aswan_5d4n/
reading index present; unresolved pseudo-links false
```

The real guide-alias edit/restore scenario passed against the natural demo work
set; final grouped outputs and acceptance are in EDITORIAL_IMPLEMENTATION.md.
Content samples and final evidence are recorded in subsequent focused commits.
