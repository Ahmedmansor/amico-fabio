# Blog asset inventory

Updated: 2026-10-28. Seven AI-generated editorial illustrations are now available.

| Source assets | Purpose | Format / dimensions | Status | Replacement |
| --- | --- | --- | --- | --- |
| src/features/blog/data/assets/egypt-illustration.webp | Featured illustration: imaginary river, boat, stone architecture and pyramid | WebP, 1536×1024 | imagegen, temporary illustration | Replace source and the two featured fixture copies when approved imagery is available |
| src/features/blog/data/assets/interests/history.webp | History/culture card | WebP, 1200×800 | imagegen, temporary illustration | Replace this stable source path |
| src/features/blog/data/assets/interests/diving.webp | Sea/diving card | WebP, 1200×800 | imagegen, temporary illustration | Replace this stable source path |
| src/features/blog/data/assets/interests/desert.webp | Desert/adventure card | WebP, 1200×800 | imagegen, temporary illustration | Replace this stable source path |
| src/features/blog/data/assets/interests/food.webp | Food card | WebP, 1200×800 | imagegen, temporary illustration | Replace this stable source path |
| src/features/blog/data/assets/interests/tips.webp | Practical-tips card | WebP, 1200×800 | imagegen, temporary illustration | Replace this stable source path |
| src/features/blog/data/assets/interests/stories.webp | Traveler-stories card | WebP, 1200×800 | imagegen, temporary illustration | Replace this stable source path |
| src/content/blog/{lang}/fixture-*/hero.webp | Colocated hero/body images for the 22 guarded fixtures | WebP; featured pair 1536×1024, others 1200×800 | Copies of the generated hero/first-interest illustration; alt text updated to describe the scene | Replace individual files at the same source path; review alt/caption/crop |

The original technical fixture generator reads the primary color from shared theme.css. It refuses
to overwrite existing article directories and is not a build hook. Normal build
output never depends on rerunning the generator.

The visual assets were generated through imagegen and converted to WebP using
pinned Sharp 0.35.5, with decoded format/dimensions verified by the importer.
For additional illustrative article/taxonomy images, add rows with exact paths,
dimensions, purpose and generated/temporary status. Keep working originals local
if they are unnecessary build assets. Generated scenes are illustrations, not
verified photos of places or proof of travel experience. Stable source paths
allow owner replacement; hashed output URLs change on rebuild.

Before real publication: replace/approve temporary imagery, confirm rights,
check descriptive alt/caption accuracy and remove any fixture association only
after the corresponding content is real and reviewed.

Editorial expansion: the twelve natural article folders each contain hero.webp,
detail-1.webp and detail-2.webp. The eighteen localized place-guide folders each
contain hero.webp and detail.webp. These are copies of the same seven temporary
illustrations above, selected by the checked-in preview generators under
scripts/editorial/. No new generation or external-image download was needed.
Replace the colocated files (and update alt/caption for the replacement), rather
than editing hashed output URLs. Existing catalog photos used by guide product
cards are owned by the tours/packages feature and are not demo place photography.
