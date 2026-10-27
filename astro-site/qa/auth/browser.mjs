import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = process.env.PLAYWRIGHT_MODULE ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href) : await import('playwright');
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4330';
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER ? { executablePath: process.env.QA_BROWSER } : {}) });
const results = [];
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'qa@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-10-23T00:00:00Z', email_confirmed_at: '2026-10-23T00:00:00Z' };
const token = () => {
  const payload = { sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) };
  return `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.synthetic_test_signature`;
};
async function mock(context, expired = false) {
  const calls = { sends: 0, verifies: 0, authorizes: 0, signouts: 0, exchanges: 0 };
  await context.route('https://auth-qa.invalid/**', async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': origin, 'access-control-allow-headers': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers, body: '' });
    if (url.pathname.endsWith('/otp')) { calls.sends++; return route.fulfill({ status: 200, headers, json: {} }); }
    if (url.pathname.endsWith('/token') && url.searchParams.get('grant_type') === 'pkce') {
      calls.exchanges++;
      const body = route.request().postDataJSON();
      assert.equal(body.auth_code, 'synthetic_google_code');
      assert.ok(body.code_verifier);
      if (expired) return route.fulfill({ status: 400, headers, json: { code: 'flow_state_expired', msg: 'expired test code' } });
      return route.fulfill({ status: 200, headers, json: { access_token: token(), refresh_token: 'synthetic_refresh', token_type: 'bearer', expires_in: 3600, user } });
    }
    if (url.pathname.endsWith('/verify')) {
      calls.verifies++;
      const body = route.request().postDataJSON();
      assert.equal(body.token_hash, 'synthetic_email_hash');
      assert.equal(body.type, 'email');
      assert.equal('code_verifier' in body, false);
      if (expired) return route.fulfill({ status: 403, headers, json: { code: 'otp_expired', msg: 'expired test link' } });
      return route.fulfill({ status: 200, headers, json: { access_token: token(), refresh_token: 'synthetic_refresh', token_type: 'bearer', expires_in: 3600, user } });
    }
    if (url.pathname.endsWith('/user')) return route.fulfill({ status: 200, headers, json: user });
    if (url.pathname.endsWith('/logout')) { calls.signouts++; return route.fulfill({ status: 204, headers, body: '' }); }
    if (url.pathname.endsWith('/authorize')) {
      calls.authorizes++;
      assert.equal(url.searchParams.get('provider'), 'google');
      assert.equal(url.searchParams.get('code_challenge_method'), 's256');
      assert.ok(url.searchParams.get('code_challenge'));
      return route.fulfill({ status: 200, headers, body: 'Synthetic OAuth destination; no Google connection was made.' });
    }
    throw new Error(`Unmocked Auth endpoint: ${url.pathname}`);
  });
  return calls;
}
async function consent(page, locale) {
  await page.getByRole('button', { name: locale === 'it' ? 'Rifiuta facoltativi' : 'Reject optional', exact: true }).click();
}
async function openDialog(page, _width) {
  await page.locator('#global-header [data-auth-open]:visible').click();
  await page.locator('[data-auth-dialog]').waitFor({ state: 'visible' });
}
async function shot(page, file) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(file, output).pathname.slice(1), fullPage: false });
}
try {
  for (const locale of ['it', 'en']) for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const calls = await mock(context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/${locale}/wishlist/`, {waitUntil: 'domcontentloaded'});
    await consent(page, locale);
    await openDialog(page, width);
    await shot(page, `${locale}-${width}-signin.png`);
    assert.equal(await page.locator('[data-auth-google] svg').count(), 1);
    await page.locator('[data-auth-mode-switch]').click();
    assert.match(await page.locator('#auth-title').innerText(), locale === 'it' ? /Crea/ : /Create/);
    assert.equal(await page.locator('[data-auth-mode-switch]').innerText(), locale === 'it' ? 'Accedi' : 'Sign in');
    await shot(page, `${locale}-${width}-signup.png`);
    await page.locator('[data-auth-mode-switch]').click();
    assert.match(await page.locator('#auth-title').innerText(), /Fabio Egypt/);
    assert.equal(calls.authorizes, 0);
    assert.equal(calls.sends, 0);
    await page.locator('[data-auth-email-toggle]').click();
    assert.equal(await page.locator('[data-auth-email-toggle]').getAttribute('aria-expanded'), 'true');
    await page.locator('#auth-email').fill('invalid');
    await page.locator('[data-auth-send]').click();
    await page.locator('[data-auth-input-error]').waitFor({ state: 'visible' });
    assert.equal(calls.sends, 0);
    await page.locator('#auth-email').fill('qa+test@example.test');
    await page.locator('[data-auth-send]').click();
    await page.locator('[data-auth-countdown]').waitFor({ state: 'visible' });
    assert.equal(calls.sends, 1);
    await page.locator('[data-auth-form]').dispatchEvent('submit');
    assert.equal(calls.sends, 1);
    await shot(page, `${locale}-${width}-requested.png`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-auth-dialog]').isVisible(), false);
    assert.equal(await page.locator('#global-header [data-auth-open]').evaluate(node => node === document.activeElement), true);
    await shot(page, `${locale}-${width}-entry.png`);
    await page.locator('.auth-entry [data-auth-open]').click();
    await page.locator('[data-auth-dialog]').waitFor({ state: 'visible' });
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[data-auth-dialog]')), true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await context.close();

    // Independent browser storage: no PKCE verifier or original-browser session.
    const fresh = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const freshCalls = await mock(fresh);
    const callback = await fresh.newPage();
    callback.on('pageerror', error => errors.push(error.message));
    await callback.goto(`${origin}/${locale}/auth/callback/?next=//evil.test/#token_hash=synthetic_email_hash&type=email`, {waitUntil: 'domcontentloaded'});
    await consent(callback, locale);
    await callback.locator('[data-auth-continue]').waitFor({ state: 'visible' });
    assert.equal(new URL(callback.url()).search, '');
    assert.equal(new URL(callback.url()).hash, '');
    assert.equal(await callback.evaluate(() => window.__fabioAuthCallback), undefined);
    assert.equal(freshCalls.verifies, 0);
    await callback.evaluate(() => localStorage.setItem('fabio:wishlist:v1:trip:ras_mohammed_bus_half_day', '1'));
    await shot(callback, `${locale}-${width}-callback.png`);
    await callback.locator('[data-auth-continue]').click();
    await callback.waitForURL(`${origin}/${locale}/`);
    assert.equal(freshCalls.verifies, 1);
    await openDialog(callback, width);
    await callback.locator('[data-auth-account]').waitFor({ state: 'visible' });
    await shot(callback, `${locale}-${width}-account.png`);
    assert.equal(await callback.evaluate(() => localStorage.getItem('fabio:wishlist:v1:trip:ras_mohammed_bus_half_day')), '1');
    await callback.locator('[data-auth-signout]').click();
    await callback.waitForURL(`${origin}/${locale}/`);
    await callback.waitForFunction(() => !document.querySelector('#global-header [data-auth-open]')?.disabled);
    assert.equal(await callback.locator('[data-auth-dialog]').isVisible(), false);
    assert.equal(freshCalls.signouts, 1);
    assert.equal(await callback.evaluate(() => localStorage.getItem('fabio:auth:session:v1')), null);
    assert.equal(await callback.evaluate(() => localStorage.getItem('fabio:wishlist:v1:trip:ras_mohammed_bus_half_day')), '1');
    assert.deepEqual(errors, []);
    await fresh.close();
    results.push({ locale, width, inputValidation: true, duplicateSendGuard: true, freshBrowserVerification: true, callbackScrubbedBeforeVerification: true, safeReturn: true, restoredAccount: true, signoutPreservesGuestWishlist: true, pageErrors: errors });
  }
  const expired = await browser.newContext();
  const expiredCalls = await mock(expired, true);
  const expiredPage = await expired.newPage();
  await expiredPage.goto(`${origin}/en/auth/callback/#token_hash=synthetic_email_hash&type=email`, {waitUntil: 'domcontentloaded'});
  await consent(expiredPage, 'en');
  await expiredPage.locator('[data-auth-continue]').click();
  await expiredPage.locator('[data-auth-continue]').waitFor({ state: 'hidden' });
  assert.match(await expiredPage.locator('[data-auth-callback-status]').innerText(), /invalid, expired or already used/);
  assert.equal(expiredCalls.verifies, 1);
  await expired.close();
  const googleContext = await browser.newContext();
  const googleCalls = await mock(googleContext);
  const googlePage = await googleContext.newPage();
  await googlePage.goto(`${origin}/en/wishlist/`, {waitUntil: 'domcontentloaded'});
  await consent(googlePage, 'en');
  await openDialog(googlePage, 1280);
  await googlePage.locator('[data-auth-google]').click();
  await googlePage.waitForURL('https://auth-qa.invalid/**');
  assert.equal(googleCalls.authorizes, 1);
  // Repeat the complete Google round trip after local signout, with no Continue click.
  for (let attempt = 0; attempt < 2; attempt++) {
    await googlePage.goto(`${origin}/en/auth/callback/?code=synthetic_google_code&next=/en/wishlist/`, {waitUntil: 'domcontentloaded'});
    await googlePage.waitForURL(`${origin}/en/wishlist/`);
    assert.equal(googleCalls.exchanges, attempt + 1);
    await openDialog(googlePage, 1280);
    await googlePage.locator('[data-auth-account]').waitFor({ state: 'visible' });
    await googlePage.locator('[data-auth-signout]').click();
    await googlePage.waitForURL(`${origin}/en/`);
    assert.equal(await googlePage.locator('[data-auth-dialog]').isVisible(), false);
    await openDialog(googlePage, 1280);
    await googlePage.locator('[data-auth-google]').click();
    await googlePage.waitForURL('https://auth-qa.invalid/**');
  }
  await googleContext.close();
  const failedGoogle = await browser.newContext();
  const failedGoogleCalls = await mock(failedGoogle, true);
  const failedGooglePage = await failedGoogle.newPage();
  await failedGooglePage.goto(`${origin}/en/wishlist/`, {waitUntil: 'domcontentloaded'});
  await consent(failedGooglePage, 'en');
  await openDialog(failedGooglePage, 1280);
  await failedGooglePage.locator('[data-auth-google]').click();
  await failedGooglePage.waitForURL('https://auth-qa.invalid/**');
  await failedGooglePage.goto(`${origin}/en/auth/callback/?code=synthetic_google_code`, {waitUntil: 'domcontentloaded'});
  await failedGooglePage.locator('[data-auth-callback-status]').filter({ hasText: /invalid, expired or already used/ }).waitFor();
  assert.equal(failedGoogleCalls.exchanges, 1);
  assert.equal(await failedGooglePage.locator('[data-auth-continue]').isVisible(), false);
  assert.equal(new URL(failedGooglePage.url()).search, '');
  await failedGoogle.close();
  const deniedContext = await browser.newContext();
  const deniedCalls = await mock(deniedContext);
  await deniedContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage denied'); } }));
  const denied = await deniedContext.newPage();
  await denied.goto(`${origin}/en/wishlist/`, {waitUntil: 'domcontentloaded'});
  await consent(denied, 'en');
  await openDialog(denied, 1280);
  assert.match(await denied.locator('[data-auth-status]').innerText(), /currently unavailable/);
  assert.equal(await denied.locator('[data-auth-send]').isDisabled(), true);
  assert.equal(deniedCalls.sends, 0);
  await deniedContext.close();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJS.newPage();
  await staticPage.goto(`${origin}/en/auth/callback/`, {waitUntil: 'domcontentloaded'});
  assert.equal(await staticPage.locator('[data-auth-continue]').isVisible(), false);
  assert.match(await staticPage.locator('.auth-callback noscript').innerText(), /Enable JavaScript/);
  await noJS.close();
  await writeFile(new URL('./browser-results.json', import.meta.url), JSON.stringify({ mode: 'synthetic-auth-only', cases: results, expiredLink: true, googlePKCE: true, deniedStorage: true, noJavaScript: true, directWishlistEntry: true, nativeDialogFocusTrap: true }, null, 2) + '\n');
  console.log(`Auth browser checks passed: ${results.length} language/viewport combinations; email confirmation, Google automatic PKCE completion twice across signout, expired Google code, session restoration and safe callbacks.`);
} finally { await browser.close(); }
