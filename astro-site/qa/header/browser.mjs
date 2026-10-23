import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER });
const results = [];
await mkdir(new URL('./screenshots/', import.meta.url), { recursive: true });
try {
  for (const locale of ['it', 'en']) for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    let releaseAvatar;
    const avatarGate = new Promise(resolve => { releaseAvatar = resolve; });
    await page.route('https://lh3.googleusercontent.com/qa-header-avatar', async route => {
      await avatarGate;
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="#bbb"/></svg>' });
    });
    await page.route('https://lh3.googleusercontent.com/qa-header-broken', route => route.abort());
    // Synthetic service only: no real sessions, credentials or Auth requests.
    await page.route('**/features/auth/data/browser.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
      export async function browserAuth() {
        let listener;
        return {
          subscribe(fn) { listener = fn; }, remainingCooldown() { return 0; },
          async currentSession() { return {ok:true,value:{userId:'synthetic',profile:{displayName:'Alexandria Example',email:null,avatarUrl:'https://lh3.googleusercontent.com/qa-header-avatar'}}}; },
          async signOut() { listener(null); return {ok:true}; }
        };
      }
    ` }));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/auth-interactions.ts*', async route => { await gate; await route.continue(); });
    await page.goto(`${origin}/${locale}/`, { waitUntil: 'commit' });
    const container = page.locator('.gh-container');
    const trigger = container.locator('[data-auth-open]');
    await trigger.waitFor({ state: 'attached' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('#gh-nav-inline [data-auth-open], #gh-menu-dropdown [data-auth-open]').count(), 0);
    await trigger.waitFor({ state: 'visible' });
    assert.equal(await trigger.isDisabled(), true);
    const avatar = trigger.locator('.auth-trigger-avatar');
    const favoritesShimmer = page.locator('.wishlist-loading');
    assert.equal(await avatar.getAttribute('data-avatar-loading'), 'true');
    assert.equal(await favoritesShimmer.isVisible(), true);
    assert.equal(await page.locator('[data-wishlist-count]').isVisible(), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await avatar.evaluate(node => getComputedStyle(node, '::after').animationName), 'none');
    assert.equal(await favoritesShimmer.evaluate(node => getComputedStyle(node, '::after').animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const shimmer = trigger.locator('.auth-trigger-loading');
    assert.equal(await shimmer.isVisible(), width >= 1024);
    if (width >= 1024) {
      assert.equal(await shimmer.evaluate(node => getComputedStyle(node, '::after').animationName), 'auth-name-shimmer');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await shimmer.evaluate(node => getComputedStyle(node, '::after').animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    const before = await container.boundingBox();
    const navBefore = await page.locator('#gh-nav-inline').boundingBox();
    const buttonBefore = await trigger.boundingBox();
    await page.screenshot({ path: new URL(`./screenshots/${locale}-${width}-pending.png`, import.meta.url).pathname.slice(1) });
    await page.waitForTimeout(1000);
    assert.equal(await trigger.isVisible(), true);
    release();
    await page.waitForFunction(() => [...document.querySelectorAll('#global-header [data-auth-open]')].every(button => !button.disabled));
    const greeting = locale === 'it' ? 'Ciao, Alexandria' : 'Hi, Alexandria';
    assert.equal(await trigger.getAttribute('aria-label'), greeting);
    assert.equal(await shimmer.isVisible(), false);
    assert.equal(await favoritesShimmer.isVisible(), false);
    assert.equal(await avatar.getAttribute('data-avatar-loading'), 'true', 'Avatar stays loading until its own request completes');
    releaseAvatar();
    await page.waitForFunction(() => document.querySelector('.auth-trigger-avatar')?.getAttribute('data-avatar-loading') === 'false');
    assert.equal(await avatar.locator('img').isVisible(), true);
    assert.equal((await trigger.locator('.auth-trigger-label').textContent()).trim(), greeting);
    assert.deepEqual(await container.boundingBox(), before);
    assert.deepEqual(await trigger.boundingBox(), buttonBefore);
    assert.deepEqual(await page.locator('#gh-nav-inline').boundingBox(), navBefore);
    assert.equal(await trigger.evaluate(button => button.parentElement.classList.contains('gh-left')), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: new URL(`./screenshots/${locale}-${width}-ready.png`, import.meta.url).pathname.slice(1) });
    await avatar.locator('img').evaluate(image => { image.src = 'https://lh3.googleusercontent.com/qa-header-broken'; });
    await page.waitForFunction(() => document.querySelector('.auth-trigger-avatar img')?.getAttribute('data-failed-src')?.endsWith('qa-header-broken'));
    assert.equal(await avatar.locator('[data-auth-avatar-fallback]').isVisible(), true);
    assert.equal(await avatar.getAttribute('data-avatar-loading'), 'false');
    await trigger.click();
    await page.locator('[data-auth-dialog]').waitFor({ state: 'visible' });
    await page.locator('[data-auth-signout]').click();
    await page.locator('[data-auth-guest]').waitFor({ state: 'visible' });
    assert.equal(await trigger.getAttribute('aria-label'), locale === 'it' ? 'Accedi' : 'Sign in');
    assert.equal(await avatar.locator('img').getAttribute('src'), null);
    assert.equal(await avatar.locator('[data-auth-avatar-fallback]').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.matches('#global-header [data-auth-open]'));
    assert.equal(await trigger.evaluate(button => button === document.activeElement), true);
    assert.deepEqual(await trigger.boundingBox(), buttonBefore);
    assert.deepEqual(await page.locator('#gh-nav-inline').boundingBox(), navBefore);
    results.push({ locale, width, pendingVisible: true, pendingDisabled: true, greeting: true, stableGeometry: true, leftPosition: true, signoutLabel: true, focusRestored: true, avatarAndFavoritesShimmer: true, delayedAvatar: true, avatarFailureFallback: true, avatarClearedOnSignout: true, reducedMotion: true });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL('./browser-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log('Header startup: 4 cases passed; avatar/name/favorites shimmer, delayed Google avatar, image failure fallback, reduced motion, signout and stable layout.');
