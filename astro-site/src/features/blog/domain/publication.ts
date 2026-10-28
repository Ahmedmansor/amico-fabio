import type { Locale } from '../../../shared/config/languages';
import type { BlogPost, PublicationPolicy } from './models';
import { destinations, interests, type Destination, type Interest } from './taxonomy';

export function publicationTime(post: Pick<BlogPost, 'pubDate' | 'sourcePath'>): number {
  const timestamp = Date.parse(post.pubDate);
  if (!Number.isFinite(timestamp)) throw new Error(`[blog:${post.sourcePath}] pubDate is invalid: ${post.pubDate}.`);
  return timestamp;
}

const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function comparePublished(a: BlogPost, b: BlogPost): number {
  return publicationTime(b) - publicationTime(a) || compareText(a.title, b.title) || compareText(a.id, b.id);
}

export function getPublishedPosts(posts: readonly BlogPost[], lang: Locale, policy: PublicationPolicy): BlogPost[] {
  if (!Number.isFinite(policy.evaluatedAt)) throw new Error('[blog] evaluatedAt must be a finite timestamp.');
  return posts.filter(post => post.lang === lang && !post.draft &&
    (!post.fixture || policy.includeFixtures) && publicationTime(post) <= policy.evaluatedAt)
    .sort(comparePublished);
}

export function getPostsByDestination(posts: readonly BlogPost[], lang: Locale, destination: Destination, policy: PublicationPolicy) {
  return getPublishedPosts(posts, lang, policy).filter(post => post.destination === destination);
}

export function getPostsByInterest(posts: readonly BlogPost[], lang: Locale, interest: Interest, policy: PublicationPolicy) {
  return getPublishedPosts(posts, lang, policy).filter(post => post.interests.includes(interest));
}

export function getActiveTaxonomy(posts: readonly BlogPost[], lang: Locale, policy: PublicationPolicy) {
  const published = getPublishedPosts(posts, lang, policy);
  return {
    destinations: destinations.flatMap(slug => {
      const count = published.filter(post => post.destination === slug).length;
      return count ? [{ slug, count }] : [];
    }),
    interests: interests.flatMap(slug => {
      const count = published.filter(post => post.interests.includes(slug)).length;
      return count ? [{ slug, count }] : [];
    }),
  };
}

export function getFeaturedPost(posts: readonly BlogPost[], lang: Locale, policy: PublicationPolicy) {
  const published = getPublishedPosts(posts, lang, policy);
  return published.find(post => post.featured) ?? published[0];
}
