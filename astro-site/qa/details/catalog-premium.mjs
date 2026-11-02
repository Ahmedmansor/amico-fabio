import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const phase=process.argv[2]||'after',part=process.argv[3]||'all';
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const routes={package:'packages/dolce_vita_family/',tour:'tours/ras_mohammed_white_island_vip/',explore:'explore/sharm/'};
const baseline=phase==='after'?JSON.parse(await readFile('qa/details/catalog-premium-before-all.json','utf8')):null;
const results=[],shots=`qa/details/screenshots/catalog-${phase}-${part}`;
await mkdir(shots,{recursive:true});
try{
 for(const [kind,route] of Object.entries(routes)){
  if(part==='modal'&&kind!=='package'||part==='details'&&kind==='explore'||part==='explore'&&kind!=='explore')continue;
  for(const locale of ['it','en'])for(const width of [375,820,1180,1440]){
   const page=await browser.newPage({viewport:{width,height:width===820?1180:960},hasTouch:width<=1180,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));const response=await page.goto(`${origin}/${locale}/${route}`,{waitUntil:'load'});assert.equal(response.status(),200);
   await page.evaluate(()=>document.fonts.ready);const reject=page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true});await reject.click();
   await page.waitForFunction(()=>!document.documentElement.classList.contains('show--consent'));
   const content=await page.evaluate(()=>{
    const text=n=>n?.textContent.replace(/\s+/g,' ').trim()||'';
    const ids=['detail-title','detail-duration','detail-desc','detail-full-desc','detail-highlights','detail-includes','detail-excludes','detail-program','detail-important','card-price','card-price-breakdown','live-total-price','included-trips-subtitle'];
    return {fields:Object.fromEntries(ids.map(id=>[id,text(document.getElementById(id))])),
     booking:document.getElementById('booking-config')?JSON.parse(document.getElementById('booking-config').textContent):null,
     labels:[...document.querySelectorAll('.product-section h2,.product-section-nav a,.product-facts,main label')].map(text),
     links:[...document.querySelectorAll('main a[href]')].map(n=>n.getAttribute('href')),
     cards:[...document.querySelectorAll('[data-explore-card]')].map(n=>({key:n.dataset.cardKey,price:n.dataset.price,score:n.dataset.score,text:text(n)})),
     filters:[...document.querySelectorAll('[data-filter],#price-sort option')].map(text),
     included:[...document.querySelectorAll('#included-trips-grid [data-trip-id]')].map(n=>({id:n.dataset.tripId,text:text(n)})),
     templates:[...document.querySelectorAll('template[id^="included-template-"]')].map(n=>({id:n.id,fields:Object.fromEntries([...n.content.querySelectorAll('[data-field]:not([data-field$="gallery"]):not(img)')].map(f=>[f.dataset.field,text(f)])),photos:n.content.querySelectorAll('[data-gallery-src]').length})),
    };
   });
   if(phase==='after')assert.deepEqual(content,baseline.results.find(r=>r.kind===kind&&r.locale===locale&&r.width===width).content,`${kind}/${locale}/${width} content changed`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const mainImage=page.locator('#hero-bg-img,.catalog-card-img').first();await mainImage.evaluate(n=>n.decode());
   await page.screenshot({path:`${shots}/${kind}-${locale}-${width}-top.png`,animations:'disabled'});
   let modalCases=0;
   if(kind==='package'){
    for(const button of await page.locator('#included-trips-grid [data-trip-id]').all()){
     await button.click();const modal=page.locator('#included-trip-modal');assert.equal(await modal.isVisible(),true);
     const id=await button.getAttribute('data-trip-id');
     await modal.locator('[data-field="included-trip-modal-hero-img"]').evaluate(n=>n.decode());
     if(modalCases===0)await page.screenshot({path:`${shots}/modal-${locale}-${width}.png`,animations:'disabled'});
     if(phase==='after'){
      assert.equal(await modal.evaluate(n=>n instanceof HTMLDialogElement&&n.open),true);
      assert.equal(await modal.evaluate(n=>n.scrollWidth<=n.clientWidth),true);
      const close=modal.locator('#included-trip-modal-close'),top=(await close.boundingBox()).y;
      const thumbs=modal.locator('[data-gallery-src]');if(await thumbs.count()>1){await thumbs.nth(1).click();assert.equal(await thumbs.nth(1).getAttribute('aria-pressed'),'true');assert.equal(await modal.locator('[data-field="included-trip-modal-hero-img"]').getAttribute('src'),await thumbs.nth(1).getAttribute('data-gallery-src'));}
      await modal.locator('.included-trip-scroll').evaluate(n=>n.scrollTop=n.scrollHeight);
      assert.equal((await close.boundingBox()).y,top);
      await close.focus();await page.keyboard.press('Shift+Tab');assert.equal(await modal.evaluate(n=>n.contains(document.activeElement)),true);
      await page.keyboard.press('Tab');assert.equal(await close.evaluate(n=>n===document.activeElement),true);
     }
     await page.keyboard.press('Escape');assert.equal(await modal.isVisible(),false);assert.equal(await button.evaluate(n=>n===document.activeElement),true);modalCases++;
     if(phase==='after'&&modalCases===1){await button.click();assert.equal(await modal.locator('.included-trip-scroll').evaluate(n=>n.scrollTop),0);await modal.locator('#included-trip-modal-close').click();}
     assert.ok(id);
    }
   }
   if(kind!=='explore'){
    await page.locator('#product-itinerary').scrollIntoViewIfNeeded();await page.screenshot({path:`${shots}/${kind}-${locale}-${width}-content.png`,animations:'disabled'});
    await page.locator('[data-gallery-open]').first().click();const dialog=page.locator('[data-product-gallery-dialog]');assert.equal(await dialog.evaluate(n=>n.open),true);await dialog.locator('[data-gallery-next]').click();assert.equal(await dialog.locator('[data-gallery-select="1"]').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');
    const booking=content.booking;await page.locator('[data-pax="adults"][data-change="1"]').click();assert.equal(Number((await page.locator('#live-total-price').textContent()).replace('€','')),booking.prices.adult*(booking.prices.minPax+1));
    if(phase==='after'&&part!=='modal'){
     assert.equal(await page.locator('.product-detail').evaluate(n=>getComputedStyle(n).colorScheme),'light');
     await page.locator('#nation-picker').click();const country=page.locator('#nation-list [data-nationality="Italian"]');await country.click();assert.equal(await page.locator('#inp-nation').inputValue(),'Italian');
     assert.equal(await page.locator('#card-price-breakdown .text-white').first().evaluate(n=>getComputedStyle(n).color),'rgb(10, 43, 75)');
     await page.locator('#booking-card-container').scrollIntoViewIfNeeded();await page.screenshot({path:`${shots}/${kind}-${locale}-${width}-booking.png`,animations:'disabled'});
     if(width>=1024)assert.equal(await page.locator('.product-booking-column').evaluate(n=>{const r=n.getBoundingClientRect();return getComputedStyle(n).position==='sticky'&&r.top>=80&&r.bottom<=innerHeight+1;}),true);
     const faq=page.locator('.faq-toggle').first();await faq.click();assert.equal(await faq.locator('..').evaluate(n=>n.classList.contains('is-open')),true);
    }
   }else if(phase==='after'){
    await page.locator('#price-sort').selectOption('price_asc');
    const prices=await page.locator('[data-explore-card]:visible').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.price)));assert.deepEqual(prices,[...prices].sort((a,b)=>a-b));
    await page.locator('#price-sort').selectOption('price_desc');
    const descending=await page.locator('[data-explore-card]:visible').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.price)));assert.deepEqual(descending,[...descending].sort((a,b)=>b-a));
    const next=page.locator('[data-next]');if(await next.isVisible()&&await next.isEnabled()){await next.click();assert.equal(await page.locator('[data-page]').textContent(),'2');await page.locator('[data-previous]').click();assert.equal(await page.locator('[data-page]').textContent(),'1');}
    const filter=page.locator('[data-filter="bundles"]');if(await filter.count()){await filter.click();assert.equal(await filter.getAttribute('aria-pressed'),'true');assert.ok(await page.locator('[data-explore-card]:visible').evaluateAll(nodes=>nodes.every(n=>n.dataset.cardKey.startsWith('package:'))));}
    const favorite=page.locator('[data-explore-card]:visible .favorite-button').first();await favorite.click();
    await page.waitForFunction(()=>document.querySelector('[data-explore-card]:not([hidden]) .favorite-button')?.getAttribute('aria-pressed')==='true');
    await favorite.click();await page.waitForFunction(()=>document.querySelector('[data-explore-card]:not([hidden]) .favorite-button')?.getAttribute('aria-pressed')==='false');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
   assert.deepEqual(errors,[]);results.push({kind,locale,width,content,modalCases,errors,overflow:false});
   console.log(`${phase} ${kind} ${locale} ${width}: PASS (${modalCases} included trips)`);await page.close();
  }
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||`qa/details/catalog-premium-${phase}-${part}.json`,JSON.stringify({origin,results},null,2)+'\n');console.log(`${results.length} cases passed`);
