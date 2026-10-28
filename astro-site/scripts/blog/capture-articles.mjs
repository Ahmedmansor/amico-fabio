// Focused article/dialog/WhatsApp UI QA. Handoff is intercepted; nothing is sent.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [modulePath, executablePath, resume] = process.argv.slice(2);
if (!modulePath) throw new Error('Pass the host-provided Playwright module path.');
const { chromium } = await import(pathToFileURL(modulePath).href);
const root = new URL('../../', import.meta.url), output = new URL('qa/blog/screenshots/', root);
await mkdir(output, { recursive: true });
const origin = process.env.BLOG_QA_ORIGIN ?? 'http://127.0.0.1:4327';
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const records = [];
const allCases = [
  [375, '/it/blog/fixture-guida-cairo/', true], [1280, '/it/blog/fixture-guida-cairo/'], [768, '/it/blog/fixture-guida-cairo/'],
  [375, '/en/blog/fixture-cairo-guide/'], [1280, '/en/blog/fixture-cairo-guide/', true],
  [375, '/it/blog/fixture-note-pratiche/'], [1280, '/it/blog/fixture-note-pratiche/'],
  [375, '/en/blog/fixture-practical-notes/'], [1280, '/en/blog/fixture-practical-notes/'],
];
const cases = resume === '--handoff-only' ? allCases.filter(item => item[2]) : allCases;
const reportFile = resume === '--handoff-only' ? 'qa/blog/WHATSAPP_HANDOFF.json' : 'qa/blog/ARTICLE_COMPARISON.json';
// Explicit operator-only resume after a harness fix, with application code
// unchanged. Never use this to validate a newer application revision.
if (resume === '--resume') {
  const previous = JSON.parse(await readFile(new URL('qa/blog/ARTICLE_COMPARISON.json', root), 'utf8'));
  assert.equal(previous.origin, origin);
  records.push(...previous.records);
}
try {
  for (const [width, route, interaction] of cases) {
    if (records.some(record => record.width === width && record.route === route)) continue;
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', timezoneId: 'Africa/Cairo' });
    let intercepted = 0;
    await context.route('https://wa.me/**', async route => { intercepted++; await route.fulfill({ contentType: 'text/html', body: '<title>Intercepted local test</title>' }); });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, route);
    const reject = page.getByRole('button', { name: /Rifiuta facoltativi|Reject optional/i });
    if (await reject.count()) await reject.first().click();
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight) { scrollTo(0, top); await new Promise(done => setTimeout(done, 50)); }
      scrollTo(0, 0);
    });
    await page.waitForFunction(() => [...document.querySelectorAll('img[src]')].every(image => image.hidden || image.complete));
    const facts = await page.evaluate(() => ({
      h1Count: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      aside: getComputedStyle(document.querySelector('.blog-aside')).display,
      sticky: getComputedStyle(document.querySelector('.blog-aside')).position,
      bar: getComputedStyle(document.querySelector('.blog-mobile-bar')).display,
      figures: document.querySelectorAll('.blog-prose figure').length,
      inlineCtas: document.querySelectorAll('.blog-prose .blog-cta').length,
      canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
      alternates: [...document.querySelectorAll('link[hreflang]')].map(link => link.getAttribute('href')),
      duplicateIds: [...document.querySelectorAll('[id]')].map(node => node.id).filter((id,index,all) => all.indexOf(id) !== index),
      brokenImages: [...document.querySelectorAll('img[src]')].filter(image => !image.hidden && (!image.complete || image.naturalWidth === 0)).map(image => image.getAttribute('src')),
    }));
    assert.equal(facts.h1Count, 1); assert.equal(facts.overflow, false); assert.deepEqual(facts.duplicateIds, []); assert.deepEqual(facts.brokenImages, []);
    if (/pratiche|practical/.test(route)) assert.equal(facts.inlineCtas, 0); else assert.equal(facts.inlineCtas, 1);
    assert.equal(facts.aside === 'none', width < 1024);
    assert.equal(facts.bar === 'none', width >= 1024);
    if (width >= 1024) assert.equal(facts.sticky, 'sticky');
    if (interaction) {
      if (width < 1024) await page.locator('.blog-mobile-bar [data-open-lead]').click();
      const form = page.locator(width < 1024 ? '.blog-inquiry-dialog [data-blog-inquiry]' : '.blog-aside [data-blog-inquiry]');
      await form.locator('button[type=submit]').click();
      assert.ok((await form.locator('[data-error=name]').textContent()).length > 0);
      await form.locator('[name=name]').fill('Demo visitor');
      await form.locator('[name=nationality]').selectOption({ index: 1 });
      await form.locator('[name=date]').fill('2090-01-01');
      await form.locator('[name=message]').fill('Synthetic QA inquiry & 50% + mare\nSecond line');
      await form.locator('button[type=submit]').click();
      const review = page.locator(width < 1024 ? '.blog-inquiry-dialog [data-inquiry-review]' : '.blog-aside [data-inquiry-review]');
      assert.equal(await review.isVisible(), true);
      assert.equal(await review.locator('[data-whatsapp-handoff]').getAttribute('href'), null);
      assert.equal(new URL(await review.locator('[data-whatsapp-fallback]').getAttribute('href')).search, '');
      const popupPromise = context.waitForEvent('page');
      await review.locator('[data-whatsapp-handoff]').click();
      const popup = await popupPromise; await popup.waitForLoadState();
      const message = new URL(popup.url()).searchParams.get('text');
      assert.ok(message.includes('Demo visitor') && message.includes('50% + mare\nSecond line'));
      assert.ok(message.includes('https://fabioegypt.com' + route));
      await popup.close();
      assert.equal(intercepted, 1);
      if (width < 1024) {
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.blog-inquiry-dialog').evaluate(dialog => dialog.open), false);
        assert.equal(await page.evaluate(() => document.activeElement?.matches('.blog-mobile-bar [data-open-lead]')), true);
        await page.setViewportSize({ width: 1280, height: 900 });
        assert.equal(await page.locator('.blog-aside [name=name]').inputValue(), 'Demo visitor');
        await page.setViewportSize({ width, height: 900 });
      }
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator(width < 1024 ? '.blog-inquiry-dialog [name=name]' : '.blog-aside [name=name]').inputValue(), '');
    }
    await page.evaluate(() => scrollTo(0, 0));
    const filename = `${route.replaceAll('/', '-').replace(/^-|-$/g, '')}-${width}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(filename, output)), fullPage: true });
    assert.deepEqual(errors, []);
    records.push({ route, width, ...facts, errors, formFlowVerified: !!interaction, handoffIntercepted: intercepted,
      screenshot: `qa/blog/screenshots/${filename}` });
    await context.close();
  }
  console.log(`PASS: ${records.length} article captures; responsive layout, unique IDs and image/CTA cases verified.`);
  console.log('PASS: IT mobile and EN desktop validation/review/encoded WhatsApp handoff; intercepted only, no real send.');
  console.log('PASS: Escape/focus restoration, cross-viewport draft continuity and no persisted form values after reload.');
} finally {
  await browser.close();
  await writeFile(new URL(reportFile, root), JSON.stringify({ origin, records }, null, 2) + '\n');
}
