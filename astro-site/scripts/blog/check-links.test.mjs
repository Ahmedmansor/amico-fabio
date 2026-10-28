import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkBlogLinks } from './check-links.mjs';

async function artifact(run) {
  const root = await mkdtemp(join(tmpdir(), 'blog-links-'));
  const put = async (route, body) => { await mkdir(join(root, route), { recursive: true }); await writeFile(join(root, route, 'index.html'), body); };
  try { await run(root, put); } finally { await rm(root, { recursive: true, force: true }); }
}
const page = (lang, content = '', head = '') => `<html lang="${lang}"><head><link rel="canonical" href="https://fabioegypt.com/${lang}/blog/">${head}</head><body><h1>Blog</h1><h2 id="section">Heading</h2>${content}</body></html>`;
test('accepts actual fragments, switches and reciprocal translated pages; campaign destinations have their own semantics', () => artifact(async (root, put) => {
  for (const lang of ['it','en']) await put(`${lang}/blog`, page(lang, `<a href="#section">Local</a><a href="/welcome/">Campaign</a><a data-lang-switch href="/${lang === 'it' ? 'en' : 'it'}/blog/">Switch</a>`, ['it','en'].map(l=>`<link rel="alternate" hreflang="${l}" href="https://fabioegypt.com/${l}/blog/">`).join('')));
  await put('welcome', '<html lang="it"><body>Campaign</body></html>');
  assert.equal(await checkBlogLinks(root), 2);
}));
for (const [name, html, diagnostic] of [
  ['broken path', '<a href="/it/missing/">Bad</a>', /missing target/],
  ['broken fragment', '<a href="#absent">Bad</a>', /missing fragment/],
  ['language leak', '<a href="/en/blog/">Bad</a>', /language leak/],
  ['missing image alt', '<img src="/image.webp">', /missing image alt/],
]) test(`rejects ${name}`, () => artifact(async (root, put) => {
  await put('it/blog', page('it', html)); await put('en/blog', page('en'));
  await assert.rejects(checkBlogLinks(root), diagnostic);
}));
test('rejects nonreciprocal alternates', () => artifact(async (root, put) => {
  await put('it/blog', page('it', '', '<link rel="alternate" hreflang="en" href="/en/blog/">'));
  await put('en/blog', page('en'));
  await assert.rejects(checkBlogLinks(root), /nonreciprocal/);
}));
