import type { CsvRow } from './csv.ts';
export interface OfferText { title: string; short_desc: string; [key: string]: unknown }
export type OfferDictionaries = Record<string, Record<string, OfferText>>;
export interface Offer {
  id: string;
  slug: string;
  location: string;
  category: string;
  poster: string;
  prices: { adult: number; child: number };
  minPax: number;
  text: Record<string, OfferText>;
  source: CsvRow;
}

// The aliases are copied from legacy api.js; no new business IDs are assigned.
const aliases: Record<string, string> = {
  yacht_white: 'ras_mohammed_white_island_vip', ras_mohammed_boat: 'ras_mohammed_white_island_vip',
  safari_quad: 'desert_quad_bike_safari', quad_safari: 'desert_quad_bike_safari',
  cairo_pyramids: 'cairo_pyramids_classic', cairo_by_plane: 'cairo_pyramids_by_plane',
  ras_mohammed_bus: 'ras_mohammed_bus_half_day', tiran_boat: 'tiran_island_boat_vip',
  luxor_tour: 'luxor_day_trip', aswan_tour: 'aswan_day_trip',
};
export function normalizeId(value: string): string { const id = value.trim(); return Object.hasOwn(aliases, id) ? aliases[id] : id; }
export function isActive(value: unknown): boolean { return String(value).toLowerCase() === 'true' || value === '1' || value === true; }
export function editorialBadgeKey(value: string | undefined): string { return value?.trim().toUpperCase() === 'HOT_DEAL' ? '' : value?.trim() || ''; }
export function required(row: CsvRow, field: string, context: string): string {
  if (typeof row[field] !== 'string' || !row[field].trim()) throw new Error(`[${context}] Missing required field ${field}.`);
  return row[field].trim();
}
export function numeric(value: string, field: string, context: string): number {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim()) || !Number.isFinite(Number(value))) throw new Error(`[${context}] Invalid ${field}: ${JSON.stringify(value)}.`);
  return Number(value);
}
export function publishedRows(rows: CsvRow[], idField: string, source: string): CsvRow[] {
  const seen = new Set<string>();
  return rows.filter((row, index) => {
    const id = (row[idField] || '').trim();
    if (id) {
      const normalized = normalizeId(id);
      if (seen.has(normalized)) throw new Error(`[${source}] Duplicate ${idField}: ${normalized}.`);
      seen.add(normalized);
    }
    if (!isActive(row.is_active)) return false;
    required(row, idField, `${source} row ${index + 2}`);
    return true;
  });
}
export function mapOffer(row: CsvRow, idField: string, kind: 'trips' | 'packages', dictionaries: OfferDictionaries, locales: readonly string[]): Offer {
  const id = normalizeId(required(row, idField, kind));
  const context = `${kind}:${id}`;
  // URL slug and stable ID are separate fields; initially retain the exact existing ID as the slug.
  const slug = id;
  if (!/^[a-z0-9_-]+$/.test(slug)) throw new Error(`[${context}] Invalid route slug ${slug}.`);
  const location = required(row, 'location', context).toLowerCase();
  const category = required(row, 'category', context).toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(location) || !/^[a-z0-9_-]+$/.test(category)) throw new Error(`[${context}] Invalid image location/category.`);
  const adult = numeric(required(row, 'adult_price', context), 'adult_price', context);
  const child = numeric(required(row, 'child_price', context), 'child_price', context);
  const minPax = row.min_pax ? numeric(row.min_pax, 'min_pax', context) : 1;
  if (!Number.isInteger(minPax)) throw new Error(`[${context}] min_pax must be a non-negative integer.`);
  const text: Record<string, OfferText> = {};
  for (const locale of locales) {
    const translated = dictionaries[locale]?.[id];
    if (!translated || !translated.title?.trim() || !translated.short_desc?.trim()) throw new Error(`[${context}] Missing required title/short_desc translation for ${locale}.`);
    text[locale] = translated;
  }
  const folder = kind === 'trips' ? `${location}/${category}/${id}` : `${location}/${id}`;
  return { id, slug, location, category, poster: `/src/shared/assets/catalog/${kind}/${folder}/poster.webp`,
    prices: { adult, child },
    minPax, text, source: { ...row } };
}
export function assertUniqueSlugs(records: readonly Offer[], source: string): void {
  const slugs = new Set<string>();
  for (const record of records) {
    if (slugs.has(record.slug)) throw new Error(`[${source}] Duplicate slug ${record.slug}.`);
    slugs.add(record.slug);
  }
}
