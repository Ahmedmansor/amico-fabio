# Fabio Egypt blog design direction

2026-10-28. New blog design is authorized; the old site's styling is not the
baseline. Use the owner's shared theme.css palette throughout. This document
records selected guidance, not a claim that UI has been implemented or reviewed.

## ui-ux-pro-max consultation

Design-system queries: `travel editorial magazine accessible`, then the narrower
`editorial publishing content-first`. The first returned scroll storytelling,
which does not fit a static editorial index. The retry returned a generic
hero/features pattern and Minimalism/Swiss layout guidance. Neither result is
an exact travel-magazine layout; the approved blog specification supplies that
composition. Adopt the verified low-cost grid, clear hierarchy, visible focus,
contrast and responsive rules. Do not adopt scroll effects, recommended alternate
palette, external Google Fonts loading or unrelated framework advice.

Astro stack query `content images navigation` confirmed static/no-JS navigation
and lazy below-fold images. View-transition advice is inapplicable; no client
router is added. A targeted contrast query confirmed dark text on light surfaces
and a 4.5:1 minimum normal-text contrast target.

## Chosen visual system

- Editorial, spacious light layout: white/tinted surfaces, navy typography,
  generous margins, large readable headings and strong image-led cards.
- Primary and dark navy from shared palette; orange actions with dark navy text,
  red/gold only for meaningful accents. Do not use pale muted text for essential
  small copy or white text on orange buttons without checking contrast.
- Locally hosted Playfair Display for editorial headings and Montserrat for
  navigation/body; no new font network dependency. These existing font assets
  are reused as resources, not as an obligation to reproduce old layouts.
- 12-column desktop composition, a large featured article, compact taxonomy
  image cards and a three-column latest-article grid. One column on small screens.
- New blog header/footer use shared contact, navigation, Auth/wishlist behavior
  where relevant. Neutral DocumentShell/SEO remain shared; legacy-shell.css is
  not imported into the blog layout.
- 44px minimum primary controls, visible focus, proper labels/landmarks, useful
  keyboard order, reduced motion and comfortable 68ch article reading width.
- Content is complete static HTML; JavaScript is limited to required interactions.

## Temporary visual assets

One hero and six interest illustrations were generated with imagegen. They are
imaginative editorial art, not verified photographs. Workspace WebP source paths
and replacement status are recorded in ASSETS.md. Initial destination cards may
reuse the relevant city-associated fixture article's illustration; the fixture
notice must make the temporary nature clear. Real destination photography is an
editorial replacement task, not a reason to mislabel generated artwork.

Before marking visual work complete: inspect matching 375/768/1280px captures,
actual contrast, keyboard behavior and interaction overlap. Do not claim those
checks merely because a design-system query returned recommendations.
