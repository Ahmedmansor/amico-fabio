import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4322';
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true, executablePath: process.env.QA_BROWSER});
const results = [];
try {
  for (const locale of ['it', 'en']) for (const width of [375, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}, reducedMotion: 'reduce'});
    let sends = 0;
    await context.route('**/auth/v1/**', route => {
      if (route.request().url().includes('/otp')) sends++;
      return route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/${locale}/wishlist/`, {waitUntil: 'domcontentloaded', timeout: 60000});
    await page.getByRole('button', {name: locale === 'it' ? 'Rifiuta facoltativi' : 'Reject optional', exact: true}).click();
    await page.locator('#global-header [data-auth-open]').click();
    const toggle = page.locator('[data-auth-email-toggle]');
    assert.equal(await toggle.isVisible(), true);
    assert.equal(await page.locator('[data-auth-form]').isVisible(), false);
    await page.locator('[data-auth-mode-switch]').click();
    await page.screenshot({path: new URL(`email-choice-${locale}-${width}.png`, output).pathname.slice(1)});
    await toggle.click();
    await page.locator('#auth-email').fill('preview@libero.it');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('[data-auth-send]').isDisabled(), true);
    assert.equal(await page.locator('#auth-email-unavailable').isVisible(), true);
    await page.locator('[data-auth-form]').dispatchEvent('submit');
    assert.equal(sends, 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path: new URL(`email-form-${locale}-${width}.png`, output).pathname.slice(1)});
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('[data-auth-form]').isVisible(), false);
    assert.deepEqual(errors, []);
    results.push({locale, width, visibleEmailChoice: true, expandableForm: true, disabledDelivery: true, sends});
    await context.close();
  }
  await writeFile(new URL('./email-choice-results.json', import.meta.url), JSON.stringify(results, null, 2)+'\n');
  console.log('Email UI preview passed: IT/EN, 375/1440px; visible option, form toggle, disabled sending, zero OTP requests.');
} finally {await browser.close();}
