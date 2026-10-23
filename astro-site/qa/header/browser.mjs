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
    // Synthetic service only: no real sessions, credentials or Auth requests.
    await page.route('**/features/auth/data/browser.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
      export async function browserAuth() {
        let listener;
        return {
          subscribe(fn) { listener = fn; }, remainingCooldown() { return 0; },
          async currentSession() { return {ok:true,value:{userId:'synthetic',profile:{displayName:'Alexandria Example',email:null,avatarUrl:null}}}; },
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
    assert.equal((await trigger.locator('.auth-trigger-label').textContent()).trim(), greeting);
    assert.deepEqual(await container.boundingBox(), before);
    assert.deepEqual(await trigger.boundingBox(), buttonBefore);
    assert.deepEqual(await page.locator('#gh-nav-inline').boundingBox(), navBefore);
    assert.equal(await trigger.evaluate(button => button.parentElement.classList.contains('gh-left')), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: new URL(`./screenshots/${locale}-${width}-ready.png`, import.meta.url).pathname.slice(1) });
    await trigger.click();
    await page.locator('[data-auth-dialog]').waitFor({ state: 'visible' });
    await page.locator('[data-auth-signout]').click();
    await page.locator('[data-auth-guest]').waitFor({ state: 'visible' });
    assert.equal(await trigger.getAttribute('aria-label'), locale === 'it' ? 'Accedi' : 'Sign in');
    await page.keyboard.press('Escape');
    assert.equal(await trigger.evaluate(button => button === document.activeElement), true);
    assert.deepEqual(await trigger.boundingBox(), buttonBefore);
    assert.deepEqual(await page.locator('#gh-nav-inline').boundingBox(), navBefore);
    results.push({ locale, width, pendingVisible: true, pendingDisabled: true, greeting: true, stableGeometry: true, leftPosition: true, signoutLabel: true, focusRestored: true });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL('./browser-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log('Header startup: 4 cases passed; immediate icon, localized greeting, stable navigation, left placement, signout and focus restoration.');
