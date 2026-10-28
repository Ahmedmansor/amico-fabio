import { getCollection, getEntry, render } from 'astro:content';
import type { Locale } from '../../../shared/config/languages';
import type { BlogPost } from '../domain/models';
import { getPublishedPosts } from '../domain/publication';
import { articlePathParts } from '../domain/validation';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { PublicationPolicy } from '../domain/models';

/** App commands run from astro-site/, like the existing catalog provider. */
export async function getBlogPublicationPolicy(): Promise<PublicationPolicy> {
  const snapshot = JSON.parse(await readFile(resolve(process.cwd(), '.astro/blog/index.json'), 'utf8'));
  return snapshot.policy;
}

export async function getPosts(): Promise<BlogPost[]> {
  return (await getCollection('blog')).map(entry => {
    const { heroImage, heroAlt, heroCaption, ...data } = entry.data;
    const sourcePath = entry.filePath!.replaceAll('\\', '/').split('/content/blog/')[1];
    const { slug } = articlePathParts(sourcePath);
    return { ...data, id: entry.id, slug, body: entry.body ?? '', sourcePath,
      hero: { src: heroImage.src, width: heroImage.width, height: heroImage.height, alt: heroAlt, caption: heroCaption } };
  });
}

export async function getPostsForLanguage(lang: Locale) {
  return getPublishedPosts(await getPosts(), lang, await getBlogPublicationPolicy());
}

export async function renderPost(id: string) {
  const entry = await getEntry('blog', id);
  if (!entry) throw new Error(`[blog] Unknown article id: ${id}.`);
  return render(entry);
}
