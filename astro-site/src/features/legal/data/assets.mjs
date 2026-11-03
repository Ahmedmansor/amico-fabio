import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** @param {Record<string, string>} icons */
export function assertLegalAssets(icons) {
  for (const [id, icon] of Object.entries(icons)) {
    if (!existsSync(resolve('public', icon.slice(1)))) {
      throw new Error(`[legal] ${id}: linked image file is missing: ${icon}.`);
    }
  }
}
