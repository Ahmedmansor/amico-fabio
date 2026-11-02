import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://localhost:4321',results=[];
try{
 for(const locale of ['it','en'])for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Reproduce an unavailable optional analytics/consent dependency.
  await page.route(/cookieconsent|\/analytics\/lead/,route=>route.abort());
  await page.goto(`${origin}/${locale}/egypt/cairo/`,{waitUntil:'load'});
  const form=page.locator('[data-blog-inquiry]:visible').first();
  const change=(field,direction)=>form.locator(`[data-step=${field}][data-change="${direction}"]`).click();
  await change('adults',1);assert.equal(await form.locator('[name=adults]').inputValue(),'2');
  await change('children',1);assert.equal(await form.locator('[name=children]').inputValue(),'1');
  assert.ok(await page.locator('[data-blog-inquiry]').evaluateAll(forms=>forms.every(form=>form.elements.adults.value==='2'&&form.elements.children.value==='1')));
  await change('adults',-1);await change('adults',-1);assert.equal(await form.locator('[name=adults]').inputValue(),'1');
  await change('children',-1);await change('children',-1);assert.equal(await form.locator('[name=children]').inputValue(),'0');
  await form.locator('[name=name]').fill('QA Example');
  await form.locator('[name=nationality]').evaluate(n=>{n.value='Italian';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await form.locator('[name=date]').evaluate(n=>{const date=new Date();date.setDate(date.getDate()+3);n.value=date.toISOString().slice(0,10);n.dispatchEvent(new Event('change',{bubbles:true}));});
  await form.locator('button[type=submit]').click();
  await page.locator('[data-inquiry-review]:visible').waitFor();
  assert.deepEqual(errors,[]);
  results.push({locale,width,analyticsUnavailable:true,increment:true,decrementAndMinima:true,synchronizedDraft:true,localReview:true,externalHandoff:false});await page.close();
 }
}finally{await browser.close();}
await writeFile(new URL(`./stepper-${new URL(origin).port}.json`,import.meta.url),JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify({cases:results.length,pass:true,externalLeadsSent:0}));
