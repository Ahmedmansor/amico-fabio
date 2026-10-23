import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { supportedLocales } from '../../src/shared/config/languages.ts';
const sitemap = await readFile(new URL('../../dist/sitemap.xml', import.meta.url), 'utf8');
for (const locale of supportedLocales) {
  const callback = await readFile(new URL(`../../dist/${locale}/auth/callback/index.html`, import.meta.url), 'utf8');
  assert.match(callback, /name="robots" content="noindex, follow"/);
  assert.match(callback, /name="referrer" content="no-referrer"/);
  assert.equal(sitemap.includes(`/${locale}/auth/callback/`), false);
  const firstScript = callback.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';
  assert.ok(firstScript.includes('history.replaceState'), 'Credentials must be scrubbed by the first script.');
  const settings = JSON.parse(callback.match(/<script[^>]*id="auth-callback-config"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? 'null');
  assert.equal(settings.config, null, 'The normal build must keep Auth disabled until separately configured.');
  const wishlist = await readFile(new URL(`../../dist/${locale}/wishlist/index.html`, import.meta.url), 'utf8');
  assert.equal(wishlist.includes('data-auth-open'), false);
  assert.equal(wishlist.includes('sb_publishable_'), false);
}
console.log('Built Auth checks passed: both callbacks noindex/excluded from sitemap, no-referrer, credentials scrubbed first; default Auth disabled and no browser key emitted.');
