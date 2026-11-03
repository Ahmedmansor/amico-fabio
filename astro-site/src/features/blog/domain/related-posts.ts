import type { BlogPost, PublicationPolicy } from './models';
import { getPublishedPosts, publicationTime } from './publication';

export function relatedScore(post: BlogPost, candidate: BlogPost): number {
  if (post.id === candidate.id || post.lang !== candidate.lang) return 0;
  const cityScore = post.destination && post.destination === candidate.destination ? 3 : 0;
  const sharedInterests = new Set(post.interests.filter(interest => candidate.interests.includes(interest)));
  return cityScore + sharedInterests.size * 2;
}

export function getRelatedPosts(post: BlogPost, posts: readonly BlogPost[], policy: PublicationPolicy, limit = 3): BlogPost[] {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('[blog] Related-post limit must be a nonnegative integer.');
  return getPublishedPosts(posts, post.lang, policy)
    .map(candidate => ({ candidate, score: relatedScore(post, candidate) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || publicationTime(b.candidate) - publicationTime(a.candidate) ||
      (a.candidate.id < b.candidate.id ? -1 : a.candidate.id > b.candidate.id ? 1 : 0))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
