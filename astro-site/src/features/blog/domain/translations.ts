import { blogLocales } from '../../../shared/config/languages';
import type { BlogAlternates, BlogPost, PublicationPolicy } from './models';
import { getPublishedPosts } from './publication';

// Flat URLs remain stable when an article's city or interests change.
export function articleUrl(post: Pick<BlogPost, 'lang' | 'slug'>): string {
  return `/${post.lang}/blog/${post.slug}/`;
}

/** Only actual published translations; an unpaired article emits no hreflang. */
export function getTranslations(post: BlogPost, posts: readonly BlogPost[], policy: PublicationPolicy): BlogAlternates {
  if (!post.translationKey) return {};
  const equivalents = blogLocales.flatMap(lang => getPublishedPosts(posts, lang, policy)
    .filter(candidate => candidate.translationKey === post.translationKey));
  if (!equivalents.some(candidate => candidate.id === post.id) || equivalents.length < 2) return {};
  const result: BlogAlternates = {};
  for (const candidate of equivalents) {
    if (result[candidate.lang]) throw new Error(`[blog:${candidate.sourcePath}] Duplicate translationKey ${post.translationKey} for ${candidate.lang}.`);
    result[candidate.lang] = articleUrl(candidate);
  }
  return result;
}
