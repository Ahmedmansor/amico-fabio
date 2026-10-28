import { readFile, readdir } from 'node:fs/promises';
import { checkBlogLinks } from '../../../../scripts/blog/check-links.mjs';
import { checkBlogStructuredData } from '../../../../scripts/blog/check-structured-data.mjs';

/** Scan the final static artifact, including derived text, not just route HTML. */
export async function guardBlogOutput(directory, { records = [], allowFixtures = false, noindex = false } = {}) {
  if (allowFixtures && !noindex) throw new Error('[blog] Fixtures require a noindex build.');
  let checked = 0;
  const fixturePaths = records.filter(record => record.fixture).map(record => `/${record.lang}/blog/${record.slug}/`);
  async function visit(folder) {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      const file = new URL(item.name + (item.isDirectory() ? '/' : ''), folder);
      if (item.isDirectory()) { await visit(file); continue; }
      if (!/\.(?:html|json|xml|txt|js|mjs|css)$/i.test(item.name)) continue;
      const contents = await readFile(file, 'utf8');
      checked++;
      const fixtureContent = contents.includes('[FIXTURE]') || /data-fixture(?:[\s=>]|$)/.test(contents) ||
        fixturePaths.some(path => contents.includes(path));
      if (!fixtureContent) continue;
      if (!allowFixtures) throw new Error(`[blog:${file.pathname}] Fixture content reached a non-fixture build.`);
      if (item.name.endsWith('.html') && !/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(contents)) {
        throw new Error(`[blog:${file.pathname}] Fixture HTML is missing noindex.`);
      }
      if (item.name.endsWith('.xml')) throw new Error(`[blog:${file.pathname}] Fixture content leaked into sitemap/XML.`);
    }
  }
  await visit(directory);
  return checked;
}

export function blogBuildGuards({ noindex }) {
  let root;
  return { name: 'fabio-blog-guard', hooks: {
    'astro:config:done': ({ config }) => { root = config.root; },
    'astro:build:done': async ({ dir, logger }) => {
      const snapshot = JSON.parse(await readFile(new URL('./.astro/blog/index.json', root), 'utf8'));
      const checked = await guardBlogOutput(dir, { records: snapshot.records,
        allowFixtures: snapshot.policy.includeFixtures, noindex });
      logger.info(`Checked ${checked} generated text files; fixture artifact policy verified.`);
      const pages = await checkBlogLinks(dir);
      logger.info(`Checked links and metadata structure on ${pages} blog pages.`);
      const articles = await checkBlogStructuredData(dir);
      logger.info(`Verified visible-content JSON-LD contract on ${articles} blog articles.`);
    },
  } };
}
