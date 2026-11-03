import { expect, it } from 'vitest';
import { articleStructuredData, serializeStructuredData } from '../../seo';
import type { BlogPost } from '../../../domain/models';
const post = { lang: 'en', slug: 'sample', title: 'Sample title', description: 'Description', pubDate: '2026-01-01',
  destination: 'cairo', hero: { alt: 'Illustration' } } as BlogPost;
const context = { site: 'https://fabioegypt.com', assetOrigin: 'https://preview.example', image: { src: '/image.jpg', width: 1200, height: 800 }, home: 'Home', journal: 'Journal', destination: 'Cairo' };
it('describes the visible article, approved author and ordered breadcrumbs with absolute URLs', () => {
  const graph = articleStructuredData(post, { type: 'Person', name: 'Approved test author', url: 'https://example.com/author' }, context)['@graph'];
  expect(graph[0]).toMatchObject({ '@type': 'BlogPosting', url: 'https://fabioegypt.com/en/blog/sample/', inLanguage: 'en', datePublished: '2026-01-01T00:00:00.000Z', author: { '@type': 'Person', name: 'Approved test author' }, image: { url: 'https://preview.example/image.jpg' } });
  expect(graph[0]).not.toHaveProperty('dateModified');
  expect(graph[1]).toMatchObject({ itemListElement: [{ position: 1 }, { position: 2 }, { position: 3 }, { position: 4 }] });
});
it('includes a supplied update date and omits an absent destination crumb', () => {
  const graph = articleStructuredData({ ...post, destination: undefined, updatedDate: '2026-02-01' }, { name: 'Approved organization', type: 'Organization' }, context)['@graph'];
  expect(graph[0]).toHaveProperty('dateModified', '2026-02-01T00:00:00.000Z');
  expect(graph[1].itemListElement).toHaveLength(3);
});
it('serializes malicious closing tags as JSON data without creating executable markup', () => {
  const value = { name: '</script><script>alert(1)</script> & "' };
  const result = serializeStructuredData(value);
  expect(result).not.toContain('<'); expect(JSON.parse(result)).toEqual(value);
});
