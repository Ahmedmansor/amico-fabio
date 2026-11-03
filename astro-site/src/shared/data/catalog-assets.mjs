import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
/** @param {readonly {id:string,poster:string}[]} records */
export function assertCatalogAssets(records) {
  for (const record of records) if (!existsSync(resolve(record.poster.slice(1)))) throw new Error(`[catalog:${record.id}] Missing linked poster ${record.poster}.`);
}
