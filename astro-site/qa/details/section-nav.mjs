import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
try {
 for(const width of [375,1280]) for(const route of ['en/tours/ras_mohammed_white_island_vip/','it/packages/sharm_confidential/']) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto((process.env.QA_ORIGIN||'http://127.0.0.1:4333')+'/'+route,{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:route.startsWith('it')?'Rifiuta facoltativi':'Reject optional',exact:true});
  if(await reject.isVisible())await reject.click();
  const links=page.locator('.product-section-nav a');
  const hashes=await links.evaluateAll(nodes=>nodes.map(n=>n.hash));
  for(const hash of hashes.slice(0,-1)) {
   await page.evaluate(hash=>{const n=document.querySelector(hash),nav=document.querySelector('.product-section-nav');scrollTo(0,n.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(nav).top)-nav.offsetHeight-12);},hash);
   await page.waitForFunction(hash=>document.querySelector('.product-section-nav [aria-current]')?.getAttribute('href')===hash,hash);
  }
  await links.last().click();
  await page.waitForFunction(()=>document.querySelector('.product-section-nav a:last-child').getAttribute('aria-current')==='location');
  await page.locator('#trip-booking-form input').first().focus();
  assert.equal(await links.last().getAttribute('aria-current'),'location');
  assert.ok(await links.first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=14));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`qa/details/screenshots/section-nav-${width}-${route.slice(0,2)}.png`});
  results.push({route,width,sections:hashes,pass:true});await page.close();
 }
}finally{await browser.close();}
await writeFile(new URL('./section-nav.json',import.meta.url),JSON.stringify({results},null,2)+'\n');
console.log(JSON.stringify(results));
