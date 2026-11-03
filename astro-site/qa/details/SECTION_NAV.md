# Detail section navigation

Larger 14px links and 48px touch targets use the approved orange/navy tokens. The active reading section exposes `aria-current="location"`; horizontal overflow follows the current link without moving the document. The sticky desktop booking column does not automatically take precedence over reading sections. Clicking Book Now or focusing a booking field selects it; resuming reading clears that selection.

Verified in Chromium at 375 and 1280px on an English tour and Italian package: all reading anchors, included trips, booking click/focus and page width passed (4 cases, `section-nav.json`). Screenshots are local and ignored. `npx astro check`: 577 files, 0 errors/warnings/hints. Static build: 171 pages, complete. No backend or booking calculation changes.
