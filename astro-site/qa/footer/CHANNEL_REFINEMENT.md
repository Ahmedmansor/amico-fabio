# Compact WhatsApp channel card — 2026-11-03

Owner requested replacing the rear phone's tour photograph with a WhatsApp
channel screen and reducing card height so phones protrude like the supplied
reference. No production publication or channel activation.

Removed the catalog photograph/import and its image styles. The rear phone now
shows a channel/megaphone icon, Fabio Egypt channel label, tours/travel tips/news
topics and the existing coming-soon state. Three new strings have matching keys
in all five dictionaries. Both phone buttons use the existing success green to
suggest WhatsApp; main card/CTA retain Fabio's navy/gold palette. No fake channel
metrics, reviews, verification or privacy claims.

Desktop card padding/type spacing are reduced; phones center vertically in a
shorter grid row and extend above/below the card. At mobile widths the stacked
phones extend below the card without clipping. Explicit section space prevents
collision with the actual footer, including campaign footers. Reduced-motion
styles preserve the same positioning while disabling hover transitions. Actual
channel configuration and disabled CTA are unchanged.

## Real checks

```text
npx astro check
Result (729 files): 0 errors, 0 warnings, 0 hints

npm run build
572 page(s) built in 19.61s; Complete!

node qa/footer/verify-channel.mjs
WhatsApp channel verified on 240 footer pages: once before footer,
Fabio Egypt branding, disabled coming-soon action, no placeholder href or
borrowed brand claims; both campaigns included.
```

Browser screenshot review confirmed the requested text-only rear phone and
floating-phone silhouette on desktop/mobile. Focused read-only geometry checks:

| Page | Viewport | Document width | Card height | Protrusion | Footer clear |
| --- | ---: | ---: | ---: | --- | --- |
| Italian home | 320 | 305 | 532 | below | yes |
| Italian welcome | 375 | 360 | 532 | below | yes |
| German home | 768 | 753 | 284 | above/below | yes |
| English home | 1280 | 1265 | 249 | above/below | yes |
| Italian offerta-sharm | 1280 | 1265 | 249 | above/below | yes |

The browser scrollbar accounts for the 15px width difference; no horizontal
overflow. All five samples had zero images in the back phone. The viewport
override was reset afterward. Domain behavior was unchanged; no unnecessary
repeat of the prior URL-validator tests. No external join, Auth or form action.

Preview: `http://127.0.0.1:4346/it/#whatsapp-channel` while the local preview runs.
No dependencies, global theme tokens, lead flows or production settings changed.
