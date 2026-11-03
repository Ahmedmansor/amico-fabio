// Changed UI only. No real Auth/booking submissions; analytics is rejected.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
async function dismiss(page){const config=page.locator('#cookie-consent-config');if(await config.count()){const label=await config.evaluate(n=>JSON.parse(n.textContent).messages.reject);const b=page.getByRole('button',{name:label,exact:true}).first();await b.waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await b.isVisible())await b.click();}}
try{
  const context=await browser.newContext({viewport:{width:375,height:850},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('fabio_theme','dark'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/en/tours/ras_mohammed_white_island_vip/');await dismiss(page);
  const favorite=page.locator('.product-title-row [data-favorite]');await favorite.waitFor({state:'visible'});
  const before=await favorite.evaluate(n=>getComputedStyle(n).backgroundColor);
  await favorite.tap();assert.equal(await favorite.getAttribute('aria-pressed'),'true');
  const selected=await favorite.evaluate(n=>({background:getComputedStyle(n).backgroundColor,color:getComputedStyle(n).color,fill:getComputedStyle(n.querySelector('svg')).fill,coarse:matchMedia('(pointer:coarse)').matches}));
  assert.equal(selected.coarse,true);assert.equal(selected.background,before);assert.notEqual(selected.background,selected.fill);
  await page.locator('.product-heading').screenshot({path:fileURLToPath(new URL('favorite-touch-dark.png',output))});
  results.push({favoriteTouch:true,backgroundStable:true,selectedHeartVisible:true,...selected});
  await page.goto(origin+'/en/');await page.locator('.review-facebook svg').first().waitFor({state:'attached'});
  const review=await page.locator('.review-facebook svg').first().evaluate(n=>({fill:getComputedStyle(n).fill,expected:getComputedStyle(n).getPropertyValue('--text-heading').trim()}));
  assert.equal(review.fill,'rgb(242, 242, 242)');
  await page.locator('#reviews-section').screenshot({path:fileURLToPath(new URL('facebook-dark.png',output))});
  // Existing lazy slider templates are deliberately mounted only when needed.
  await page.locator('#home-hero-track template').evaluateAll(templates=>templates.forEach(t=>t.replaceWith(t.content)));
  assert.equal(await page.locator('.hero-slide').count(),3);
  const hero=await page.locator('.hero-slide').evaluateAll(async nodes=>{await Promise.all(nodes.map(n=>n.decode()));return nodes.map(n=>({loaded:n.complete&&n.naturalWidth>0,width:n.naturalWidth,src:n.currentSrc}));});
  assert(hero.every(n=>n.loaded));await page.locator('#hero-slider-section').screenshot({path:fileURLToPath(new URL('hero-mobile.png',output))});
  results.push({facebookVisible:true,fill:review.fill,hero});
  for(const slug of ['dolce_vita_family','indiana_jones_adventure','mille_e_una_notte']){
    await page.goto(`${origin}/en/packages/${slug}/`);
    const image=page.locator('.product-photo img').first();await image.evaluate(n=>n.decode());assert(await image.evaluate(n=>n.complete&&n.naturalWidth>0));
    await page.locator('.product-gallery').screenshot({path:fileURLToPath(new URL(slug+'.png',output))});results.push({slug,posterLoaded:true});
  }
  assert.deepEqual(errors,[]);await context.close();
  const desktop=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const wide=await desktop.newPage();await wide.goto(origin+'/en/');await dismiss(wide);
  await wide.locator('#hero-slider-section').screenshot({path:fileURLToPath(new URL('hero-desktop.png',output))});results.push({desktopHero:true});
  await desktop.close();
  await writeFile(new URL('./results.json',import.meta.url),JSON.stringify({results,errors},null,2)+'\n');
  console.log('Visual refresh: 6 focused browser cases passed; touch favorite keeps dark surface, Facebook icon readable, 3 hero images + 3 package posters load, mobile/desktop screenshots.');
}finally{await browser.close();}
