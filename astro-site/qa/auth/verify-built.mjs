import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { supportedLocales } from '../../src/shared/config/languages.ts';
const sitemap = await readFile(new URL('../../dist/sitemap.xml', import.meta.url), 'utf8');
const localAuth = process.argv.includes('--local-auth');
for (const locale of supportedLocales) {
  const callback = await readFile(new URL(`../../dist/${locale}/auth/callback/index.html`, import.meta.url), 'utf8');
  assert.match(callback, /name="robots" content="noindex, follow"/);
  assert.match(callback, /name="referrer" content="no-referrer"/);
  assert.equal(sitemap.includes(`/${locale}/auth/callback/`), false);
  const firstScript = callback.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';
  assert.ok(firstScript.includes('history.replaceState'), 'Credentials must be scrubbed by the first script.');
  const settings = JSON.parse(callback.match(/<script[^>]*id="auth-callback-config"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? 'null');
  const wishlist = await readFile(new URL(`../../dist/${locale}/wishlist/index.html`, import.meta.url), 'utf8');
  if (localAuth) {
    assert.equal(settings.config?.siteOrigin, 'http://127.0.0.1:4322');
    assert.equal(settings.config?.googleEnabled, true);
    assert.equal(settings.config?.emailEnabled, false);
    assert.equal(/^sb_publishable_[a-zA-Z0-9_-]+$/.test(settings.config?.publishableKey ?? ''), true);
    assert.equal(wishlist.includes('data-auth-open'), true);
    assert.equal(wishlist.includes('id="auth-email"'), false);
  } else {
    assert.equal(settings.config, null, 'The normal build must keep Auth disabled until separately configured.');
    assert.equal(wishlist.includes('data-auth-open'), false);
    assert.equal(wishlist.includes('sb_publishable_'), false);
  }
}
console.log(`Built Auth checks passed: callbacks noindex/excluded from sitemap, no-referrer, credentials scrubbed first; ${localAuth ? 'local Google enabled on 4322; email UI off; key value not printed' : 'default Auth disabled and no browser key emitted'}.`);
