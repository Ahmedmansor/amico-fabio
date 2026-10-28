import { describe, expect, it } from 'vitest';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { blogMarkdownPlugins } from '../processor';
import { ctaCardHtml } from '../cta';
import type { MarkdownContext } from '../../../data/markdown-context';

const context: MarkdownContext = {
  current: { id: 'demo', slug: 'demo', lang: 'en', pubDate: '2026-01-01', draft: false, fixture: true,
    linkKeywords: [], relatedTripIds: [], sourcePath: 'en/demo/index.md' }, records: [],
  policy: { evaluatedAt: Date.parse('2026-10-28'), includeFixtures: true },
};
async function render(body: string, article = true) {
  const processor = await createSatteriMarkdownProcessor({ syntaxHighlight: false,
    hastPlugins: blogMarkdownPlugins(() => article ? context : undefined) });
  return processor.render(body, { fileURL: new URL('file:///proof/src/content/blog/en/demo/index.md') });
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
