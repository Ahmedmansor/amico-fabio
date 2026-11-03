import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { articlePathParts } from '../../src/features/blog/domain/validation.ts';
import { interests } from '../../src/features/blog/domain/taxonomy.ts';

export async function createDraft({ root, lang, slug, image, alt, title, description, interest, now = new Date() }) {
  articlePathParts(`${lang}/${slug}/index.md`);
  if (!interests.includes(interest)) throw new Error(`Unknown interest: ${interest}. Choose ${interests.join(', ')}.`);
  if (typeof title !== 'string' || title.trim().length < 10 || title.trim().length > 110) throw new Error('Title must contain 10–110 characters.');
  if (typeof description !== 'string' || description.trim().length < 50 || description.trim().length > 160) throw new Error('Description must contain 50–160 characters.');
  if (typeof alt !== 'string' || alt.trim().length < 5) throw new Error('Supply an accurate image --alt of at least five characters.');
  if (!image) throw new Error('Supply an approved local --image path.');
  const directory = join(resolve(root), lang, slug);
  // Decode before creating anything; no placeholder image or invented author.
  const bytes = await sharp(await readFile(resolve(image))).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  const metadata = { id: `${lang}-${randomUUID()}`, title: title.trim(), description: description.trim(),
    pubDate: now.toISOString().slice(0,10), lang, interests: [interest], heroImage: './hero.webp', heroAlt: alt.trim(),
    linkKeywords: [], relatedTripIds: [], featured: false, draft: true };
  const body = `---\n${Object.entries(metadata).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`;
  await mkdir(join(resolve(root), lang), { recursive: true });
  try { await mkdir(directory); }
  catch (error) { if (error.code === 'EEXIST') throw new Error(`Refusing to overwrite existing article: ${directory}`); throw error; }
  await writeFile(join(directory, 'hero.webp'), bytes, { flag: 'wx' });
  await writeFile(join(directory, 'index.md'), body, { flag: 'wx' });
  return { directory, metadata };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [lang, slug, ...args] = process.argv.slice(2), options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]?.slice(2);
    if (!args[index]?.startsWith('--') || !['image','alt','title','description','interest'].includes(key) || !args[index+1] || Object.hasOwn(options,key)) throw new Error('Usage: npm run blog:new -- it slug --title "…" --description "…" --image "…" --alt "…" --interest tips');
    options[key] = args[index+1];
  }
  const result = await createDraft({ root: fileURLToPath(new URL('../../src/content/blog/', import.meta.url)), lang, slug, ...options });
  console.log(`Created draft: ${result.directory}\nID: ${result.metadata.id}\nAdd approved body and authorId before publication. Run npm run check:content after editing.`);
}
