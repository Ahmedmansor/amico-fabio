import { describe, expect, it } from 'vitest';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { blogMarkdownPlugins } from '../processor';
import { ctaCardHtml } from '../cta';
import type { MarkdownContext } from '../../../data/markdown-context';

const context: MarkdownContext = {
  current: { id: 'demo', title: 'Demo current article', slug: 'demo', lang: 'en', pubDate: '2026-01-01', draft: false, fixture: true,
    linkKeywords: [], relatedTripIds: [], sourcePath: 'en/demo/index.md' }, records: [],
  policy: { evaluatedAt: Date.parse('2026-10-28'), includeFixtures: true },
};
async function render(body: string, article = true) {
  const processor = await createSatteriMarkdownProcessor({ syntaxHighlight: false,
    hastPlugins: blogMarkdownPlugins(() => article ? context : undefined) });
  return processor.render(body, { fileURL: new URL('file:///proof/src/content/blog/en/demo/index.md') });
}

async function linked(body: string) {
  const current = context.current;
  const target = { ...current, id: 'target', title: 'Diving article title', slug: 'target', fixture: false, linkKeywords: ['Red Sea diving'], sourcePath: 'en/target/index.md' };
  const other = { ...current, id: 'other', slug: 'other', fixture: false, linkKeywords: ['Red Sea'], sourcePath: 'en/other/index.md' };
  const foreign = { ...target, id: 'foreign', lang: 'it' as const, linkKeywords: ['keyword italiano'] };
  const draft = { ...target, id: 'draft', slug: 'draft', draft: true, linkKeywords: ['secret keyword'] };
  const processor = await createSatteriMarkdownProcessor({ syntaxHighlight: false,
    hastPlugins: blogMarkdownPlugins(() => ({ ...context, records: [current, target, other, foreign, draft] })) });
  return (await processor.render(body)).code;
}

describe('native blog figures and CTA placement', () => {
  it('keeps local image metadata and safely moves title into a caption', async () => {
    const result = await render('![Meaningful image](./image.webp "<cairo> & elsewhere")');
    expect(result.metadata.localImagePaths).toEqual(['./image.webp']);
    expect(result.code).toContain('<figure>');
    expect(result.code).toContain('<figcaption>&lt;cairo&gt; &amp; elsewhere</figcaption>');
    expect(result.code).not.toContain(' title=');
    expect(result.code).toMatch(/<\/figure><section class="blog-cta blog-cta-compact"/);
  });
  it('inserts only once after the first of multiple body images', async () => {
    const { code } = await render('![First image](./first.webp)\n\n![Second image](./second.webp)');
    expect(code.match(/class="blog-cta blog-cta-compact"/g)).toHaveLength(1);
    expect(code.indexOf('blog-cta-compact')).toBeLessThan(code.lastIndexOf('<figure>'));
  });
  it('places the CTA after the top-level ancestor of an image inside a list', async () => {
    const { code } = await render('- ![Nested image](./nested.webp "Caption")');
    expect(code).toMatch(/<\/ul><section class="blog-cta blog-cta-compact"/);
    expect(code).toContain('<figure>');
    expect(code.match(/<li>([\s\S]*?)<\/li>/)?.[1]).not.toContain('<section');
  });
  it('falls back before the second H2 and emits none for short no-image content', async () => {
    const long = await render('## One\n\nText.\n\n## Two\n\nMore text.');
    expect(long.code.indexOf('blog-cta-compact')).toBeLessThan(long.code.indexOf('id="two"'));
    const short = await render('## One\n\nText.');
    expect(short.code).not.toContain('blog-cta-compact');
  });
  it('rejects missing body alt with source context', async () => {
    await expect(render('![](./bad.webp)')).rejects.toThrow(/en\/demo\/index.md.*alt/);
  });
  it('leaves non-blog Markdown alone', async () => {
    const { code } = await render('## One\n\nText.\n\n## Two', false);
    expect(code).not.toContain('blog-cta');
  });
  it('uses the same localized safe CTA source as the component', () => {
    expect(ctaCardHtml('it')).toContain('Pianifica il tuo viaggio');
    expect(ctaCardHtml('en', true)).toContain('blog-cta-compact');
    expect(ctaCardHtml('en')).toContain('rel="noopener noreferrer"');
  });
});

describe('native article automatic links', () => {
  it('turns a mentioned title into an anchor without requiring a keyword alias', async () => {
    const code = await linked('Diving article title. Diving article title.');
    expect(code.match(/href="\/en\/blog\/target\/"/g)).toHaveLength(1);
    expect(code).toContain('>Diving article title</a>');
  });
  it('links first eligible text only and never drafts or another language', async () => {
    const code = await linked('Red Sea diving, Red Sea diving. keyword italiano; secret keyword.');
    expect(code.match(/href="\/en\/blog\/target\/"/g)).toHaveLength(1);
    expect(code).not.toMatch(/href="[^\"]*(?:foreign|draft)/);
  });
  it('excludes headings, existing links and code while linking ordinary text', async () => {
    const code = await linked('## Red Sea diving\n\n`Red Sea diving`\n\n```text\nRed Sea diving\n```\n\nRed Sea diving.');
    expect(code.match(/href="\/en\/blog\/target\/"/g)).toHaveLength(1);
    expect(code).toMatch(/<h2[^>]*>Red Sea diving<\/h2>/);
    expect(code).toContain('<code>Red Sea diving</code>');
  });
  it('suppresses any target manually linked later in the article', async () => {
    const code = await linked('Red Sea diving.\n\n[Manual destination](/en/blog/target/)');
    expect(code.match(/href="\/en\/blog\/target\/"/g)).toHaveLength(1);
    expect(code).toContain('>Manual destination</a>');
  });
  it('excludes captions, inline raw no-autolink markup and raw anchors', async () => {
    const code = await linked('![Image alt](./hero.webp "Red Sea diving")\n\n<span data-no-autolink>Red Sea diving</span>\n\nRed Sea diving.');
    expect(code).toContain('<figcaption>Red Sea diving</figcaption>');
    expect(code).toContain('<span data-no-autolink>Red Sea diving</span>');
    expect(code.match(/href="\/en\/blog\/target\/"/g)).toHaveLength(1);
    const manual = await linked('Red Sea diving. <a href="/en/blog/target/">Manual link</a>');
    expect(manual.match(/href="\/en\/blog\/target\/"/g)).toHaveLength(1);
  });
});
