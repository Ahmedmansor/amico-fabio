import type { CsvRow } from '../../../shared/domain/csv.ts';
import { required } from '../../../shared/domain/offers.ts';
export function mapSettings(rows: CsvRow[], locales: readonly string[]) {
  const seen = new Set<string>();
  return rows.map(row => {
    const key = required(row, 'key', 'Global_Settings');
    if (seen.has(key)) throw new Error(`[Global_Settings] Duplicate key ${key}.`);
    seen.add(key);
    // Legacy banner checks only TRUE, not dates. Retain that business behavior.
    return { key, active: String(row.is_active).toUpperCase() === 'TRUE',
      values: Object.fromEntries(locales.map(locale => [locale, required(row, `val_${locale}`, `Global_Settings:${key}`)])),
      startDate: row.start_date || '', endDate: row.end_date || '', source: { ...row } };
  });
}
