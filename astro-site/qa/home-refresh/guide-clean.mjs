import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const phase=process.argv[2]||'after',origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341';
const baseline=phase==='after'?JSON.parse(await readFile('qa/home-refresh/guide-clean-before.json','utf8')):null;
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});const results=[];
await mkdir(`qa/home-refresh/screenshots/guide-clean-${phase}`,{recursive:true});
try{
 for(const locale of ['it','en'])for(const width of [375,1280]){
  if(process.env.QA_SMOKE==='1'&&((locale==='it'&&width===375)||(locale==='en'&&width===1280)))continue;
  const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(`${origin}/${locale}/sharm-secrets/`,{waitUntil:'load'});await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
   const content=await page.evaluate(()=>{const main=document.querySelector('.sharm-app').cloneNode(true);main.querySelectorAll('.rotation-control').forEach(n=>n.remove());return {text:main.textContent.replace(/\s+/g,' ').trim(),images:[...main.querySelectorAll('img')].map(n=>({alt:n.alt,src:n.getAttribute('src')})),index:[...document.querySelectorAll('.index-link')].map(n=>({text:n.textContent,href:n.getAttribute('href')}))};});
  if(baseline){const words=text=>[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].filter(x=>!/\p{Extended_Pictographic}/u.test(x.segment)).map(x=>x.segment).join('').replace(/\s+/g,' ').trim();const normalize=record=>({...record,text:words(record.text),index:record.index.map(x=>({...x,text:words(x.text)}))});assert.deepEqual(normalize(content),normalize(baseline.results.find(r=>r.locale===locale&&r.width===width).content));}
  await page.locator('.hero-photo').evaluate(n=>n.decode());await page.screenshot({path:`qa/home-refresh/screenshots/guide-clean-${phase}/${locale}-${width}-hero.png`});
  await page.locator('#page2').scrollIntoViewIfNeeded();await page.locator('#page2 .catalog-card-img').first().evaluate(n=>n.decode());await page.screenshot({path:`qa/home-refresh/screenshots/guide-clean-${phase}/${locale}-${width}-cards.png`});
  if(phase==='after'&&locale==='en'&&width===1280){await page.locator('#rules-page3 .catalog-card').nth(4).scrollIntoViewIfNeeded();for(const i of [4,5])await page.locator('#rules-page3 .catalog-card-img').nth(i).evaluate(n=>n.decode());await page.screenshot({path:`qa/home-refresh/screenshots/guide-clean-${phase}/rules-5-6.png`});}
  const toggle=page.locator('#secrets-index-toggle');await toggle.click();await page.screenshot({path:`qa/home-refresh/screenshots/guide-clean-${phase}/${locale}-${width}-index.png`});
  if(phase==='after'){
   assert.equal(await page.locator('#indexMenu').evaluate(n=>n instanceof HTMLDialogElement&&n.open),true);
   await page.keyboard.press('Escape');assert.equal(await toggle.evaluate(n=>n===document.activeElement),true);
   await toggle.click();await page.locator('.index-link[href="#page3"]').click();assert.ok(await page.locator('#page3').evaluate(n=>n.getBoundingClientRect().top<innerHeight));
   await page.locator('.adventure-card').first().click();assert.equal(await page.locator('#adventuresModal').evaluate(n=>n.open),true);await page.keyboard.press('Escape');
   assert.equal(await page.locator('.sharm-app .section').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).backgroundImage==='none')),true);
   assert.equal(await page.locator('#secrets-index-toggle .guide-index-label').count(),1);
   assert.equal(await page.locator('.sharm-app .catalog-card-img').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height<=360)),true);
   assert.equal(await page.locator('.sharm-app').evaluate(n=>/\p{Extended_Pictographic}/u.test(n.textContent)),false);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  results.push({locale,width,content,pass:true});console.log(`${phase} ${locale} ${width}: PASS`);await page.close();
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||`qa/home-refresh/guide-clean-${phase}.json`,JSON.stringify({origin,results},null,2)+'\n');
