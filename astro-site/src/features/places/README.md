# Places / Egypt travel guide

Implemented as a static editorial feature alongside the blog. Routes are
/{locale}/egypt/ and /{locale}/egypt/{slug}/. Initial preview: Egypt, Cairo,
Luxor, Aswan, Sharm El Sheikh, Giza Pyramids, Karnak, Valley of the Kings and GEM,
with actual IT/EN equivalents (18 localized guides).

- domain/: pure hierarchy, actual language equivalents, route construction and
  tests. Stable placeId is separate from localized entry id and slug.
- data/: strict schema, collection views and published-guide navigation.
  Products come only from getTrips()/getPackages(); no provider bypass.
- presentation/: readable two-column guide and real product cards. The neutral
  shared EditorialLayout owns navigation/Auth/cookie/footer integration.
- Content: src/content/places/{lang}/{slug}/index.md and colocated WebP files.

Required guide fields: id, placeId, kind, lang, title, description, pubDate,
heroImage, heroAlt. Non-country guides require parentPlaceId. All referenced
parents must exist in that language; a published child requires a published
parent. Unknown products, cycles and duplicate identities/routes/aliases fail.
Real publication requires an approved authorId from the current author registry.

relatedTripIds / relatedPackageIds contain real published catalog IDs, in desired
display order. Up to four related products appear without invented prices or
inclusions. Empty recommendation blocks are omitted. A tour link does not imply
that the product includes every activity discussed by the guide.

The shared editorial loader coordinates both native collections: all metadata
is parsed/validated, one complete target snapshot is written, then Markdown is
rendered. A debounced dev refresh rebuilds both derived indexes after an edit.
No Markdown visitor performs network requests or circular collection queries.

Use Markdown stable references: [label](place:giza-pyramids),
[label](tour:existing-id), [label](package:existing-id), [label](post:version-id).
The build resolves the current language and rejects hidden/unknown targets.
Automatic guide titles/aliases share the registry with article titles/aliases;
ambiguous ownership identifies both sources. Catalog aliases are not enabled
implicitly. `npm run blog:references` lists validated reference IDs and aliases.

All current guides are protected fixture:true previews, with temporary generated
illustrations. Do not remove that protection until real copy, identity and image
rights are approved. No guide is emitted by the normal production-policy build.
New guide production does not require a database, server or separate deployment.
