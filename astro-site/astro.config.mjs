import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig } from './src/shared/config/site.ts';
import { catalogValidation } from './src/shared/data/build-validation.mjs';

export default defineConfig({
  site: siteConfig.url,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [catalogValidation()],
  vite: {
    plugins: [tailwindcss()],
  },
});
