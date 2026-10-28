import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { blogSchema } from '../content-schema';
import { createPublicationPolicy } from '../publication-context';
import { articlePathParts, normalizeLinkKeyword, validatePostIndex, type BlogIndexRecord } from '../../domain/validation';

// Image resolution itself belongs to Astro and is exercised by phase 1.
const schema = blogSchema({ image: () => z.string().min(1) } as unknown as SchemaContext);
const input = {
  id: 'version-it', title: 'Fixture article title', description: 'A placeholder description long enough for content schema validation.',
  pubDate: '2026-10-01', lang: 'it', interests: ['tips'], heroImage: './hero.webp', heroAlt: 'Placeholder image', authorId: 'approved',
};
const policy = { evaluatedAt: Date.parse('2026-10-28T00:00:00Z'), includeFixtures: false };
const references = { authorIds: new Set(['approved']), tripIds: new Set(['known-trip']) };
function record(id: string, changes: Partial<BlogIndexRecord> = {}): BlogIndexRecord {
  return { id, title: `Test article ${id}`, slug: id, lang: 'it', pubDate: '2026-10-01', draft: false, fixture: false,
    linkKeywords: [], relatedTripIds: [], sourcePath: `it/${id}/index.md`, ...changes };
}

describe('frontmatter schema', () => {
  it('normalizes keywords and supplies safe empty/default fields', () => {
    const parsed = schema.parse({ ...input, linkKeywords: ['  Guida   DEL Cairo  '] });
    expect(parsed.linkKeywords).toEqual(['guida del cairo']);
    expect(parsed.draft).toBe(false);
    expect(parsed.fixture).toBe(false);
    expect(parsed.relatedTripIds).toEqual([]);
    expect(parsed.featured).toBe(false);
  });
  it.each(['title', 'description', 'pubDate', 'lang', 'heroImage', 'heroAlt', 'id', 'interests'])('rejects missing %s', key => {
    const invalid: Record<string, unknown> = { ...input };
    delete invalid[key];
    expect(schema.safeParse(invalid).success).toBe(false);
  });
  it('rejects misspelled or duplicate interests and unknown fields', () => {
    expect(schema.safeParse({ ...input, interests: ['histroy'] }).success).toBe(false);
    expect(schema.safeParse({ ...input, interests: ['tips', 'tips'] }).success).toBe(false);
    expect(schema.safeParse({ ...input, keywords: ['old-field'] }).success).toBe(false);
  });
  it('rejects impossible dates, missing timezones, inverted updates and duplicate trips', () => {
    expect(schema.safeParse({ ...input, pubDate: '2026-02-30' }).success).toBe(false);
    expect(schema.safeParse({ ...input, pubDate: '2026-10-01T10:00:00' }).success).toBe(false);
    expect(schema.safeParse({ ...input, updatedDate: '2026-09-01' }).success).toBe(false);
    expect(schema.safeParse({ ...input, relatedTripIds: ['known-trip', 'known-trip'] }).success).toBe(false);
  });
});

describe('file identity and cross-record checks', () => {
  it('rejects title/alias ambiguity with both owners and permits the same title alias on its own article', () => {
    expect(()=>validatePostIndex([record('old',{title:'Guida del Cairo'}),record('new',{linkKeywords:[' guida  del cairo ']})],policy,references))
      .toThrow(/new\/index.md.*title\/linkKeywords.*old\/index.md/);
    expect(()=>validatePostIndex([record('old',{title:'Guida del Cairo',linkKeywords:['Guida del Cairo']})],policy,references)).not.toThrow();
  });
  it('supports colocated Windows paths and rejects wrong/reserved paths', () => {
    expect(articlePathParts('it\\guida-al-cairo\\index.md')).toEqual({ lang: 'it', slug: 'guida-al-cairo' });
    for (const path of ['fr/article/index.md', 'it/page/index.md', 'it/interests/index.md', 'it/bad_slug/index.md', 'it/a.md', 'it/a/b/index.md']) {
      expect(() => articlePathParts(path)).toThrow(path);
    }
  });
  it('allows the same slug in language equivalents but not duplicate IDs', () => {
    const itPost = record('it-id', { slug: 'shared', translationKey: 'key' });
    const enPost = record('en-id', { lang: 'en', slug: 'shared', translationKey: 'key', sourcePath: 'en/shared/index.md' });
    expect(() => validatePostIndex([itPost, enPost], policy, references)).not.toThrow();
    expect(() => validatePostIndex([itPost, { ...enPost, id: 'it-id' }], policy, references)).toThrow('Duplicate id');
  });
  it('rejects duplicate language-specific slugs and translation keys, including drafts', () => {
    expect(() => validatePostIndex([record('a'), record('b', { slug: 'a', draft: true })], policy, references)).toThrow('Duplicate slug');
    expect(() => validatePostIndex([record('a', { translationKey: 'same' }), record('b', { translationKey: 'same', draft: true })], policy, references)).toThrow('Duplicate translationKey');
  });
  it('reports normalized keyword, language and both conflicting files', () => {
    const records = [record('old', { linkKeywords: ['Guida  DEL Cairo'] }), record('new', { linkKeywords: [' guida del cairo '] })];
    expect(() => validatePostIndex(records, policy, references)).toThrow(/it\/new\/index.md.*it\/guida del cairo.*it\/old\/index.md/);
  });
  it('keeps accents significant and ignores nonpublished keyword claims', () => {
    expect(normalizeLinkKeyword('  CITTÀ  ')).toBe('città');
    const records = [record('a', { linkKeywords: ['città'] }), record('b', { linkKeywords: ['citta'] }),
      record('draft', { linkKeywords: ['città'], draft: true }), record('future', { linkKeywords: ['città'], pubDate: '2026-10-29' })];
    expect(() => validatePostIndex(records, policy, references)).not.toThrow();
  });
  it('rejects unknown author and tour references even for drafts', () => {
    expect(() => validatePostIndex([record('a', { authorId: 'unknown', draft: true })], policy, references)).toThrow('Unknown authorId');
    expect(() => validatePostIndex([record('a', { relatedTripIds: ['unknown'] })], policy, references)).toThrow('relatedTripIds');
    expect(() => validatePostIndex([record('a', { authorId: 'approved', relatedTripIds: ['known-trip'] })], policy, references)).not.toThrow();
  });
});

describe('fixture publication policy', () => {
  it('requires explicit opt-in for a noindex preview and keeps ordinary production clean', () => {
    expect(createPublicationPolicy({ dev: false }, 42)).toEqual({ evaluatedAt: 42, includeFixtures: false });
    expect(createPublicationPolicy({ dev: false, noindex: '1' }, 42).includeFixtures).toBe(false);
    expect(createPublicationPolicy({ dev: false, noindex: '1', includeFixtures: '1' }, 42).includeFixtures).toBe(true);
    expect(createPublicationPolicy({ dev: true }, 42).includeFixtures).toBe(true);
  });
  it('refuses forced production/GitHub inclusion rather than silently publishing fixtures', () => {
    expect(() => createPublicationPolicy({ dev: false, includeFixtures: '1' })).toThrow('production refuses');
    expect(() => createPublicationPolicy({ dev: false, includeFixtures: '1', noindex: '1', githubActions: 'true' })).toThrow('production refuses');
  });
});
