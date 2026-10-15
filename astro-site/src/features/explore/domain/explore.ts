import type { Offer } from '../../../shared/domain/offers.ts';
import { editorialBadgeKey } from '../../../shared/domain/offers.ts';
export const exploreLocations = ['all','sharm','cairo','luxor_and_aswan'] as const;
export type ExploreLocation = typeof exploreLocations[number];
export type SortOrder = 'default' | 'price_asc' | 'price_desc';
export interface ExploreSummary { id: string; location: string; category: string; displayPrice: number; score: number; sourceIndex: number }
export interface ExploreCard extends ExploreSummary { kind: 'trip' | 'package'; offer: Offer }
export interface ExploreMessages {
  seo: { title: string; description: string }; title: string;
  sort: { sort_label: string; sort_recommended: string; sort_low_high: string; sort_high_low: string };
  filters: Record<string,string>; badges: Record<string,string>;
  labels: { price_from: string; discover: string; discover_package: string; premium_package: string; no_exclusive_experiences: string };
  pagination: { page: string; of: string; previous: string; next: string };
}
export function validateExploreMessages(messages: ExploreMessages, locale: string): ExploreMessages {
  function visit(value: unknown, key: string): void {
    if (typeof value === 'string') { if (!value.trim()) throw new Error(`[explore:${locale}] Missing required text ${key}.`); }
    else if (value && typeof value === 'object') { for (const [child, text] of Object.entries(value)) visit(text, `${key}.${child}`); }
    else throw new Error(`[explore:${locale}] Invalid required text ${key}.`);
  }
  visit(messages,'messages');
  return messages;
}
export function toExploreCard(offer: Offer, kind: 'trip' | 'package', sourceIndex = 0): ExploreCard {
  return { id: offer.id, location: offer.location, category: offer.category === 'packages' ? 'bundles' : offer.category,
    displayPrice: offer.prices.adult,
    score: (offer.source.badge_it?.trim() ? 2 : 0) + (offer.source.badge_en?.trim() ? 1 : 0),
    kind, offer, sourceIndex };
}
export function locationMatches(location: string, selected: string): boolean {
  return selected === 'all' || (selected === 'luxor_and_aswan' ? location.includes('luxor') || location.includes('aswan') : location.includes(selected));
}
export function selectExploreItems<T extends ExploreSummary>(items: readonly T[], location: string, category = 'all', sort: SortOrder = 'default'): T[] {
  const filtered = items.filter(item => locationMatches(item.location, location) && (category === 'all' || item.category === category));
  return filtered.sort((a,b) => (sort === 'price_desc' ? b.displayPrice - a.displayPrice : sort === 'price_asc' ? a.displayPrice - b.displayPrice : b.score - a.score || a.displayPrice - b.displayPrice) || a.sourceIndex - b.sourceIndex);
}
export function exploreCategories(items: readonly ExploreSummary[], location: string): string[] {
  return ['all', ...Array.from(new Set(items.filter(item => locationMatches(item.location, location)).map(item => item.category))).sort()];
}
export function paginateExplore<T>(items: readonly T[], requestedPage: number) {
  const totalPages = Math.ceil(items.length / 9);
  const page = Math.max(1, Math.min(totalPages || 1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1));
  return { page, totalPages, items: items.slice((page - 1) * 9, page * 9) };
}
export function restoreExploreState(query: { sort: string | null; category: string | null; page: string | null }, stored: { sort: string | null; category: string | null; page: string | null }, returning: boolean, categories: readonly string[]) {
  const rawSort = query.sort || (returning ? stored.sort : null);
  const sort: SortOrder = rawSort === 'price_asc' || rawSort === 'price_desc' ? rawSort : 'default';
  const rawCategory = query.category || (returning ? stored.category : null) || 'all';
  const category = categories.includes(rawCategory) ? rawCategory : 'all';
  const page = Number(query.page || (returning ? stored.page : null) || '1');
  return { sort, category, page };
}
export function categoryLabel(category: string, messages: ExploreMessages): string {
  const label = messages.filters[category === 'bundles' ? 'packages' : category];
  if (!label) throw new Error(`[explore] Missing translated category ${category}.`);
  return label;
}
export function cardBadge(card: ExploreCard, locale: string, messages: ExploreMessages): string {
  const key = editorialBadgeKey(card.offer.source.badge_key);
  if (!key) return card.offer.source[`badge_${locale}`] || '';
  const badge = messages.badges[key] || messages.badges[key.toLowerCase()];
  if (!badge) throw new Error(`[explore:${card.id}] Missing ${locale} badge translation ${key}.`);
  return badge;
}
