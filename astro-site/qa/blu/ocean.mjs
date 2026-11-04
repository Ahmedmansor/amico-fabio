import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';

const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({executablePath:process.env.QA_BROWSER});
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4386';
const screenshots = new URL('./screenshots/', import.meta.url);
await mkdir(screenshots,{recursive:true});
try {
  for (const locale of ['it','en']) for (const width of [390,1440]) {
    const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'no-preference'});
    await page.route('**/*',route=>route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.goto(`${origin}/${locale}/blu/`);
    await page.getByRole('button',{name:locale === 'it' ? 'Rifiuta facoltativi' : 'Reject optional',exact:true}).click();
    const select = page.locator('#blu-effects');
    for (const mode of ['full','lite']) {
      await select.selectOption(mode);
      await page.waitForSelector(`body[data-effects="${mode}"]`);
      const full = mode === 'full';
      assert.equal(await page.locator('.blu-medusa:visible').count(), full ? 3 : 0);
      assert.equal(await page.locator('.blu-bubble').count(), full ? 26 : 0);
      if (full) {
        const rising = await page.evaluate(async()=>{
          const bubble = document.querySelectorAll('.blu-bubble')[3];
          const y = bubble.getBoundingClientRect().y;
          await new Promise(resolve=>setTimeout(resolve,180));
          return bubble.getBoundingClientRect().y < y;
        });
        assert.ok(rising,'Bubble moved upwards');
      }
      await page.screenshot({path:fileURLToPath(new URL(`ocean-${locale}-${width}-${mode}.png`,screenshots))});
    }
    for (const pose of [1,2,3]) {
      await page.locator(`[data-pose="${pose}"]`).click();
      assert.ok(await page.locator(`#fabio-pose-${pose}`).isVisible());
      assert.equal(await page.locator('[id^="fabio-pose-"]:visible').count(),1);
      if (locale === 'en' && width === 1440) await page.locator('.blu-portal').screenshot({path:fileURLToPath(new URL(`fabio-${pose}.png`,screenshots))});
    }
    await select.selectOption('full');
    await page.waitForSelector('body[data-effects="full"]');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForSelector('body[data-effects="lite"]');
    assert.equal(await page.locator('.blu-bubble').count(),0);
    assert.equal(await page.locator('.blu-rays').evaluate(element=>element.style.cssText),'');
    await page.close();
    console.log(`${locale} ${width}px: Full, Reduced, upward movement and three poses passed`);
  }
} finally {
  await browser.close();
}
