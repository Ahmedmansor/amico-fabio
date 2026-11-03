// One real touch after editing must open the selector, without a retry tap.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {webkit,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4337';
const browser=await webkit.launch(),results=[];
try{
 for(const device of ['iPhone 13','iPad (gen 7)'])for(const locale of ['it','en']){
  const context=await browser.newContext({...devices[device]}),page=await context.newPage();
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.goto(`${origin}/${locale}/tailor-your-trip/`,{waitUntil:'networkidle'});
  const label=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);await page.getByRole('button',{name:label,exact:true}).tap();
  await page.locator('[name=details]').fill('A family visit to Egypt.');
  await page.locator('[data-nationality-trigger]').tap();
  await page.locator('[data-nationality-options]:popover-open').waitFor({state:'visible'});
  await page.locator('[data-nationality-value="Italian"]').tap();
  assert.equal(await page.locator('[name=nationality]').inputValue(),'Italian');
  await page.locator('[name=details]').fill('A revised family visit to Egypt.');
  await page.locator('[data-nationality-trigger]').tap();
  await page.locator('[data-nationality-options]:popover-open').waitFor({state:'visible'});
  await page.locator('[data-nationality-value="French"]').tap();
  assert.equal(await page.locator('[name=nationality]').inputValue(),'French');
  results.push({device,locale,firstTouchOpens:true,selection:true,reopenAfterValidation:true,changeSelection:true});
  console.log(JSON.stringify(results.at(-1)));await context.close();
 }
}finally{await browser.close();}
await writeFile('qa/header/nationality-touch.json',JSON.stringify({origin,engine:'WebKit',results},null,2)+'\n');
