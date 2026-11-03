// Converts approved temporary artwork to a stable, workspace-owned WebP path.
// Usage: node scripts/blog/import-generated-asset.mjs <hero|interest> <input>
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const [key, input] = process.argv.slice(2);
const interests = ['history', 'diving', 'desert', 'food', 'tips', 'stories'];
if (!input || (key !== 'hero' && !interests.includes(key))) throw new Error('Expected hero or a supported interest key, and an input image path.');
const base = new URL('../../src/features/blog/data/assets/', import.meta.url);
const target = new URL(key === 'hero' ? 'egypt-illustration.webp' : `interests/${key}.webp`, base);
await mkdir(new URL('./', target), { recursive: true });
let exists = true;
try { await access(target); } catch { exists = false; }
if (exists) throw new Error(`Refusing to overwrite ${target.pathname}; owner replacements are a separate explicit action.`);
await sharp(input).resize({ width: key === 'hero' ? 1536 : 1200, withoutEnlargement: true }).webp({ quality: 84 }).toFile(fileURLToPath(target));
const metadata = await sharp(fileURLToPath(target)).metadata();
if (metadata.format !== 'webp' || !metadata.width || !metadata.height) throw new Error('Converted asset is not a valid sized WebP.');
console.log(`${key}: WebP ${metadata.width}x${metadata.height}; ${target.pathname}`);
