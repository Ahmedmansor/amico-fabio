import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4387';
const output=new URL('./screenshots/',import.meta.url);
await mkdir(output,{recursive:true});
try {
 for(const locale of ['it','en']) for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  await page.goto(`${origin}/${locale}/blu/`);
  await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  assert.equal(await page.locator('h1').innerText(),locale==='it'?'Vuoi vedere Bikini Bottom per davvero?':'Want to see Bikini Bottom for real?');
  for(const adventure of ['sea','desert','both']){
   await page.locator(`[data-adventure="${adventure}"]`).click();
   const cards=page.locator('[data-program-preview]:visible');
   const matches=await cards.evaluateAll(elements=>elements.map(el=>el.dataset.adventures.split(' ')));
   assert.ok(matches.every(categories=>categories.includes(adventure)));
   const button=page.locator('[data-select-program]:visible').first();
   if(await button.count()){
    await button.click();
    const title=await button.getAttribute('data-title');
    const url=await page.locator('.blu-bottle-card a.blu-button').getAttribute('href');
    const message=new URL(url).searchParams.get('text');
    assert.ok(message.includes(title));
    const label=await page.locator(`[data-adventure="${adventure}"]`).getAttribute('data-title');
    assert.ok(message.includes(label));
   }
   await page.locator('[data-adventure-reset]').click();
   assert.equal(await page.locator('[data-program-preview]:visible').count(),4);
   assert.equal(await page.locator('[data-select-program][aria-pressed="true"]').count(),0);
  }
  await page.locator('.blu-fabio-story summary').click();
  assert.ok(await page.locator('.blu-biography').last().isVisible());
  assert.equal(await page.locator('.blu-reviews figure').count(),3);
  assert.equal(await page.locator('[data-experience-card]:visible').count(),6);
  const placement=await page.evaluate(()=>{
    const characters=document.querySelector('.blu-character-stories').getBoundingClientRect();
    const programs=document.querySelector('#blu-programs').getBoundingClientRect();
    return {right:programs.left>=characters.right,below:programs.top>=characters.bottom};
  });
  assert.ok(width>=1100?placement.right:placement.below);
  const gap=await page.evaluate(()=>document.querySelector('.blu-fabio-story').getBoundingClientRect().top-document.querySelector('.blu-experiences').getBoundingClientRect().bottom);
  assert.ok(gap>=0&&gap<=80,'Biography follows the six characters without waiting for the sidebar');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false);
  await page.evaluate(async()=>{for(const img of document.images){if(img.loading==='lazy')img.loading='eager';}await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
  assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src)),[]);
  await page.locator('.blu-fabio-story summary').click();
  await page.screenshot({path:fileURLToPath(new URL(`journey-${locale}-${width}.png`,output)),fullPage:true});
  if(locale==='en') await page.locator(width===1440?'.blu-content-layout':'.blu-hero').screenshot({path:fileURLToPath(new URL(`journey-focus-${width}.png`,output))});
  assert.deepEqual(errors,[]);
  console.log(`${locale} ${width}px: heading, catalog filters, selection/message/reset, biography, 3 reviews, images and overflow passed`);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
 await page.goto(origin+'/en/blu/');
 await page.getByRole('button',{name:'Reject optional',exact:true}).click();
 await page.locator('#blu-effects').selectOption('full');
 await page.waitForSelector('body[data-effects="full"]');
 await page.locator('.blu-reality').scrollIntoViewIfNeeded();
 await page.waitForTimeout(900);
 assert.ok(await page.locator('.blu-reality>img').evaluate(el=>el.style.transform.length>0));
 assert.equal(await page.locator('.blu-reality>img').evaluate(el=>el.style.willChange),'transform');
 await page.screenshot({path:fileURLToPath(new URL('journey-scroll-full.png',output))});
 await page.locator('#blu-effects').selectOption('lite');
 assert.equal(await page.locator('.blu-reality>img').evaluate(el=>el.style.cssText),'');
 await page.locator('#blu-effects').selectOption('full');
 await page.waitForSelector('body[data-effects="full"]');
 await page.locator('.blu-reality').scrollIntoViewIfNeeded();
 await page.waitForTimeout(250);
 await page.locator('.blu-faq').scrollIntoViewIfNeeded();
 await page.waitForTimeout(250);
 assert.equal(await page.locator('.blu-reality>img').evaluate(el=>el.style.cssText),'');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForSelector('body[data-effects="lite"]');
 assert.equal(await page.locator('.blu-bubble').count(),0);
 console.log('Lazy GSAP reveal, offscreen cleanup, Reduced cleanup and synthetic hidden-tab stop passed');
 await page.close();
} finally {await browser.close();}
