import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { validateTranslations } from '../../src/shared/i18n/validate.ts';

const root = resolve('src');
const drafts = process.argv.includes('--drafts');
const locales = ['es', 'pt', 'de'];
const missing = [];
let groups = 0;

async function existsJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

function protectedContent(source, target, label, key = '') {
  if (typeof source === 'string') {
    const tokens = value => [...value.matchAll(/\{[a-zA-Z_][a-zA-Z_0-9]*\}/g)].map(m => m[0]).sort();
    const markup = value => value.match(/<\/?[a-zA-Z][^>]*>/g) ?? [];
    if (JSON.stringify(tokens(source)) !== JSON.stringify(tokens(target))) throw Error(`${label}: changed interpolation placeholders`);
    if (JSON.stringify(markup(source)) !== JSON.stringify(markup(target))) throw Error(`${label}: changed HTML structure or attributes`);
    const fixed = /^(id|tour_id|icon|hero_img|img|source)$/.test(key) || key === 'time' && /^\d{2}:\d{2}$/.test(source);
    if (fixed && source !== target) throw Error(`${label}: changed stable identifier, asset or clock time`);
  } else if (source && typeof source === 'object') {
    for (const [child, value] of Object.entries(source)) protectedContent(value, target[child], `${label}.${child}`, child);
  } else if (source !== target) throw Error(`${label}: changed numeric or boolean value`);
}

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) { await inspect(path); continue; }
    if (!/(?:^|-)en\.json$/.test(entry.name)) continue;
    if (!path.includes('data\\content\\') && !path.includes('data/content/') && !path.includes('i18n\\dictionaries\\') && !path.includes('i18n/dictionaries/')) continue;
    const reference = await existsJson(path);
    for (const locale of locales) {
      const targetPath = path.replace(/en\.json$/, `${locale}.json`);
      const target = await existsJson(targetPath);
      if (!target) { missing.push(relative(root, targetPath)); continue; }
      validateTranslations({ en: reference, [locale]: target }, ['en', locale], 'en');
      protectedContent(reference, target, relative(root, targetPath));
      groups++;
    }
  }
}
await inspect(root);
console.log(`${groups} translated dictionaries: keys, array lengths, types, placeholders, HTML, stable IDs/assets and numbers preserved.`);
if (missing.length) {
  console.log(`Pending dictionaries (${missing.length}):\n${missing.join('\n')}`);
  if (!drafts) process.exitCode = 1;
}
