// Local visual QA using the host's supplied Playwright runtime; not a site dependency.
// node ... <absolute-playwright-module> [absolute-chromium-executable]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [modulePath, executablePath] = process.argv.slice(2);
if (!modulePath) throw new Error('Pass the host-provided Playwright module path.');
const { chromium } = await import(pathToFileURL(modulePath).href);
const root = new URL('../../', import.meta.url);
const output = new URL('qa/blog/screenshots/', root);
await mkdir(output, { recursive: true });
const origin = process.env.BLOG_QA_ORIGIN ?? 'http://127.0.0.1:4327';
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const records = [];
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const route of ['/it/blog/', '/en/blog/', '/it/blog/interests/history/', '/en/blog/destinations/cairo/']) {
      const errors = [];
      const onError = error => errors.push(error.message);
      page.on('pageerror', onError);
      const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight) {
          scrollTo(0, top); await new Promise(done => setTimeout(done, 60));
        }
        scrollTo(0, 0);
      });
      const facts = await page.evaluate(() => ({
        title: document.querySelector('h1')?.textContent,
        h1Count: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
        noindex: document.querySelector('meta[name=robots]')?.getAttribute('content'),
        overflow: document.documentElement.scrollWidth > innerWidth,
        cards: document.querySelectorAll('.blog-card').length,
        interests: document.querySelectorAll('.blog-interest-card').length,
        cities: document.querySelectorAll('.blog-city-card').length,
        brokenImages: [...document.querySelectorAll('img[src]')].filter(image => !image.hidden && (!image.complete || image.naturalWidth === 0)).map(image => image.getAttribute('src')),
      }));
      const filename = `${route.replaceAll('/', '-').replace(/^-|-$/g, '')}-${width}.png`;
      await page.screenshot({ path: new URL(filename, output).pathname.replace(/^\/([A-Z]:)/i, '$1'), fullPage: true });
      records.push({ route, width, ...facts, errors, screenshot: `qa/blog/screenshots/${filename}` });
      page.off('pageerror', onError);
      assert.equal(facts.h1Count, 1, route);
      if (/^\/(it|en)\/blog\/$/.test(route)) assert.equal(facts.cards, 9, `${route} must show fixture page one, not an accidental empty state`);
      assert.equal(facts.overflow, false, `${route} overflow at ${width}`);
      assert.deepEqual(facts.brokenImages, [], route);
      assert.deepEqual(errors, [], route);
    }
    await context.close();
  }
  console.log(`PASS: ${records.length} listing captures; one H1, no overflow/broken images/browser errors.`);
} finally {
  await browser.close();
  await writeFile(new URL('qa/blog/LISTING_COMPARISON.json', root), JSON.stringify({ origin, records }, null, 2) + '\n');
}
