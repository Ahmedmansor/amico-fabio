import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4340',results=[];
await mkdir('qa/home-refresh/screenshots/performance',{recursive:true});
try{
 for(const locale of ['en','it'])for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(`${origin}/${locale}/`,{waitUntil:'load'});
  await page.locator('.hero-slide').first().evaluate(n=>n.decode());
  const slider=page.locator('.hero-slider-bg');
  if(width===375){
   assert.equal(await slider.locator('img').count(),1);
   assert.equal(requests.some(url=>url.includes('/_astro/2.')||url.includes('/_astro/3.')),false);
   await slider.dispatchEvent('pointerdown');
  }
  await page.waitForFunction(()=>document.querySelectorAll('.hero-slider-bg img').length===3);
  await slider.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
  if(width===375)await slider.evaluate(n=>n.scrollTo({left:n.clientWidth,behavior:'instant'}));
  const reject=page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true});if(await reject.isVisible())await reject.click();
  await page.screenshot({path:`qa/home-refresh/screenshots/performance/${locale}-${width}.png`});
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push({locale,width,allImagesLoad:true,mobileDeferred:width===375,errors});await page.close();
 }
 const native=await browser.newPage({javaScriptEnabled:false,viewport:{width:375,height:900}});await native.goto(`${origin}/en/`);
 assert.equal(await native.locator('.hero-slider-bg img').count(),3);results.push({noJavaScriptAllImages:true});await native.close();
}finally{await browser.close();}
await writeFile(new URL('./hero-loading.json',import.meta.url),JSON.stringify({results},null,2)+'\n');console.log(JSON.stringify(results));
