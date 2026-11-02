import type { Locale } from '../../../shared/config/languages';
import { blogLocales } from '../../../shared/config/languages';
import type { BlogAlternates } from './models';

export type ListingKind = 'home' | 'destinations' | 'interests';
export const blogPageSize = 9;

export function listingUrl(lang: Locale, kind: ListingKind = 'home', slug?: string, page = 1): string {
  const base = `/${lang}/blog/${kind === 'home' ? '' : `${kind}/${slug}/`}`;
  return page > 1 ? `${base}page/${page}/` : base;
}

export function listingPageCount(total: number): number { return Math.max(1, Math.ceil(total / blogPageSize)); }

export interface ListingDescriptor { lang: Locale; kind: ListingKind; slug?: string; total: number }

export function getListingAlternates(group: ListingDescriptor, groups: readonly ListingDescriptor[], page: number) {
  const head: BlogAlternates = {}, navigation: BlogAlternates = {};
  for (const lang of blogLocales) {
    const equivalent = groups.find(item => item.lang === lang && item.kind === group.kind && item.slug === group.slug);
    const existing = equivalent && page <= listingPageCount(equivalent.total);
    navigation[lang] = existing ? listingUrl(lang, group.kind, group.slug, page) : listingUrl(lang);
    if (existing) head[lang] = navigation[lang];
  }
  return { head: Object.keys(head).length > 1 ? head : {}, navigation };
}
