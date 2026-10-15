import { finalPrice } from '../domain/prices.ts';
import { isActive } from '../domain/offers.ts';

// Provider-specific columns stay here; domain models consume only final amounts.
/** @param {string} name @param {import('../domain/csv.ts').CsvRow[]} rows @returns {import('../domain/csv.ts').CsvRow[]} */
export function normalizeSheetRows(name, rows) {
  if (!['Trips_Prices', 'Packages'].includes(name)) return rows;
  const idField = name === 'Trips_Prices' ? 'trip_id' : 'package_id';
  return rows.map(row => {
    if (!row[idField] && !isActive(row.is_active)) return { ...row };
    const context = `${name}:${row[idField] || '(missing ID)'}`;
    return { ...row,
      adult_price: String(finalPrice(row.p_adult, row.d_adult, `${context}:adult_price`)),
      child_price: String(finalPrice(row.p_child, row.d_child, `${context}:child_price`, true)),
    };
  });
}
