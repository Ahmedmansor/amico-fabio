import { defineCollection } from 'astro:content';
import { blogSchema } from './features/blog/data/content-schema';
import { blogLoader } from './features/blog/data/loader';
import { createPublicationPolicy } from './features/blog/data/publication-context';

const policy = createPublicationPolicy({
  dev: import.meta.env.DEV,
  includeFixtures: process.env.BLOG_INCLUDE_FIXTURES,
  noindex: process.env.PUBLIC_NOINDEX ?? import.meta.env.PUBLIC_NOINDEX,
  githubActions: process.env.GITHUB_ACTIONS,
});

export const collections = { blog: defineCollection({ loader: blogLoader(policy), schema: blogSchema }) };
