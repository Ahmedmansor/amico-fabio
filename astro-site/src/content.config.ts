import { defineCollection } from 'astro:content';
import { blogSchema } from './features/blog/data/content-schema';
import { editorialLoaders } from './shared/data/editorial-loaders';
import { placesSchema } from './features/places/data/content-schema';
import { createPublicationPolicy } from './features/blog/data/publication-context';

const policy = createPublicationPolicy({
  dev: import.meta.env.DEV,
  includeFixtures: process.env.BLOG_INCLUDE_FIXTURES,
  noindex: process.env.PUBLIC_NOINDEX ?? import.meta.env.PUBLIC_NOINDEX,
  githubActions: process.env.GITHUB_ACTIONS,
});

const loaders=editorialLoaders(policy);
export const collections = {
  blog: defineCollection({ loader: loaders.blog, schema: blogSchema }),
  places: defineCollection({loader:loaders.places,schema:placesSchema}),
};
