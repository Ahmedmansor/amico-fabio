import { describe, expect, it } from 'vitest';
import type { BlogPost } from '../models';
import { getActiveTaxonomy, getFeaturedPost, getPostsByDestination, getPostsByInterest, getPublishedPosts } from '../publication';
import { articleUrl, getTranslations } from '../translations';
import { getRelatedPosts, relatedScore } from '../related-posts';
import { readingTimeMinutes } from '../reading-time';

const policy = { evaluatedAt: Date.parse('2026-10-28T00:00:00Z'), includeFixtures: false };
function post(id: string, changes: Partial<BlogPost> = {}): BlogPost {
  return {
    id, slug: id, lang: 'it', title: id, description: 'Placeholder description for domain tests only.',
    pubDate: '2026-10-01', interests: ['tips'], hero: { src: './hero.webp', width: 640, height: 360, alt: 'Placeholder' },
    linkKeywords: [], relatedTripIds: [], featured: false, draft: false, fixture: false,
    body: '', sourcePath: `it/${id}/index.md`, ...changes,
  };
}

describe('publication and taxonomy', () => {
  it('filters draft, future, fixture and foreign-language entries without mutating input', () => {
    const input = [post('visible'), post('draft', { draft: true }), post('future', { pubDate: '2026-10-29' }),
      post('fixture', { fixture: true }), post('english', { lang: 'en' })];
    expect(getPublishedPosts(input, 'it', policy).map(item => item.id)).toEqual(['visible']);
    expect(input.map(item => item.id)).toEqual(['visible', 'draft', 'future', 'fixture', 'english']);
    expect(getPublishedPosts(input, 'it', { ...policy, includeFixtures: true }).map(item => item.id)).toEqual(['fixture', 'visible']);
  });
  it('uses the captured UTC boundary and sorts by date, title and stable ID', () => {
    const input = [post('z', { title: 'Same' }), post('a', { title: 'Same' }), post('today', { pubDate: '2026-10-28' }),
      post('later', { pubDate: '2026-10-28T00:00:01Z' }), post('b', { title: 'Before' })];
    expect(getPublishedPosts(input, 'it', policy).map(item => item.id)).toEqual(['today', 'b', 'a', 'z']);
  });
  it('fails explicitly on invalid evaluation time or selected publication date', () => {
    expect(() => getPublishedPosts([], 'it', { ...policy, evaluatedAt: NaN })).toThrow('evaluatedAt');
    expect(() => getPublishedPosts([post('bad', { pubDate: 'invalid' })], 'it', policy)).toThrow('it/bad/index.md');
  });
  it('filters city and interest using the same publication policy', () => {
    const input = [post('cairo', { destination: 'cairo', interests: ['history', 'tips'] }),
      post('hidden', { destination: 'cairo', interests: ['history'], draft: true }), post('general')];
    expect(getPostsByDestination(input, 'it', 'cairo', policy).map(item => item.id)).toEqual(['cairo']);
    expect(getPostsByInterest(input, 'it', 'history', policy).map(item => item.id)).toEqual(['cairo']);
  });
  it('counts only active same-language taxonomy and leaves absent cities empty', () => {
    const input = [post('a', { destination: 'cairo', interests: ['history', 'tips'] }), post('b'),
      post('other', { lang: 'en', destination: 'aswan', interests: ['stories'] }),
      post('hidden', { destination: 'luxor', draft: true })];
    expect(getActiveTaxonomy(input, 'it', policy)).toEqual({ destinations: [{ slug: 'cairo', count: 1 }],
      interests: [{ slug: 'history', count: 1 }, { slug: 'tips', count: 2 }] });
    expect(getActiveTaxonomy([], 'it', policy)).toEqual({ destinations: [], interests: [] });
  });
  it('uses newest featured, newest fallback, and undefined for an empty list', () => {
    const input = [post('newest', { pubDate: '2026-10-27' }), post('featured', { featured: true }),
      post('old-featured', { pubDate: '2026-09-01', featured: true })];
    expect(getFeaturedPost(input, 'it', policy)?.id).toBe('featured');
    expect(getFeaturedPost(input.map(item => ({ ...item, featured: false })), 'it', policy)?.id).toBe('newest');
    expect(getFeaturedPost([], 'it', policy)).toBeUndefined();
  });
});

