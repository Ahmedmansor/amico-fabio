import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4331';
const browser = await chromium.launch({headless: true, executablePath: process.env.QA_BROWSER});
const results = [];
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, {recursive: true});
try {
  for (const locale of ['it', 'en']) for (const width of [375, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: 'reduce'});
    const html = await (await fetch(`${origin}/${locale}/`)).text();
    const match = html.match(/id="welcome-config"[^>]*>(.*?)<\/script>/s);
    assert.ok(match, 'Welcome must be enabled in the served HTML');
    const {config, preferences, onboarding} = JSON.parse(match[1]);
    assert.equal(onboarding.enabled, true);
    assert.ok(preferences, 'Welcome opt-in must have a configured backend');
    const user = {id: '00000000-0000-4000-8000-000000000091', email: 'welcome@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {provider: 'email'}, user_metadata: {}, created_at: new Date().toISOString()};
    const access = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now()/1000)+3600})).toString('base64url')}.synthetic`;
    const session = {access_token: access, refresh_token: 'synthetic', token_type: 'bearer', expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, user};
    const calls = {writes: [], decisions: [], unknown: []};
    let preference = null, completed = null;
    await context.route(`${config.url}/**`, async route => {
      const request = route.request(), url = new URL(request.url());
      const headers = {'access-control-allow-origin': origin, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS'};
      const send = json => route.fulfill({status: 200, headers, json});
      if (request.method() === 'OPTIONS') return route.fulfill({status: 200, headers, body: ''});
      if (url.pathname === '/auth/v1/user') return send(user);
      if (url.pathname.endsWith('/read_account_onboarding')) return send([{user_id: user.id, rollout_version: 'welcome-v1', is_eligible: true, eligible_at: user.created_at, completed_at: completed, skipped_at: null}]);
      if (url.pathname.endsWith('/record_onboarding_decision')) {
        calls.decisions.push(request.postDataJSON()); completed = new Date().toISOString();
        return send([{outcome: 'applied', completed_at: completed, skipped_at: null}]);
      }
      if (url.pathname.endsWith('/wishlist-email-preferences')) {
        if (request.method() === 'PATCH') {
          const input = request.postDataJSON(); calls.writes.push(input);
          if (width === 375 && calls.writes.length === 1) return route.fulfill({status: 503, headers, json: {error: 'Synthetic retryable failure'}});
          preference = {enabled: input.enabled, locale: input.locale, wordingVersion: input.wordingVersion, updatedAt: new Date().toISOString(), enabledSince: new Date().toISOString()};
        }
        return send({preference});
      }
      if (url.pathname.endsWith('/account-locale')) return send({state: {siteLocale: locale, revision: 0, email: null}});
      if (['/rest/v1/profiles', '/rest/v1/wishlists', '/rest/v1/package_wishlists'].includes(url.pathname)) return send([]);
      calls.unknown.push(url.pathname); return route.fulfill({status: 500, headers, json: {error: 'Unmocked endpoint'}});
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/${locale}/`, {waitUntil: 'domcontentloaded'});
    await page.getByRole('button', {name: locale === 'it' ? 'Rifiuta facoltativi' : 'Reject optional', exact: true}).click();
    await context.addInitScript(session => {
      if (!localStorage.getItem('fabio:auth:session:v1')) localStorage.setItem('fabio:auth:session:v1', JSON.stringify(session));
    }, session);
    await page.reload({waitUntil: 'domcontentloaded'});
    const dialog = page.locator('[data-welcome-dialog]');
    await dialog.waitFor({state: 'visible'});
    assert.equal(await page.locator('[data-welcome-continue]').innerText(), locale === 'it' ? 'Continua' : 'Continue');
    assert.equal(await page.locator('[data-welcome-reminder-optin]').isChecked(), false);
    const optIn = width === 1440;
    if (optIn) await page.locator('[data-welcome-reminder-optin]').check();
    await page.screenshot({path: new URL(`${locale}-${width}-welcome.png`, output).pathname.slice(1)});
    await page.locator('[data-welcome-continue]').click();
    await dialog.waitFor({state: 'hidden'});
    assert.equal(calls.writes.length, optIn ? 1 : 0);
    if (optIn) { assert.equal(calls.writes[0].locale, locale); assert.equal(calls.writes[0].enabled, true); }
    assert.equal(calls.decisions.length, 1);
    await page.goto(`${origin}/${locale}/wishlist/`, {waitUntil: 'domcontentloaded'});
    await page.locator('[data-wishlist-page]').waitFor();
    assert.equal(await page.locator('[data-reminder-preferences]').count(), 0);
    assert.equal(await page.locator('[data-reminder-language]').count(), 0);
    assert.equal(await dialog.isVisible(), false);
    if (!optIn) {
      const enable = page.locator('[data-wishlist-inline-reminder-enable]');
      await enable.waitFor({state: 'visible'}); await enable.click();
      await page.locator('[data-wishlist-reminder-status]').waitFor({state: 'visible'});
      await enable.click();
      await page.locator('[data-wishlist-inline-reminder]').waitFor({state: 'hidden'});
      assert.equal(calls.writes.length, 2); assert.equal(calls.writes[0].locale, locale);
      assert.equal(calls.writes[0].requestId, calls.writes[1].requestId);
    }
    await page.screenshot({path: new URL(`${locale}-${width}-wishlist-clean.png`, output).pathname.slice(1)});
    assert.deepEqual(calls.unknown, []); assert.deepEqual(errors, []);
    results.push({locale, width, onboardingInitiallyUnchecked: true, optedIn: optIn, zeroConsentWritesWhenUnchecked: !optIn, noRepeatedWelcome: true, legacySettingsAbsent: true, inlineEnableAndRetryWork: !optIn, pageErrors: errors});
    await context.close();
  }
  await writeFile(new URL('./welcome-browser-results.json', import.meta.url), JSON.stringify({mode: 'synthetic-network; no real account writes or emails', cases: results}, null, 2)+'\n');
  console.log(JSON.stringify({passed: results.length, results}));
} finally { await browser.close(); }
