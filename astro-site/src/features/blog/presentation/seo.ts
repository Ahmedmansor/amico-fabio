import type { BlogPost } from '../domain/models';
import { articleUrl } from '../domain/translations';
import { listingUrl } from '../domain/listings';

export interface BlogAuthor { name: string; type: 'Person' | 'Organization'; url?: string }
export function articleStructuredData(post: BlogPost, author: BlogAuthor, context: {
  site: string; image: { src: string; width: number; height: number }; assetOrigin: string;
  home: string; journal: string; destination?: string;
}) {
  const absolute = (path: string) => new URL(path, context.site).href;
  const url = absolute(articleUrl(post));
  const crumbs = [
    { name: context.home, item: absolute(`/${post.lang}/`) },
    { name: context.journal, item: absolute(listingUrl(post.lang)) },
    ...(post.destination ? [{ name: context.destination!, item: absolute(listingUrl(post.lang, 'destinations', post.destination)) }] : []),
    { name: post.title, item: url },
  ];
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BlogPosting', '@id': `${url}#article`, url, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      headline: post.title, description: post.description, inLanguage: post.lang,
      datePublished: new Date(post.pubDate).toISOString(),
      ...(post.updatedDate ? { dateModified: new Date(post.updatedDate).toISOString() } : {}),
      author: { '@type': author.type, name: author.name, ...(author.url ? { url: author.url } : {}) },
      publisher: { '@type': 'Organization', name: 'Fabio Egypt', url: absolute('/') },
      image: { '@type': 'ImageObject', url: new URL(context.image.src, context.assetOrigin).href,
        width: context.image.width, height: context.image.height, caption: post.hero.alt },
    },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) },
  ] };
}

/** JSON in a script element must never contain an HTML closing-tag sequence. */
export const serializeStructuredData = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');
