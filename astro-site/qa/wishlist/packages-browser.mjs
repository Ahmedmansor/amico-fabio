import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4330';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
async function count(page,value){
  await page.waitForFunction(value=>document.querySelector('[data-wishlist-count]')?.textContent===String(value),value);
}
try{
  for(const locale of ['it','en'])for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${origin}/${locale}/explore/`);
    await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
    const tour=page.locator('[data-explore-card][data-card-key^="trip:"]').first();
    const pack=page.locator('[data-explore-card][data-card-key^="package:"]').first();
    assert.equal(await pack.locator('[data-favorite]').count(),1);
    const tourId=await tour.locator('[data-favorite]').getAttribute('data-favorite-id');
    const packageKey=await pack.locator('[data-favorite]').getAttribute('data-favorite-id');
    const packageHref=await pack.locator('[data-detail-link]').getAttribute('href');
    // Existing v1 tour record remains readable alongside the new package namespace.
    await page.evaluate(id=>localStorage.setItem('fabio:wishlist:v1:trip:'+encodeURIComponent(id),'1'),tourId);
    await page.goto(origin+packageHref);
    await count(page,1);
    const detailButton=page.locator(`[data-favorite-id="${packageKey}"]`);
    await detailButton.click();await count(page,2);
    assert.equal(await detailButton.getAttribute('aria-pressed'),'true');
    await page.goto(`${origin}/${locale}/wishlist/`);await count(page,2);
    const sections=page.locator('[data-wishlist-section]:visible');
    assert.equal(await sections.count(),2);
    assert.equal(await sections.nth(0).locator('[data-wishlist-item]:visible').count(),1);
    assert.equal(await sections.nth(1).locator('[data-wishlist-item]:visible').count(),1);
    assert.equal(await sections.nth(1).locator('[data-wishlist-item]:visible .wishlist-card-footer a').getAttribute('href'),packageHref);
    assert.equal(await page.locator('[data-wishlist-catalog-notice]').isVisible(),false);
    assert.equal(await page.locator('[data-wishlist-empty]').isVisible(),false);
    await page.screenshot({path:new URL(`./screenshots/packages-${locale}-${width}.png`,import.meta.url).pathname.slice(1),fullPage:true});
    await page.reload();await count(page,2);
    const other=await context.newPage();await other.goto(`${origin}/${locale}/wishlist/`);await count(other,2);
    await page.bringToFront();
    await page.locator(`[data-favorite-id="${packageKey}"]`).click();await count(page,1);await count(other,1);
    assert.equal(await page.locator('[data-wishlist-section]:visible').count(),1);
    assert.equal(await other.locator('[data-wishlist-section]:visible').count(),1);
    assert.equal(await page.locator(`[data-favorite-id="${tourId}"]`).getAttribute('aria-pressed'),'true');
    await page.locator(`[data-favorite-id="${tourId}"]`).click();await count(page,0);await count(other,0);
    assert.equal(await page.locator('[data-wishlist-empty]').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);
    results.push({locale,width,packageButton:true,detailSave:true,legacyTourPreserved:true,separateSections:true,correctLinks:true,reload:true,crossTab:true,independentRemove:true,emptyState:true,noPageErrors:true});
    await context.close();
  }
  await writeFile(new URL('./packages-results.json',import.meta.url),JSON.stringify({mode:'guest-local-storage',cases:results},null,2)+'\n');
  console.log('Package favorites: 4 IT/EN mobile/desktop cases passed; detail save, legacy tours, separate sections, total count, correct links, reload, cross-tab removal and empty state.');
}finally{await browser.close();}
