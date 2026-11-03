/** Route names are approved, persisted content; never derive them at runtime. */
export interface CatalogRouteRecord {
  id: string;
  slug: string;
  text: Record<string, { title: string; route_slug?: unknown }>;
}
export function catalogSlug(record: CatalogRouteRecord, locale: string): string {
  const slug=record.text[locale]?.route_slug;
  if(typeof slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    || slug!==slug.toLowerCase() || slug!==slug.normalize('NFC'))
    throw new Error(`[catalog:${record.id}:${locale}] Missing/invalid route_slug.`);
  return slug;
}
export function catalogPath(record: CatalogRouteRecord, locale: string, kind: 'tours'|'packages'): string {
  return `/${locale}/${kind}/${catalogSlug(record,locale)}/`;
}
export function catalogAlternates(record: CatalogRouteRecord, locales: readonly string[], kind: 'tours'|'packages') {
  return Object.fromEntries(locales.map(locale=>[locale,catalogPath(record,locale,kind)]));
}
export function validateCatalogRoutes(records: readonly CatalogRouteRecord[], source: string): void {
  const legacy=new Map(records.map(record=>[record.slug,record.id]));
  const routes=new Map<string,string>();
  for(const record of records)for(const locale of Object.keys(record.text)){
    const slug=catalogSlug(record,locale),key=`${locale}/${slug}`;
    const owner=routes.get(key)??legacy.get(slug);
    if(owner&&owner!==record.id)throw new Error(`[${source}:${record.id}:${locale}] Duplicate route_slug ${slug}; conflicts with ${owner}.`);
    routes.set(key,record.id);
  }
}
