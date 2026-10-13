import { parseCsv } from '../domain/csv.ts';
import { sheetSources, requiredColumns } from '../config/data-sources.ts';

/**
 * One provider boundary. A future provider implements read(name) and reset().
 * Cache only promises from the current build; never disk/browser/stale data.
 * @param {{fetchImpl?: typeof fetch, timeoutMs?: number}} options
 */
export function createGoogleSheetsProvider({ fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  const requests = new Map();
  return {
    reset() { requests.clear(); },
    /** @param {keyof typeof sheetSources} name */
    read(name) {
      if (!requests.has(name)) requests.set(name, (async () => {
        try {
          const response = await fetchImpl(sheetSources[name], { signal: AbortSignal.timeout(timeoutMs) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const body = await response.text();
          if (/^\s*</.test(body)) throw new Error('Received HTML instead of CSV');
          const rows = parseCsv(body, name);
          if (!rows.length) throw new Error('No data rows');
          for (const column of requiredColumns[name]) if (!Object.hasOwn(rows[0], column)) throw new Error(`Missing CSV column ${column}`);
          return rows;
        } catch (error) {
          requests.delete(name);
          throw new Error(`[Google Sheets:${name}] ${error.message}`, { cause: error });
        }
      })());
      return requests.get(name);
    },
  };
}
export const googleSheetsProvider = createGoogleSheetsProvider();
