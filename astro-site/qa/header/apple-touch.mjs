// Public interactions only: no account, email, booking or remote data writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium,webkit,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4336';
const phase=process.env.QA_PHASE||'before';
const output=new URL(`./screenshots/apple-${phase}/`,import.meta.url);
await mkdir(output,{recursive:true});
const results=[];
for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
 const browser=await type.launch({headless:true});
 try{
  for(const device of ['iPhone 13','iPad (gen 7)']){
   const context=await browser.newContext({...devices[device]});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   await page.goto(origin+'/it/',{waitUntil:'networkidle'});
   const consent=page.locator('#cookie-consent-config');
   if(await consent.count()){
    const label=await consent.evaluate(n=>JSON.parse(n.textContent).messages.reject);
    const button=page.getByRole('button',{name:label,exact:true}).first();
    if(await button.isVisible())await button.tap();
   }
   await page.locator('.wf-bio-btn').tap();
   const italianBiographyOpened=await page.locator('#fabio-biography').evaluate(n=>n.open);
   await page.locator('#fabio-biography [data-close-fabio]').first().tap();
   await page.locator('.site-language>summary').tap();
   await page.locator('.site-language a[data-lang="en"]').tap();
   await page.waitForURL(origin+'/en/',{timeout:4000}).catch(()=>{});
   const languageNavigated=new URL(page.url()).pathname==='/en/';
   await page.locator('.wf-bio-btn').tap();
   const biographyOpened=await page.locator('#fabio-biography').evaluate(n=>n.open);
   await page.screenshot({path:fileURLToPath(new URL(`${engine}-${device.replaceAll(' ','-')}.png`,output))});
   if(phase==='after'){
    await page.locator('#fabio-biography [data-close-fabio]').first().tap();
    for(const locale of ['es','pt','de','it']){
     await page.locator('.site-language>summary').tap();
     await page.locator(`.site-language a[data-lang="${locale}"]`).tap();
     await page.waitForURL(`${origin}/${locale}/`);
     assert.equal(await page.locator('html').getAttribute('lang'),locale);
    }
    await page.locator('.site-language>summary').tap();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.site-language').getAttribute('open'),null);
    await page.locator('.site-language>summary').tap();
    await page.locator('.site-currency>summary').tap();
    assert.equal(await page.locator('.site-language').getAttribute('open'),null);
    await page.locator('[data-currency="USD"]').tap();
    assert.equal((await page.locator('[data-current-currency]').textContent()).trim(),'USD');
    await page.locator('.site-menu>summary').tap();
    const href=await page.locator('.site-menu a').first().getAttribute('href');
    const next=page.locator('.site-menu a').filter({hasText:/./}).nth(1);
    const nextHref=await next.getAttribute('href');assert(nextHref!==href);
    await next.tap();await page.waitForURL(origin+nextHref);
   }
   const row={engine,version:browser.version(),device,languageNavigated,italianBiographyOpened,biographyOpened,extendedNavigation:phase==='after',errors};
   console.log(JSON.stringify(row));results.push(row);await context.close();
  }
 }finally{await browser.close();}
}
await writeFile(new URL(`./apple-touch-${phase}.json`,import.meta.url),JSON.stringify({origin,results},null,2)+'\n');
if(phase==='after')assert(results.every(r=>r.languageNavigated&&r.italianBiographyOpened&&r.biographyOpened&&r.errors.length===0));
