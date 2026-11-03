import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig } from './src/shared/config/site.ts';
import { catalogValidation } from './src/shared/data/build-validation.mjs';
import { seoFiles } from './src/shared/seo/build-seo.mjs';
import {loadEnv} from 'vite';
import {preventIndexing,assertIndexingHost} from './src/shared/seo/indexing.ts';
import {resolveAssetOrigin} from './src/shared/seo/asset-origin.ts';
import {blogBuildGuards} from './src/features/blog/data/build-guard.mjs';
import {createBlogMarkdownProcessor} from './src/features/blog/presentation/markdown/processor.ts';
const publicEnv=loadEnv('production',process.cwd(),'PUBLIC_');
// Owner's local alias is a public widget key, never the Turnstile secret.
// Resolve it explicitly so production builds match the local registration UI.
const turnstileEnv=loadEnv('production',process.cwd(),'TURNSTILE_SITE_KEY');
const turnstileSiteKey=process.env.PUBLIC_AUTH_TURNSTILE_SITE_KEY||publicEnv.PUBLIC_AUTH_TURNSTILE_SITE_KEY||turnstileEnv.TURNSTILE_SITE_KEY||'';
const noindexValue=process.env.PUBLIC_NOINDEX??publicEnv.PUBLIC_NOINDEX;
const noindex=preventIndexing(noindexValue);
assertIndexingHost(noindex,process.env.VERCEL,process.env.GITHUB_ACTIONS);
const assetOrigin=resolveAssetOrigin(noindex,siteConfig.url,process.env.PUBLIC_SITE_URL??publicEnv.PUBLIC_SITE_URL,process.env.VERCEL_URL);

export default defineConfig({
  site: siteConfig.url,
  output: 'static',
  trailingSlash: 'always',
  markdown: {processor: createBlogMarkdownProcessor()},
  devToolbar: { enabled: false },
  integrations: [catalogValidation(),seoFiles({noindex,assetOrigin}),blogBuildGuards({noindex})],
  vite: {
    define: {'import.meta.env.PUBLIC_NOINDEX':JSON.stringify(noindexValue||''),'import.meta.env.PUBLIC_ASSET_ORIGIN':JSON.stringify(assetOrigin),'import.meta.env.PUBLIC_AUTH_TURNSTILE_SITE_KEY':JSON.stringify(turnstileSiteKey)},
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
  },
});
