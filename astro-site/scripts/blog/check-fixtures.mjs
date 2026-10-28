import { readFile } from 'node:fs/promises';
import { guardBlogOutput } from '../../src/features/blog/data/build-guard.mjs';

const root = new URL('../../', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('.astro/blog/index.json', root), 'utf8'));
const count = await guardBlogOutput(new URL('dist/', root), { records: snapshot.records });
console.log(`PASS: ${count} generated text files are free from blog fixture content.`);
