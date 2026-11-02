/** Only verified catalog/page values enter the graph; no inferred dates or ratings. */
export interface CatalogSeoInput {
  kind: 'tour' | 'package';
  locale: string;
  slug: string;
  title: string;
  description: string;
  adultPrice: number;
  program: readonly { time: string; activity: string; details: string }[];
  included?: readonly { slug: string; title: string }[];
}
export interface CatalogSeoContext {
  site: string;
  assetOrigin: string;
  image: { src: string; width: number; height: number };
  homeLabel: string;
  tripsLabel: string;
}

// Catalog text permits presentation markup. Metadata must be plain text.
export function catalogPlainText(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:\d+|x[0-9a-f]+);/gi, entity => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    const key = entity.slice(1, -1).toLowerCase();
    if (!key.startsWith('#')) return named[key];
    const code = key.startsWith('#x') ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '';
  }).replace(/\s+/g, ' ').trim();
}

export function catalogStructuredData(input: CatalogSeoInput, context: CatalogSeoContext) {
  if (!Number.isFinite(input.adultPrice) || input.adultPrice < 0) throw new Error(`[catalog-seo:${input.slug}] Invalid adultPrice.`);
  const absolute = (path: string) => new URL(path, context.site).href;
  const namespace = input.kind === 'tour' ? 'tours' : 'packages';
  const url = absolute(`/${input.locale}/${namespace}/${input.slug}/`);
  const name = catalogPlainText(input.title), description = catalogPlainText(input.description);
  const image = { '@type': 'ImageObject', url: new URL(context.image.src, context.assetOrigin).href,
    width: context.image.width, height: context.image.height, caption: name };
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url, url, name, description, inLanguage: input.locale,
      mainEntity: { '@id': `${url}#trip` }, primaryImageOfPage: image,
      breadcrumb: { '@id': `${url}#breadcrumb` } },
    { '@type': 'TouristTrip', '@id': `${url}#trip`, url, name, description, image,
      provider: { '@type': 'Organization', name: 'Fabio Egypt', url: absolute('/') },
      offers: { '@type': 'Offer', url, price: input.adultPrice, priceCurrency: 'EUR' },
      itinerary: { '@type': 'ItemList', numberOfItems: input.program.length,
        itemListElement: input.program.map((step, index) => ({ '@type': 'ListItem', position: index + 1,
          item: { '@type': 'Thing', name: catalogPlainText(step.activity),
            description: catalogPlainText(`${step.time}: ${step.details}`) } })) },
      ...(input.included?.length ? { subTrip: input.included.map(trip => ({ '@type': 'TouristTrip',
        '@id': `${absolute(`/${input.locale}/tours/${trip.slug}/`)}#trip`,
        url: absolute(`/${input.locale}/tours/${trip.slug}/`), name: catalogPlainText(trip.title) })) } : {}),
    },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
      { name: context.homeLabel, item: absolute(`/${input.locale}/`) },
      { name: context.tripsLabel, item: absolute(`/${input.locale}/explore/`) },
      { name, item: url },
    ].map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) },
  ] };
}

export const serializeCatalogStructuredData = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');
