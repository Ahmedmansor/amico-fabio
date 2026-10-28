import { getCollection } from 'astro:content';
import { supportedLocales, type Locale } from '../../../shared/config/languages';
import { getSharedMessages } from '../../../shared/i18n/shared';
import { getPosts, getBlogPublicationPolicy } from './posts';
import { getActiveTaxonomy, getFeaturedPost, getPublishedPosts } from '../domain/publication';
import { getRelatedPosts } from '../domain/related-posts';
import { getTranslations } from '../domain/translations';
import { getListingAlternates, type ListingKind } from '../domain/listings';
import type { BlogPost } from '../domain/models';
import { authors } from './authors';
import { getRelatedTrips } from './related-trips';

export interface BlogListing {
  lang: Locale;
  kind: ListingKind;
  slug?: string;
  title: string;
  description: string;
  posts: BlogPost[];
}

export async function getBlogListings(): Promise<BlogListing[]> {
  const posts = await getPosts(), policy = await getBlogPublicationPolicy();
  return supportedLocales.flatMap(lang => {
    const published = getPublishedPosts(posts, lang, policy), active = getActiveTaxonomy(posts, lang, policy);
    const m = getSharedMessages(lang).blog;
    return [
      { lang, kind: 'home' as const, title: m.title, description: m.intro, posts: published },
      ...active.destinations.map(({ slug }) => ({ lang, kind: 'destinations' as const, slug,
        title: m.destinationLabels[slug], description: m.destinationDescriptions[slug], posts: published.filter(post => post.destination === slug) })),
      ...active.interests.map(({ slug }) => ({ lang, kind: 'interests' as const, slug,
        title: m.interestLabels[slug], description: m.interestDescriptions[slug], posts: published.filter(post => post.interests.includes(slug)) })),
    ];
  });
}

export function listingAlternates(group: BlogListing, groups: readonly BlogListing[], page: number) {
  return getListingAlternates({ ...group, total: group.posts.length }, groups.map(item => ({ ...item, total: item.posts.length })), page);
}

export async function getBlogAssets() {
  return Object.fromEntries((await getCollection('blog')).map(entry => [entry.id, entry.data.heroImage]));
}

export async function getBlogDiscovery(lang: Locale) {
  const posts = await getPosts(), policy = await getBlogPublicationPolicy();
  return { featured: getFeaturedPost(posts, lang, policy), taxonomy: getActiveTaxonomy(posts, lang, policy) };
}

export async function getArticleViews() {
  const posts = await getPosts(), policy = await getBlogPublicationPolicy();
  const relatedTrips = await getRelatedTrips(posts);
  return supportedLocales.flatMap(lang => getPublishedPosts(posts, lang, policy).map(post => {
    const alternates = getTranslations(post, posts, policy);
    return {
    post, alternates,
    navigation: Object.keys(alternates).length ? alternates : { [lang]: `/${lang}/blog/${post.slug}/` },
    related: getRelatedPosts(post, posts, policy),
    author: post.fixture ? getSharedMessages(lang).blog.fixtureAuthor : authors[post.authorId!].name,
    authorIdentity: post.fixture ? { name: getSharedMessages(lang).blog.fixtureAuthor, type: 'Organization' as const } : authors[post.authorId!],
    relatedTrip: relatedTrips.get(post.id),
  }; }));
}
