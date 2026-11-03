import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4322';
const results=[];
await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
async function count(page,value) {
  await page.waitForFunction(value=>document.querySelector('[data-wishlist-count]')?.textContent===String(value),value);
  assert.equal(await page.locator('[data-wishlist-count]').isVisible(),true);
  assert.match(await page.locator('[data-wishlist-link]').getAttribute('aria-label'),new RegExp(`\\(${value}\\)$`));
}
try {
  for(const locale of ['it','en']) for(const width of [375,1440]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    await page.goto(`${origin}/${locale}/explore/`);
    await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
    await count(page,0);
    const linkBefore=await page.locator('[data-wishlist-link]').boundingBox();
    const buttons=page.locator('[data-explore-card]:not([hidden]) [data-favorite]');
    await buttons.nth(0).click(); await count(page,1);
    await buttons.nth(1).click(); await count(page,2);
    assert.deepEqual(await page.locator('[data-wishlist-link]').boundingBox(),linkBefore);
    await page.screenshot({path:new URL(`./screenshots/count-${locale}-${width}.png`,import.meta.url).pathname.slice(1)});
    await page.reload(); await count(page,2);
    const other=await context.newPage();
    await other.goto(`${origin}/${locale}/legal/`); await count(other,2);
    await page.bringToFront();
    await page.locator('[data-explore-card]:not([hidden]) [data-favorite]').nth(0).click();
    await count(page,1); await count(other,1);
    await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('fabio:wishlist:v1:'))localStorage.removeItem(key);window.dispatchEvent(new Event('focus'));});
    await count(page,0); await count(other,0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    results.push({locale,width,zero:true,add:true,remove:true,reload:true,headerOnlyPage:true,crossTab:true,clear:true,stableLink:true});
    await context.close();
  }
  const denied=await browser.newContext();
  await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('denied');}}));
  const page=await denied.newPage(); await page.goto(`${origin}/en/legal/`);
  assert.equal(await page.locator('[data-wishlist-count]').isVisible(),false);
  await denied.close();
  const stale=await browser.newContext();
  await stale.addInitScript(()=>localStorage.setItem('fabio:wishlist:v1:trip:unavailable_fixture','1'));
  const stalePage=await stale.newPage();await stalePage.goto(`${origin}/en/wishlist/`);await count(stalePage,1);
  assert.equal(await stalePage.locator('[data-wishlist-catalog-notice]').isVisible(),true);
  assert.equal(await stalePage.locator('[data-wishlist-empty]').isVisible(),false);
  assert.equal(await stalePage.locator('[data-wishlist-item]:visible').count(),0);
  await stale.close();
  await writeFile(new URL('./count-results.json',import.meta.url),JSON.stringify({cases:results,unavailableStorage:'no fabricated count',unavailableTourNotice:true},null,2)+'\n');
  console.log('Wishlist count: 4 language/viewport cases passed; add/remove, reload, header-only page, cross-tab, clear, stable geometry and unavailable storage.');
}finally{await browser.close();}
