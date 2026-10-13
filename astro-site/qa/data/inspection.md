# Google Sheets inspection and approved legacy compatibility

Inspected the four public CSV endpoints configured in the legacy
`assets/js/core/api.js` on October 13, 2026. Every endpoint returned HTTP 200.
No Google Sheets values or legacy files were changed. The new Astro data layer
implements the owner's confirmed legacy behavior described below.

## Source inventory

| Source | Parsed rows | Populated IDs | Active records |
| --- | --- | --- | --- |
| Trips_Prices | 100 | 27 | 22 |
| Packages | 99 | 14 | 14 |
| Trip_Addons | 3 | 3 | 3 |
| Global_Settings | 2 | 2 keys | 2 |

Trips_Prices includes five populated inactive records with `_dummy` IDs and
73 inactive rows without business content. Packages includes 85 inactive rows
without business content. These are not published records. Empty inactive rows
must not be mistaken for duplicate published IDs, nor filled with invented data.

For the 22 active trips and 14 active packages:

- Adult base prices are present.
- Italian and English translation entries are present.
- All expected poster image files exist in the legacy public assets.
- No duplicate active IDs were found.
- Every included-trip reference in an active package resolves to a trip row.

## Unspecified child prices

Both `p_child` and `d_child` are blank for the following active records:

| Source | Stable ID |
| --- | --- |
| Trips_Prices | super_safari_5_senses |
| Trips_Prices | moto_safari_quad_echo |
| Trips_Prices | vip_cena_romantica |
| Trips_Prices | cairo_plane_flexible_museum |
| Trips_Prices | cairo_bus_adventure_choice |
| Trips_Prices | santa_caterina_monastery_morning |
| Trips_Prices | mount_sinai_sunrise_adventure |
| Trips_Prices | luxor_plane_classic |
| Trips_Prices | petra_jordan_expedition |
| Trips_Prices | sharm_old_market_ultimate_shopping |
| Packages | cairo_crociera_nilo_cena |

The existing `BookingManager.utils.getPrices()` uses zero when both child price
fields are blank. That implementation fallback is not proof that children are
free. The owner subsequently instructed the migration to preserve existing
business behavior. The new data layer therefore uses the same zero default,
retaining the blank original source fields alongside the mapped prices.

## Unspecified minimum travelers

`min_pax` is blank for the following active records:

| Source | Stable ID |
| --- | --- |
| Trips_Prices | sharm_old_market_ultimate_shopping |
| Packages | cairo_cuore_pulsante_museo_cittadella |
| Packages | cairo_crociera_nilo_cena |
| Packages | cairo_mistico_copto_islamico |
| Packages | cairo_safari_piramidi_tramonto |
| Packages | alessandria_tour_giornata_intera |
| Packages | gran_tour_egitto_cairo_crociera_8g7n |
| Packages | nile_cruise_luxor_aswan_5d4n |
| Packages | nile_cruise_aswan_luxor_4d3n |

The existing booking code defaults to one traveler. The owner subsequently
confirmed preserving existing business behavior, so the new data layer uses
that same default and retains the blank source values.

## Other existing inconsistencies

- The active `whatsapp_number` settings row contains `39333000000`, whereas
  the actual site's header/forms and the approved shared config use
  `201063239261`. Keep the shared contact config authoritative; do not silently
  override it with this settings row.
- `promo_banner` is marked active but has a December 20, 2025–January 1, 2026
  date range. The legacy banner checks only `is_active`, ignoring these dates.
  The owner confirmed preserving that behavior: keep the date fields as
  metadata and do not introduce date-based activation during this migration.
- Neither trip nor package sheets contain a slug column. Stable IDs must remain
  unchanged. The initial slug is the existing normalized ID stored in a separate
  `slug` field, shared by both language versions. No shortened names or new IDs
  were invented.

## Current status

The provider/domain implementation is now present. Live validation found
22 active trips, 14 active packages, 3 addons, and 2 settings. It preserved
11 zero-child-price defaults and 9 one-traveler minimum defaults.
No dependency was installed. See the data-layer README for verification commands.

The raw fetched CSVs are temporary inspection artifacts under
`.astro/data-inspection/`, excluded from Git. They must not become a fallback
that silently replaces live Google Sheets data during production builds.

The owner's instruction resolved the earlier pause. Missing data outside the
explicitly approved legacy defaults still fails validation rather than being
filled with invented content.
