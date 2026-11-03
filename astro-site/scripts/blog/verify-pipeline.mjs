// Run manually: node scripts/blog/verify-pipeline.mjs
// Generates an isolated Astro app under ignored qa/blog/.pipeline/, never in site routes.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, relative, sep } from 'node:path';
import { build, dev } from 'astro';

const appRoot = fileURLToPath(new URL('../../', import.meta.url));
const scratch = resolve(appRoot, 'qa/blog/.pipeline');
await mkdir(scratch, { recursive: true });
const root = await mkdtemp(resolve(scratch, 'run-'));
const rootURL = pathToFileURL(root + sep);
const snapshot = new URL('validated-index.json', rootURL);
const pipelineURL = new URL('./prototype-pipeline.mjs', import.meta.url).href;
let server;
let passed = false;

async function save(path, content) {
  const url = new URL(path, rootURL);
  await mkdir(new URL('./', url), { recursive: true });
  await writeFile(url, content);
}

// Deterministic 640x360 placeholder PNG; no external image/dependency needed.
function placeholderPng() {
  const chunk = (kind, body) => {
    const data = Buffer.concat([Buffer.from(kind), body]);
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const length = Buffer.alloc(4), checksum = Buffer.alloc(4);
    length.writeUInt32BE(body.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(640); header.writeUInt32BE(360, 4); header[8] = 8; header[9] = 2;
  const pixels = Buffer.alloc((640 * 3 + 1) * 360);
  for (let row = 0; row < 360; row++) for (let x = 0; x < 640; x++) {
    const offset = row * (640 * 3 + 1) + 1 + x * 3;
    pixels[offset] = 10; pixels[offset + 1] = 43; pixels[offset + 2] = 75;
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}

const source = `---
id: proof-source-en
lang: en
routeSlug: source
linkKeywords: []
heroImage: ./hero.png
draft: false
---

## [FIXTURE] First section

This is placeholder text: alpha phrase and beta phrase.

![Solid navy placeholder](./hero.png "Caption with <characters> & punctuation")

## [FIXTURE] Second section

More placeholder text.
`;
const target = (keyword, draft = false) => `---
id: proof-target-en
lang: en
routeSlug: target
linkKeywords: ["${keyword}"]
heroImage: ./hero.png
draft: ${draft}
---

Placeholder target text.
`;

async function waitFor(check, description) {
  const deadline = Date.now() + 20000;
  let lastError;
  while (Date.now() < deadline) {
    try { if (await check()) return; } catch (error) { lastError = error; }
    await new Promise(done => setTimeout(done, 150));
  }
  throw new Error(`Timed out: ${description}`, { cause: lastError });
}

try {
  await save('package.json', JSON.stringify({ private: true, type: 'module' }));
  await save('astro.config.mjs', `
import {defineConfig} from 'astro/config';
import {satteri} from '@astrojs/markdown-satteri';
import {prototypePlugins} from '${pipelineURL}';
const snapshot=new URL('./validated-index.json',import.meta.url);
export default defineConfig({
  site:'https://example.invalid',output:'static',trailingSlash:'always',
  devToolbar:{enabled:false},
  image:{layout:'constrained',breakpoints:[320,640]},
  markdown:{syntaxHighlight:false,processor:satteri({hastPlugins:prototypePlugins(snapshot)})},
});
`);
  await save('src/content.config.ts', `
import {defineCollection,z} from 'astro:content';
import {prototypeLoader} from '${pipelineURL}';
export const collections={proof:defineCollection({
  loader:prototypeLoader(new URL('../validated-index.json',import.meta.url)),
  schema:({image})=>z.object({id:z.string(),lang:z.enum(['en','it']),routeSlug:z.string(),linkKeywords:z.array(z.string()),heroImage:image(),draft:z.boolean()}),
})};
`);
  await save('src/pages/index.astro', `---
import {getCollection,render} from 'astro:content';
import {Image} from 'astro:assets';
const entries=await getCollection('proof');
if(entries.some(entry=>typeof entry.data.heroImage!=='object'))throw new Error('An article without body images lost its hero import');
const entry=entries.find(entry=>entry.id==='proof-source-en');
if(!entry)throw new Error('Missing proof article');
const {Content}=await render(entry);
---
<!doctype html><html lang="en"><head><title>Pipeline proof</title><meta name="robots" content="noindex"/></head><body>
<h1>[FIXTURE] Pipeline proof</h1>
<Image src={entry.data.heroImage} alt="Solid navy hero placeholder" widths={[320,640]} sizes="100vw" loading="eager" fetchpriority="high"/>
<article><Content/></article></body></html>
`);
  await save('src/content/blog/en/source/index.md', source);
  await save('src/content/blog/en/target/index.md', target('alpha phrase'));
  for (const name of ['source', 'target']) await save(`src/content/blog/en/${name}/hero.png`, placeholderPng());

  // Isolated root/config: never load the site's environment or catalog provider.
  await build({ root: rootURL, logLevel: 'warn' });
  const html = await readFile(new URL('dist/index.html', rootURL), 'utf8');
  assert.match(html, /<figure><img[^>]+width="640"[^>]+height="360"/);
  assert.match(html, /<figcaption>Caption with &lt;characters&gt; &amp; punctuation<\/figcaption>/);
  assert.match(html, /<\/figure>\s*<aside data-proof-cta/);
  assert.equal((html.match(/data-proof-cta/g) || []).length, 1);
  assert.match(html, /<a href="\/en\/blog\/target\/">alpha phrase<\/a>/);
  assert.ok(!html.includes('__ASTRO_IMAGE_'));
  const figure = html.match(/<figure>([\s\S]*?)<\/figure>/)[1];
  assert.ok(!figure.includes(' title='));
  assert.match(figure, /srcset=/);
  assert.match(figure, /loading="lazy"/);
  const sources = [...html.matchAll(/\bsrc="(\/_astro\/[^"?]+\.webp)"/g)].map(match => match[1]);
  assert.equal(sources.length, 2, 'hero and body both use optimized WebP');
  for (const path of sources) {
    const bytes = await readFile(new URL(`dist${path}`, rootURL));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  assert.equal(JSON.parse(await readFile(snapshot, 'utf8')).length, 2);
  console.log('PASS: metadata-first two-pass collection rendering avoids a collection/render cycle.');
  console.log('PASS: colocated hero/body images produce real WebP, dimensions and responsive srcset.');
  console.log('PASS: escaped caption, link and exactly one CTA survive native AST transforms.');

  server = await dev({ root: rootURL, logLevel: 'warn', server: { host: '127.0.0.1', port: 0 } });
  const url = `http://127.0.0.1:${server.address.port}/`;
  const fetchPage = async () => {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    return response.text();
  };
  assert.match(await fetchPage(), /<a href="\/en\/blog\/target\/">alpha phrase<\/a>/);
  await save('src/content/blog/en/target/index.md', target('beta phrase'));
  await waitFor(async () => (await readFile(snapshot, 'utf8')).includes('beta phrase'), 'loader snapshot updates after target edit');
  await waitFor(async () => {
    const updated = await fetchPage();
    return updated.includes('>beta phrase</a>') && !updated.includes('>alpha phrase</a>');
  }, 'unchanged source article refreshes after target keyword edit');
  console.log('PASS: dev target keyword edit updates links in an unchanged source article.');
  await save('src/content/blog/en/target/index.md', target('beta phrase', true));
  await waitFor(async () => !(await fetchPage()).includes('/en/blog/target/'), 'draft target removed from derived links');
  console.log('PASS: dev draft change removes stale target links.');
  passed = true;
} finally {
  if (server) await server.stop();
  // Bounded cleanup: only this runner's newly-created directory is removable.
  const child = relative(scratch, root);
  assert.ok(child.startsWith('run-') && !child.includes(sep) && !child.startsWith('..'));
  await rm(root, { recursive: true, force: true });
  if (passed) {
    const sitePages = await readdir(resolve(appRoot, 'src/pages'));
    assert.ok(!sitePages.includes('blog-pipeline-proof.astro'));
    console.log('PASS: temporary project removed; no fixture route/content added to the application.');
  }
}
