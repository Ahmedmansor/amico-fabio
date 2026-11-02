import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341',results=[];
try{
 for(const width of [375,1440])for(const route of ['tours/ras_mohammed_white_island_vip/','packages/dolce_vita_family/']){
  const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
  await page.goto(`${origin}/en/${route}`,{waitUntil:'load'});await page.getByRole('button',{name:'Reject optional',exact:true}).click();
  assert.equal(await page.locator('#inp-name').evaluate(n=>getComputedStyle(n,'::placeholder').color),'rgb(89, 89, 112)');
  await page.locator('[data-gallery-open]').first().click();await page.keyboard.press('Tab');
  const focus=()=>page.evaluate(()=>({visible:document.activeElement.matches(':focus-visible'),color:getComputedStyle(document.activeElement).outlineColor}));
  assert.deepEqual(await focus(),{visible:true,color:'rgb(10, 43, 75)'});await page.keyboard.press('Escape');
  if(route.startsWith('packages')){await page.locator('#included-trips-grid [data-trip-id]').first().click();await page.keyboard.press('Tab');assert.deepEqual(await focus(),{visible:true,color:'rgb(10, 43, 75)'});await page.keyboard.press('Escape');}
  results.push({route,width,keyboardFocus:true,placeholder:true});await page.close();
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||'qa/details/catalog-focus.json',JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify({cases:results.length,pass:true}));
