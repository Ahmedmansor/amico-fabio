import type { CsvRow } from '../../../shared/domain/csv.ts';
import { isActive, normalizeId, numeric, required } from '../../../shared/domain/offers.ts';
export function mapAddons(rows: CsvRow[], parentIds: readonly string[], locales: readonly string[]) {
  const parents = new Set(parentIds), seen = new Set<string>();
  return rows.filter(row => isActive(row.is_active)).map(row => {
    const id = required(row, 'addon_id', 'Trip_Addons');
    const tripId = normalizeId(required(row, 'trip_id', `Trip_Addons:${id}`));
    const context = `Trip_Addons:${tripId}/${id}`;
    if (!parents.has(tripId)) throw new Error(`[${context}] Unknown trip/package ${tripId}.`);
    const key = `${tripId}/${id}`;
    if (seen.has(key)) throw new Error(`[${context}] Duplicate addon ID within its trip/package.`);
    seen.add(key);
    const labels = Object.fromEntries(locales.map(locale => [locale, required(row, `label_${locale}`, context)]));
    return { id, tripId, labels,
      price: numeric(required(row, 'price', context), 'price', context), source: { ...row } };
  });
}
