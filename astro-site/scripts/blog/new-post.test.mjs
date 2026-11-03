import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { createDraft } from './new-post.mjs';

test('creates a colocated unpublished draft and refuses overwriting; invalid inputs create no folder', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'blog-draft-'));
  try {
    const image = join(scratch, 'approved-input.png');
    await sharp({ create: { width: 32, height: 24, channels: 3, background: 'navy' } }).png().toFile(image);
    const root = join(scratch,'content');
    const options = { root, lang:'en', slug:'test-draft', image, title:'A supplied draft title', description:'A supplied description long enough for a valid draft article.', alt:'Approved test image', interest:'tips', now:new Date('2026-10-28T00:00:00Z') };
    const result = await createDraft(options);
    assert.equal(result.metadata.draft, true);
    assert.equal(result.metadata.pubDate, '2026-10-28');
    assert.match(result.metadata.id, /^en-[a-f\d-]+$/);
    assert.equal(result.metadata.authorId, undefined);
    assert.equal((await sharp(await readFile(join(result.directory,'hero.webp'))).metadata()).format, 'webp');
    const initial = await readFile(join(result.directory,'index.md'),'utf8');
    await assert.rejects(createDraft(options), /Refusing to overwrite/);
    assert.equal(await readFile(join(result.directory,'index.md'),'utf8'),initial);
    for (const patch of [{lang:'ar'},{slug:'../escape'},{slug:'page'},{interest:'histroy'},{alt:''},{image:''},{title:'Short'},{description:'Short'}]) await assert.rejects(createDraft({...options, ...patch}));
    assert.deepEqual(await readdir(join(root,'en')), ['test-draft']);
  } finally { await rm(scratch,{recursive:true,force:true}); }
});
