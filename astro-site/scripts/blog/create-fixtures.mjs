// Technical fixtures only; refuses to overwrite any existing article directory.
import { mkdir, access, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../../src/content/blog/', import.meta.url);
const entries = [
  ['en', 'fixture-cairo-guide', 'cairo', ['history', 'tips'], 'fixture-cairo', ['fixture Cairo guide'], 2, true],
  ['it', 'fixture-guida-cairo', 'cairo', ['history', 'tips'], 'fixture-cairo', ['fixture guida Cairo'], 2, true],
  ['en', 'fixture-diving-guide', 'sharm', ['diving'], 'fixture-diving', ['fixture diving guide'], 1],
  ['it', 'fixture-guida-mare', 'sharm', ['diving'], 'fixture-diving', ['fixture guida mare'], 1],
  ['en', 'fixture-sea-overview', 'sharm', ['diving', 'tips'], 'fixture-sea', ['fixture sea'], 0],
  ['it', 'fixture-panoramica-mare', 'sharm', ['diving', 'tips'], 'fixture-sea', ['fixture mare'], 0],
  ['en', 'fixture-luxor-notes', 'luxor', ['history'], null, ['fixture Luxor notes'], 3],
  ['en', 'fixture-aswan-notes', 'aswan', ['stories', 'history'], null, ['fixture Aswan notes'], 1],
  ['en', 'fixture-food-notes', 'cairo', ['food'], null, ['fixture food notes'], 2],
  ['it', 'fixture-note-cucina', 'cairo', ['food'], null, ['fixture note cucina'], 1],
  ['en', 'fixture-desert-notes', null, ['desert'], null, ['fixture desert notes'], 1],
  ['it', 'fixture-note-deserto', null, ['desert'], null, ['fixture note deserto'], 1],
  ['en', 'fixture-practical-notes', null, ['tips'], 'fixture-practical', ['fixture practical notes'], 0],
  ['it', 'fixture-note-pratiche', null, ['tips'], 'fixture-practical', ['fixture note pratiche'], 0],
  ['it', 'fixture-racconti', null, ['stories'], null, ['fixture racconti'], 1],
  ['it', 'fixture-appunti-uno', null, ['tips'], null, ['fixture appunti uno'], 1],
  ['it', 'fixture-appunti-due', null, ['tips'], null, ['fixture appunti due'], 1],
  ['it', 'fixture-appunti-tre', null, ['tips'], null, ['fixture appunti tre'], 1],
  ['en', 'fixture-extra-notes', null, ['tips'], null, ['fixture extra notes'], 1],
  ['en', 'fixture-second-notes', null, ['tips'], null, ['fixture second notes'], 1],
  ['en', 'fixture-hidden-draft', 'cairo', ['tips'], null, ['fixture secret keyword'], 1, false, true],
  ['en', 'fixture-future-notes', null, ['tips'], null, ['fixture future keyword'], 0, false, false, '2099-01-01'],
];

// Preflight all paths before writing, so an accidental rerun never partly overwrites.
for (const [lang, slug] of entries) {
  try { await access(new URL(`${lang}/${slug}/`, root)); }
  catch { continue; }
  throw new Error(`Refusing to overwrite ${lang}/${slug}/.`);
}

const theme = await readFile(new URL('../../src/shared/styles/theme.css', import.meta.url), 'utf8');
const background = theme.match(/--color-primary:\s*(#[a-f\d]+)/i)?.[1];
if (!background) throw new Error('Shared primary palette token is missing.');
const image = await sharp({ create: { width: 1200, height: 800, channels: 3, background } }).webp({ quality: 82 }).toBuffer();
for (const [index, entry] of entries.entries()) {
  const [lang, slug, destination, interests, translationKey, linkKeywords, bodyImages, featured = false, draft = false, pubDate = `2026-01-${String(28 - index).padStart(2, '0')}`] = entry;
  const folder = new URL(`${lang}/${slug}/`, root);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL('hero.webp', folder), image);
  const intro = lang === 'it'
    ? '[FIXTURE] Testo artificiale per verificare il sistema. Non contiene consigli di viaggio.'
    : '[FIXTURE] Artificial text for system testing. This is not travel advice.';
  let body = `${intro}\n\n## [FIXTURE] ${lang === 'it' ? 'Prima sezione' : 'First section'}\n\n`;
  body += `${intro} `.repeat(index < 2 ? 55 : 6).trim() + '\n\n';
  if (slug === 'fixture-cairo-guide') body += 'fixture diving guide, fixture diving guide, fixture sea, fixture secret keyword.\n\n';
  if (slug === 'fixture-guida-cairo') body += 'fixture guida mare, fixture guida mare, fixture mare. English phrase: fixture diving guide.\n\n';
  for (let number = 0; number < bodyImages; number++) {
    body += `![${lang === 'it' ? 'Immagine illustrativa di prova' : 'Illustrative test image'}](./hero.webp "[FIXTURE] ${lang === 'it' ? 'Didascalia di prova' : 'Test caption'}")\n\n`;
  }
  if (!slug.includes('practical') && !slug.includes('pratiche')) body += `## [FIXTURE] ${lang === 'it' ? 'Seconda sezione' : 'Second section'}\n\n${intro}\n`;
  const frontmatter = { id: `${lang}-${slug}`, title: `[FIXTURE] ${slug.replaceAll('-', ' ')}`,
    description: intro, pubDate, lang, ...(translationKey ? { translationKey } : {}),
    ...(destination ? { destination } : {}), interests, heroImage: './hero.webp',
    heroAlt: lang === 'it' ? 'Segnaposto blu per test tecnici' : 'Navy placeholder for technical testing',
    linkKeywords, featured, draft, fixture: true };
  const yaml = Object.entries(frontmatter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
  await writeFile(new URL('index.md', folder), `---\n${yaml}\n---\n\n${body.trimEnd()}\n`);
}
console.log(`Created ${entries.length} visibly labeled technical fixture articles with colocated WebP placeholders.`);
