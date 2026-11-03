import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
await mkdir('qa/wishlist/screenshots',{recursive:true});
try {
 for(const locale of ['en','it'])for(const width of [375,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.QA_ORIGIN||'http://127.0.0.1:4333'}/${locale}/wishlist/`,{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true});
  await reject.waitFor({state:'visible'});await reject.click();
  await page.locator('[data-wishlist-empty]').waitFor({state:'visible'});
  await page.screenshot({path:`qa/wishlist/screenshots/design-${locale}-${width}-empty.png`,fullPage:true});
  const keys=await page.locator('[data-wishlist-item]').evaluateAll(nodes=>[nodes.find(n=>!n.dataset.tripId.startsWith('package:')).dataset.tripId,nodes.find(n=>n.dataset.tripId.startsWith('package:')).dataset.tripId]);
  await page.evaluate(keys=>keys.forEach(key=>{const pack=key.startsWith('package:');localStorage.setItem('fabio:wishlist:v1:'+(pack?'package:':'trip:')+(pack?key.slice(8):encodeURIComponent(key)),'1');}),keys);
  await page.reload();
  const saved=page.locator('[data-wishlist-item]:visible');await saved.first().waitFor();
  assert.equal(await saved.count(),2);
  assert.equal(await page.locator('[data-wishlist-section]:visible').count(),2);
  assert.equal(await page.locator('.wishlist-count').first().textContent(),'2');
  await page.locator('.wishlist-card-photo img:visible').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.screenshot({path:`qa/wishlist/screenshots/design-${locale}-${width}-saved.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await saved.first().locator('[data-favorite]').click();
  assert.equal(await saved.count(),1);
  assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-favorite]')),true);
  await saved.first().locator('[data-favorite]').click();
  await page.locator('[data-wishlist-empty]').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.activeElement.matches('.wishlist-browse')),true);
  assert.deepEqual(errors,[]);
  results.push({locale,width,empty:true,tripAndPackage:true,removeAndFocus:true,errors});await context.close();
 }
}finally{await browser.close();}
await writeFile(new URL('./design.json',import.meta.url),JSON.stringify({results},null,2)+'\n');console.log(JSON.stringify(results));
