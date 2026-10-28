import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { guardBlogOutput } from '../build-guard.mjs';

async function artifact(content, extension, verify) {
  const root = await mkdtemp(join(tmpdir(), 'fabio-blog-guard-'));
  try {
    await writeFile(join(root, `index.${extension}`), content);
    await verify(pathToFileURL(root + sep));
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('production accepts clean output and rejects markers in derived text', async () => {
  await artifact('<h1>Clean</h1>', 'html', async dir => assert.equal(await guardBlogOutput(dir), 1));
  for (const extension of ['html', 'json', 'xml', 'js']) {
    await artifact('[FIXTURE] synthetic', extension, dir => assert.rejects(() => guardBlogOutput(dir), /Fixture content/));
  }
});
test('production rejects a fixture route reference even without visible markers', async () => {
  await artifact('{"url":"/it/blog/fixture-guide/"}', 'json', dir => assert.rejects(() => guardBlogOutput(dir, {
    records: [{ fixture: true, lang: 'it', slug: 'fixture-guide' }],
  }), /Fixture content/));
});
test('production rejects natural-looking demo article and place URLs without relying on fixture names',async()=>{
  for(const route of ['/en/blog/common-tourist-traps-egypt/','/it/egypt/luxor/'])await artifact(`<a href="${route}">Read</a>`,'html',dir=>assert.rejects(()=>guardBlogOutput(dir,{records:[{fixture:true,route}]}),/Fixture content/));
});
test('preview requires noindex at both build and fixture HTML level', async () => {
  await artifact('<h1>[FIXTURE]</h1>', 'html', async dir => {
    await assert.rejects(() => guardBlogOutput(dir, { allowFixtures: true }), /noindex build/);
    await assert.rejects(() => guardBlogOutput(dir, { allowFixtures: true, noindex: true }), /missing noindex/);
  });
  await artifact('<meta name="robots" content="noindex, follow"><h1>[FIXTURE]</h1>', 'html', async dir => {
    assert.equal(await guardBlogOutput(dir, { allowFixtures: true, noindex: true }), 1);
  });
});
test('fixture XML is rejected even in an approved preview', async () => {
  await artifact('<loc>/it/blog/fixture-guide/</loc>', 'xml', dir => assert.rejects(() => guardBlogOutput(dir, {
    records: [{ fixture: true, lang: 'it', slug: 'fixture-guide' }], allowFixtures: true, noindex: true,
  }), /sitemap\/XML/));
});
