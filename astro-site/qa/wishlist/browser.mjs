import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
  : await import('playwright');
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4321';
const baseline = process.argv.includes('--baseline');
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER ? { executablePath: process.env.QA_BROWSER } : {}) });
const results = [];
const before = baseline ? [] : JSON.parse(await readFile(new URL('./baseline.json', import.meta.url), 'utf8'));
const comparable = value => value.toLowerCase().replace(/\s+/g, '');
async function screenshot(page, name) {
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => {
    image.loading = 'eager';
    return image.decode().catch(() => {});
  })));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(name, output).pathname.slice(1), fullPage: true });
}
async function dismissConsent(page, locale) {
  await page.getByRole('button', { name: locale === 'it' ? 'Rifiuta facoltativi' : 'Reject optional', exact: true }).click();
}
try {
  for (const locale of ['it', 'en']) for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/${locale}/explore/`);
    await dismissConsent(page, locale);
    await page.locator('[data-explore-card]:not([hidden])').first().waitFor();
    const trip = page.locator('[data-explore-card][data-card-key^="trip:"]:not([hidden])').first();
    const id = await trip.getAttribute('data-trip-id');
    const href = await trip.locator('[data-detail-link]').getAttribute('href');
    const snapshot = await trip.locator('.card-content').evaluate(element => {
      const clone = element.cloneNode(true);
      clone.querySelector('.card-favorite')?.remove();
      return clone.textContent.replace(/\s+/g, ' ').trim();
    });
    if (!baseline) {
      const reference = before.find(item => item.locale === locale && item.width === width);
      assert.equal(id, reference.id);
      assert.equal(href, reference.href);
      assert.equal(comparable(snapshot), comparable(reference.snapshot));
    }
    await screenshot(page, `${baseline ? 'before' : 'after'}-${locale}-${width}-explore.png`);
    if (baseline) {
      await page.goto(origin + href);
      await screenshot(page, `before-${locale}-${width}-tour.png`);
      results.push({ locale, width, id, href, snapshot });
      await context.close();
      continue;
    }
    const heart = trip.locator('[data-favorite]');
    await heart.waitFor({ state: 'visible' });
    const bounds = await heart.boundingBox();
    assert.ok(bounds.width >= 44 && bounds.height >= 44);
    assert.equal(await heart.getAttribute('aria-pressed'), 'false');
    await heart.click();
    assert.equal(await heart.getAttribute('aria-pressed'), 'true');
    await page.reload();
    assert.equal(await trip.locator('[data-favorite]').getAttribute('aria-pressed'), 'true');
    const other = await context.newPage();
    await other.goto(`${origin}/${locale}/wishlist/`);
    const saved = other.locator(`[data-wishlist-item][data-trip-id="${id}"]`);
    await saved.waitFor({ state: 'visible' });
    assert.equal(await other.locator('[data-wishlist-item]:visible').count(), 1);
    await screenshot(other, `after-${locale}-${width}-wishlist.png`);
    await saved.locator('[data-favorite]').click();
    await page.waitForFunction(id => document.querySelector(`[data-favorite][data-favorite-id="${id}"]`)?.getAttribute('aria-pressed') === 'false', id);
    await other.locator('[data-wishlist-empty]').waitFor({ state: 'visible' });
    await screenshot(other, `after-${locale}-${width}-empty.png`);
    await page.goto(origin + href);
    await page.locator('[data-favorite]').click();
    assert.equal(await page.locator('[data-favorite]').getAttribute('aria-pressed'), 'true');
    await screenshot(page, `after-${locale}-${width}-tour.png`);
    await page.goto(`${origin}/${locale === 'it' ? 'en' : 'it'}/wishlist/`);
    await page.locator(`[data-wishlist-item][data-trip-id="${id}"]`).waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    results.push({ locale, width, id, href, snapshot, existingCardContentPreserved: true, persistence: true, crossTab: true, crossLanguage: true, errors });
    await context.close();
  }
  if (!baseline) {
    for (const width of [768, 1024]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(`${origin}/en/wishlist/`);
      await dismissConsent(page, 'en');
      await page.locator('[data-wishlist-empty]').waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await screenshot(page, `after-en-${width}-empty.png`);
      await context.close();
    }
    const broken = await browser.newContext();
    await broken.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage denied'); } }));
    const denied = await broken.newPage();
    await denied.goto(`${origin}/en/explore/`);
    await dismissConsent(denied, 'en');
    const button = denied.locator('[data-favorite]:visible').first();
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
    await denied.locator('[data-favorite-error]:visible').waitFor();
    await denied.goto(`${origin}/en/wishlist/`);
    await denied.locator('[data-wishlist-error]').waitFor({ state: 'visible' });
    assert.equal(await denied.locator('[data-wishlist-empty]').isVisible(), false);
    await broken.close();
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJS.newPage();
    await staticPage.goto(`${origin}/it/wishlist/`);
    assert.equal(await staticPage.locator('[data-favorite]:visible').count(), 0);
    assert.equal(await staticPage.locator('noscript').innerText(), 'Attiva JavaScript per visualizzare e salvare i preferiti.');
    assert.equal(await staticPage.locator('[data-wishlist-item]:visible').count(), 0);
    await noJS.close();
    console.log('Additional checks passed: 768/1024px layouts, denied storage, JavaScript disabled.');
  }
  await writeFile(new URL(baseline ? './baseline.json' : './browser-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
  console.log(`${baseline ? 'Baseline captured' : 'Browser checks passed'}: ${results.length} language/viewport combinations.`);
} finally { await browser.close(); }
