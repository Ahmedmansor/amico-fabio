import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig } from './src/shared/config/site.ts';
import { catalogValidation } from './src/shared/data/build-validation.mjs';
import { seoFiles } from './src/shared/seo/build-seo.mjs';
import {loadEnv} from 'vite';
import {preventIndexing,assertIndexingHost} from './src/shared/seo/indexing.ts';
const noindexValue=process.env.PUBLIC_NOINDEX??loadEnv('production',process.cwd(),'PUBLIC_NOINDEX').PUBLIC_NOINDEX;
const noindex=preventIndexing(noindexValue);
assertIndexingHost(noindex,process.env.VERCEL,process.env.GITHUB_ACTIONS);

export default defineConfig({
  site: siteConfig.url,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [catalogValidation(),seoFiles({noindex})],
  vite: {
    define: {'import.meta.env.PUBLIC_NOINDEX':JSON.stringify(noindexValue||'')},
    plugins: [tailwindcss()],
  },
});
