import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const[modulePath,executablePath]=process.argv.slice(2);
const{chromium}=await import(pathToFileURL(modulePath).href);
const browser=await chromium.launch({headless:true,executablePath}),origin='http://127.0.0.1:4327',results=[];
try{
 for(const[route,width,selector]of [
  ['/en/egypt/giza-pyramids/',1280,'.blog-prose [data-open-lead]'],
  ['/en/blog/common-tourist-traps-egypt/',375,'.blog-mobile-bar [data-open-lead]'],
 ]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});let externalAttempts=0;
  await context.route('https://wa.me/**',async route=>{externalAttempts++;await route.abort();});
  const page=await context.newPage();await page.goto(origin+route,{waitUntil:'networkidle'});
  const rejectLabel=await page.locator('#cookie-consent-config').evaluate(node=>JSON.parse(node.textContent).messages.reject);
  const reject=page.getByRole('button',{name:rejectLabel,exact:true});if(await reject.count())await reject.first().click();
  const opener=page.locator(selector);await opener.click();
  await page.waitForSelector('#blog-inquiry-dialog[open]');
  assert.equal(await page.locator('#blog-inquiry-dialog form').isVisible(),true);
  await page.keyboard.press('Escape');await page.waitForSelector('#blog-inquiry-dialog[open]',{state:'hidden'});
  assert.equal(await opener.evaluate(node=>document.activeElement===node),true);assert.equal(externalAttempts,0);
  results.push({route,width,dialogOpened:true,escapeAndFocusRestored:true,externalAttempts});await context.close();
 }
 console.log('PASS: guide desktop CTA and article mobile action open the existing inquiry dialog; Escape/focus work and no WhatsApp request occurs.');
}finally{await browser.close();await writeFile(new URL('../../qa/blog/EDITORIAL_CONTACT.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');}
