import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
try{
 for(const width of [375,1280])for(const route of ['en/egypt/aswan/','it/tailor-your-trip/']){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.QA_ORIGIN||'http://127.0.0.1:4333'}/${route}`,{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:route.startsWith('it')?'Rifiuta facoltativi':'Reject optional',exact:true});await reject.waitFor();await reject.click();
  const trigger=page.locator('[data-nationality-trigger]:visible').first();await trigger.click();
  const list=page.locator('[data-nationality-options]:popover-open');await list.waitFor({state:'visible'});
  await page.keyboard.type('ital');await page.keyboard.press('Enter');
  const picker=trigger.locator('..');assert.equal(await picker.locator('select').inputValue(),'Italian');
  assert.equal(await trigger.locator('.nationality-flag').count(),1);
  assert.equal(await picker.locator('select').evaluate(n=>new FormData(n.form).get('nationality')),'Italian');
  if(route.includes('aswan'))assert.ok(await page.locator('[data-blog-inquiry] select[name=nationality]').evaluateAll(nodes=>nodes.every(n=>n.value==='Italian')));
  await trigger.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');
  assert.equal(await trigger.evaluate(n=>n===document.activeElement),true);
  await page.waitForFunction(()=>![...document.querySelectorAll('[data-nationality-options]')].some(n=>n.matches(':popover-open')));
  await trigger.click();await page.keyboard.type('egyp');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Egypt');
  await page.screenshot({path:`qa/details/screenshots/nationality-${width}-${route.slice(0,2)}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  results.push({width,route,flag:true,keyboard:true,formValue:true,sharedDraft:route.includes('aswan'),errors});await page.close();
 }
 const fallback=await browser.newPage({viewport:{width:375,height:900}});
 await fallback.addInitScript(()=>{delete HTMLElement.prototype.showPopover;});
 await fallback.goto(`${process.env.QA_ORIGIN||'http://127.0.0.1:4333'}/en/tailor-your-trip/`);
 assert.equal(await fallback.locator('select[name=nationality]').isVisible(),true);
 assert.equal(await fallback.locator('[data-nationality-options]').isVisible(),false);
 results.push({nativeFallback:true});await fallback.close();
}finally{await browser.close();}
await writeFile(new URL('./nationality.json',import.meta.url),JSON.stringify({results},null,2)+'\n');console.log(JSON.stringify(results));
