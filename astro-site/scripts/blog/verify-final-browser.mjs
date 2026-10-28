import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
const [modulePath, executablePath] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(modulePath).href);
const origin = 'http://127.0.0.1:4327';
const output = new URL('../../qa/blog/screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const records = [];
try {
  for (const lang of ['it','en']) for (const width of [375,1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(`${origin}/${lang}/`, { waitUntil: 'networkidle' });
    const rejectLabel=await page.locator('#cookie-consent-config').evaluate(node=>JSON.parse(node.textContent).messages.reject);
    const reject=page.getByRole('button',{name:rejectLabel,exact:true});
    if(await reject.count())await reject.first().click();
    const blogLinks = await page.locator('#global-header [data-nav=blog]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.deepEqual(blogLinks, [`/${lang}/blog/`,`/${lang}/blog/`]);
    assert.equal(await page.locator('#global-header [data-lang-switch]').count(),2);
    await page.screenshot({ path: fileURLToPath(new URL(`shared-header-${lang}-${width}.png`,output)) });
    const slug = lang === 'it' ? 'fixture-guida-mare' : 'fixture-diving-guide';
    await page.goto(`${origin}/${lang}/blog/${slug}/`, { waitUntil: 'networkidle' });
    const accessibleNames=await page.locator('.blog-languages a').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent.trim(),name:node.getAttribute('aria-label')})));
    for(const item of accessibleNames)assert.ok(item.name.startsWith(item.text+' — '));
    const tour = page.locator('[data-related-tour]');
    await tour.scrollIntoViewIfNeeded();
    const href = await tour.locator('a').getAttribute('href');
    assert.equal(href,`/${lang}/tours/ras_mohammed_white_island_vip/`);
    const title = await tour.locator('h3').textContent();
    assert.ok(title.trim());
    await page.waitForFunction(() => { const image=document.querySelector('[data-related-tour] img'); return image.complete && image.naturalWidth>0; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
    await tour.screenshot({ path: fileURLToPath(new URL(`related-tour-${lang}-${width}.png`,output)) });
    records.push({lang,width,blogLinks,relatedTour:href,title,accessibleNames});
    await page.close();
  }
  const context = await browser.newContext({ javaScriptEnabled:false, viewport:{width:1280,height:900} });
  const page = await context.newPage();
  await page.goto(`${origin}/en/blog/fixture-cairo-guide/`, {waitUntil:'networkidle'});
  assert.equal(await page.locator('.blog-aside form').isVisible(),false);
  assert.equal(await page.locator('.blog-aside noscript a').isVisible(),true);
  await context.close();
  console.log('PASS: shared Blog/language navigation and related-tour cards in IT/EN at 375/1280px.');
  console.log('PASS: no-JavaScript form is hidden with a usable bare WhatsApp link.');
} finally {
  await browser.close();
  await writeFile(new URL('../../qa/blog/FINAL_BROWSER.json',import.meta.url),JSON.stringify({origin,records},null,2)+'\n');
}
