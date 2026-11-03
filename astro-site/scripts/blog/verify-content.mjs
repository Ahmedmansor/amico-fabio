// Focused real Astro content-sync checks; no site build, catalog or email calls.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const app = fileURLToPath(new URL('../../', import.meta.url));
const astroPackage = JSON.parse(await readFile(resolve(app, 'node_modules/astro/package.json'), 'utf8'));
const astroCli = resolve(app, 'node_modules/astro', astroPackage.bin.astro);
const scratch = resolve(app, 'qa/blog/.pipeline');
await mkdir(scratch, { recursive: true });
const feature = new URL('../../src/features/blog/data/', import.meta.url);

function content(id, keyword = 'fixture keyword', interest = 'tips', alt = true) {
  return `---
id: ${id}
title: "[FIXTURE] Content schema check ${id}"
description: "This artificial description exists only for isolated content validation."
pubDate: 2026-01-01
lang: en
interests: [${interest}]
heroImage: ./hero.svg
${alt ? 'heroAlt: "Solid placeholder test image"' : ''}
linkKeywords: ["${keyword}"]
fixture: true
---
Artificial content for content-validation tests only.
`;
}

async function scenario(name, entries, errorPattern) {
  const root = await mkdtemp(resolve(scratch, 'run-'));
  const rootURL = pathToFileURL(root + sep);
  try {
    await writeFile(new URL('package.json', rootURL), '{"type":"module","private":true}');
    await writeFile(new URL('astro.config.mjs', rootURL), 'export default {output:"static"};');
    await mkdir(new URL('src/', rootURL));
    await writeFile(new URL('src/content.config.ts', rootURL), `
import {defineCollection} from 'astro:content';
import {blogSchema} from '${new URL('content-schema.ts', feature).href}';
import {blogLoader} from '${new URL('loader.ts', feature).href}';
export const collections={blog:defineCollection({schema:blogSchema,loader:blogLoader({evaluatedAt:1793145600000,includeFixtures:true})})};
`);
    for (const [slug, markdown] of entries) {
      const folder = new URL(`src/content/blog/en/${slug}/`, rootURL);
      await mkdir(folder, { recursive: true });
      await writeFile(new URL('index.md', folder), markdown);
      await writeFile(new URL('hero.svg', folder), '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="navy"/></svg>');
    }
    // A separate CLI process also contains Astro's background store timers when
    // a deliberately invalid schema aborts sync before normal cleanup.
    const result = await new Promise((done, fail) => {
      const child = spawn(process.execPath, [astroCli, 'sync', '--root', root],
        { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', data => { output += data; });
      child.stderr.on('data', data => { output += data; });
      child.on('error', fail);
      child.on('close', code => done({ code, output }));
    });
    if (errorPattern) {
      assert.notEqual(result.code, 0, result.output);
      assert.match(result.output, errorPattern);
    } else assert.equal(result.code, 0, result.output);
    console.log(`PASS: ${name}`);
  } finally {
    const child = relative(scratch, root);
    assert.ok(child.startsWith('run-') && !child.includes(sep));
    await rm(root, { recursive: true, force: true });
  }
}

await scenario('valid colocated article passes real Astro schema/loader sync', [['article', content('article-en')]]);
await scenario('unknown interest is rejected with record/field context', [['bad-interest', content('article-en', 'fixture keyword', 'histroy')]], /bad-interest[\s\S]*interests|interests[\s\S]*bad-interest/);
await scenario('missing heroAlt is rejected with record/field context', [['bad-alt', content('article-en', 'fixture keyword', 'tips', false)]], /heroAlt/);
await scenario('normalized duplicate keyword reports both actual article files', [
  ['first', content('first-en', 'Fixture Keyword')], ['second', content('second-en', ' fixture   keyword ')],
], /en\/second\/index.md[\s\S]*en\/fixture keyword[\s\S]*en\/first\/index.md/);
