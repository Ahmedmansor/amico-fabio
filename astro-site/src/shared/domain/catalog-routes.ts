import type {Locale} from '../config/languages.ts';
/** Public section names are independent of provider IDs and internal kind names. */
export const catalogSections={
  it:{tours:'escursioni',packages:'pacchetti'},
  en:{tours:'tours',packages:'packages'},
  es:{tours:'excursiones',packages:'paquetes'},
  pt:{tours:'excursoes',packages:'pacotes'},
  de:{tours:'ausfluege',packages:'reisepakete'},
} as const satisfies Record<Locale,{tours:string;packages:string}>;
export function catalogSection(locale:string,kind:'tours'|'packages'):string {
  if(!Object.hasOwn(catalogSections,locale))throw new Error(`[catalog] Unsupported locale ${locale}.`);
  return catalogSections[locale as Locale][kind];
}
export function catalogRoutePath(locale:string,kind:'tours'|'packages',slug:string):string {
  return `/${locale}/${catalogSection(locale,kind)}/${slug}/`;
}
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
  return catalogRoutePath(locale,kind,catalogSlug(record,locale));
}
/** Both the original provider-slug URL and the first localized-slug URL survive. */
export function catalogAliases(record:CatalogRouteRecord,locale:string,kind:'tours'|'packages'):string[] {
  const canonical=catalogPath(record,locale,kind);
  return [...new Set([`/${locale}/${kind}/${record.slug}/`,`/${locale}/${kind}/${catalogSlug(record,locale)}/`])].filter(path=>path!==canonical);
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
