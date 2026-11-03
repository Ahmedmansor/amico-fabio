import { isLocale } from '../../../shared/config/languages.ts';
import type { BlogPost, PublicationPolicy } from './models';
import { isPublished } from './publication.ts';
import { reservedSlugs } from './taxonomy.ts';

export type BlogIndexRecord = Pick<BlogPost, 'id' | 'title' | 'slug' | 'lang' | 'translationKey' | 'pubDate' |
  'draft' | 'fixture' | 'linkKeywords' | 'authorId' | 'relatedTripIds' | 'sourcePath'>;

export function normalizeLinkKeyword(keyword: string): string {
  return keyword.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');
}

/** The visible title is a built-in phrase; keywords provide additional aliases. */
export function getAutomaticLinkPhrases(record: Pick<BlogIndexRecord, 'title' | 'linkKeywords'>): string[] {
  return [...new Set([record.title, ...record.linkKeywords].map(normalizeLinkKeyword))];
}

export function articlePathParts(relativeEntry: string): { lang: BlogPost['lang']; slug: string } {
  const parts = relativeEntry.replaceAll('\\', '/').split('/');
  if (parts.length !== 3 || parts[2] !== 'index.md' || !isLocale(parts[0])) {
    throw new Error(`[blog:${relativeEntry}] Expected {supported-language}/{slug}/index.md.`);
  }
  const slug = parts[1];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reservedSlugs.some(value => value === slug)) {
    throw new Error(`[blog:${relativeEntry}] Invalid or reserved slug: ${slug}.`);
  }
  return { lang: parts[0], slug };
}

export function validatePostIndex(records: readonly BlogIndexRecord[], policy: PublicationPolicy,
  references: { authorIds: ReadonlySet<string>; tripIds: ReadonlySet<string> }) {
  const ids = new Map<string, string>(), slugs = new Map<string, string>(), translations = new Map<string, string>();
  const keywords = new Map<string, string>();
  const claim = (map: Map<string, string>, key: string, record: BlogIndexRecord, field: string) => {
    const previous = map.get(key);
    if (previous) throw new Error(`[blog:${record.sourcePath}] Duplicate ${field} "${key}"; already claimed by ${previous}.`);
    map.set(key, record.sourcePath);
  };
  for (const record of records) {
    claim(ids, record.id, record, 'id');
    claim(slugs, `${record.lang}/${record.slug}`, record, 'slug');
    if (record.translationKey) claim(translations, `${record.lang}/${record.translationKey}`, record, 'translationKey');
    if (record.authorId && !references.authorIds.has(record.authorId)) {
      throw new Error(`[blog:${record.sourcePath}] Unknown authorId: ${record.authorId}.`);
    }
    for (const id of record.relatedTripIds) if (!references.tripIds.has(id)) {
      throw new Error(`[blog:${record.sourcePath}] Unknown relatedTripIds entry: ${id}.`);
    }
    if (isPublished(record, policy)) for (const keyword of getAutomaticLinkPhrases(record)) {
      claim(keywords, `${record.lang}/${keyword}`, record, 'automatic link phrase (title/linkKeywords)');
    }
  }
}
