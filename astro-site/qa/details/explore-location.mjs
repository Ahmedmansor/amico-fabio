import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341',results=[];
await mkdir('qa/details/screenshots/explore-location',{recursive:true});
try{
 for(const [locale,width] of [['en',375],['it',1280]]){
  const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${origin}/${locale}/explore/`,{waitUntil:'load'});await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  assert.equal(await page.locator('[data-explore-location]').count(),4);await page.locator('#price-sort').selectOption('price_desc');
  for(const city of ['sharm','cairo','luxor_and_aswan','all']){
   await page.locator(`[data-explore-location="${city}"]`).click();
   await page.waitForFunction(city=>document.querySelector('[data-explore]')?.dataset.location===city&&document.querySelector('#price-sort')?.value==='price_desc',city);
   assert.equal(await page.locator(`[data-explore-location="${city}"]`).getAttribute('aria-current'),'page');
   assert.equal(await page.locator('[data-filter="all"]').getAttribute('aria-pressed'),'true');
   const locations=await page.locator('[data-explore-card]').evaluateAll(nodes=>nodes.map(n=>n.dataset.location));
   assert.ok(locations.length>0);assert.ok(locations.every(value=>city==='all'||(city==='luxor_and_aswan'?value.includes('luxor')||value.includes('aswan'):value.includes(city))));
   const prices=await page.locator('[data-explore-card]:visible').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.price)));assert.deepEqual(prices,[...prices].sort((a,b)=>b-a));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.screenshot({path:`qa/details/screenshots/explore-location/${locale}-${width}.png`});assert.deepEqual(errors,[]);
  results.push({locale,width,cities:['sharm','cairo','luxor_and_aswan','all'],nativeRoutes:true,sortPreserved:true,categoryReset:true,errors});console.log(`${locale} ${width}: all four cities PASS`);await page.close();
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||'qa/details/explore-location.json',JSON.stringify({origin,results},null,2)+'\n');