describe('translation identity', () => {
  it('builds flat routes independent of taxonomy', () => {
    expect(articleUrl(post('a', { slug: 'guida-al-cairo', destination: 'cairo' }))).toBe('/it/blog/guida-al-cairo/');
  });
  it('connects different slugs by translationKey, with reciprocal self references', () => {
    const itPost = post('it-id', { slug: 'guida-al-cairo', translationKey: 'cairo-guide' });
    const enPost = post('en-id', { lang: 'en', slug: 'cairo-guide', translationKey: 'cairo-guide' });
    const expected = { it: '/it/blog/guida-al-cairo/', en: '/en/blog/cairo-guide/' };
    expect(getTranslations(itPost, [itPost, enPost], policy)).toEqual(expected);
    expect(getTranslations(enPost, [itPost, enPost], policy)).toEqual(expected);
  });
  it('never invents equivalents for unpaired, hidden or unpublished source entries', () => {
    const source = post('source', { translationKey: 'key' });
    const en = post('en', { lang: 'en', translationKey: 'key', draft: true });
    expect(getTranslations(source, [source, en], policy)).toEqual({});
    expect(getTranslations(post('none'), [source, en], policy)).toEqual({});
    expect(getTranslations(en, [source, en], policy)).toEqual({});
  });
  it('fails instead of overwriting ambiguous same-language translations', () => {
    const source = post('source', { translationKey: 'key' });
    const duplicate = post('duplicate', { translationKey: 'key' });
    const en = post('en', { lang: 'en', translationKey: 'key' });
    expect(() => getTranslations(source, [source, duplicate, en], policy)).toThrow('Duplicate translationKey');
  });
});

describe('related posts', () => {
  const source = post('source', { destination: 'cairo', interests: ['history', 'tips'] });
  it('scores only a shared nonempty city and distinct interests', () => {
    expect(relatedScore(source, post('match', { destination: 'cairo', interests: ['history', 'tips'] }))).toBe(7);
    expect(relatedScore(post('general'), post('other', { interests: ['food'] }))).toBe(0);
    expect(relatedScore(source, source)).toBe(0);
    expect(relatedScore(source, post('english', { lang: 'en', destination: 'cairo' }))).toBe(0);
  });
  it('ranks by score, recency, stable ID and excludes hidden/zero/foreign/self', () => {
    const input = [source, post('zero', { interests: ['food'] }), post('older', { destination: 'cairo' }),
      post('newer', { destination: 'cairo', pubDate: '2026-10-27' }),
      post('a', { destination: 'cairo' }), post('best', { destination: 'cairo', interests: ['history', 'tips'] }),
      post('hidden', { destination: 'cairo', draft: true }), post('en', { lang: 'en', destination: 'cairo' })];
    expect(getRelatedPosts(source, input, policy).map(item => item.id)).toEqual(['best', 'newer', 'a']);
  });
  it('returns fewer results without fillers and respects zero/custom limits', () => {
    const input = [post('one'), post('foreign', { lang: 'en' })];
    expect(getRelatedPosts(source, input, policy).map(item => item.id)).toEqual(['one']);
    expect(getRelatedPosts(source, input, policy, 0)).toEqual([]);
    expect(() => getRelatedPosts(source, input, policy, -1)).toThrow('limit');
    expect(() => getRelatedPosts(source, input, policy, 1.5)).toThrow('limit');
  });
});

describe('reading time', () => {
  it('uses 200 words per minute with a minimum of one', () => {
    expect(readingTimeMinutes('')).toBe(1);
    expect(readingTimeMinutes('parola '.repeat(200))).toBe(1);
    expect(readingTimeMinutes('parola '.repeat(201))).toBe(2);
    expect(readingTimeMinutes('parola '.repeat(401))).toBe(3);
  });
  it('ignores image URLs, link destinations, tags, reference definitions and fenced code', () => {
    const input = `![${'image '.repeat(300)}](./hero.webp)\n[Read](https://example.invalid/${'path/'.repeat(300)})\n` +
      `\n\`\`\`js\n${'code '.repeat(300)}\n\`\`\`\n\n[reference]: https://example.invalid/${'path/'.repeat(300)}\n<strong>Text</strong>`;
    expect(readingTimeMinutes(input)).toBe(1);
  });
  it('counts Italian elisions and Unicode words without treating accents as separators', () => {
    expect(readingTimeMinutes("dell'Egitto città l’acqua ".repeat(66))).toBe(1);
    expect(readingTimeMinutes("dell'Egitto città l’acqua ".repeat(67))).toBe(2);
  });
});
