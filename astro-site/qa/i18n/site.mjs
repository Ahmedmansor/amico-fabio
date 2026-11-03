import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {supportedLocales} from '../../src/shared/config/languages.ts';
const locales=process.env.QA_LOCALES?.split(',')||['es','pt'];
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
const shared={},trips={},packages={};
for(const locale of locales){
 shared[locale]=JSON.parse(await readFile(`src/shared/i18n/dictionaries/${locale}.json`,'utf8'));
 trips[locale]=JSON.parse(await readFile(`src/features/tours/data/content/${locale}.json`,'utf8'));
 packages[locale]=JSON.parse(await readFile(`src/features/packages/data/content/${locale}.json`,'utf8'));
}
await mkdir('qa/i18n/screenshots',{recursive:true});
try{
 for(const locale of locales)for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const routes=process.env.QA_FULL_SITE?['','packages/dolce_vita_family/','explore/','tours/ras_mohammed_white_island_vip/','egypt/','login/','wishlist/','legal/','sharm-secrets/','tailor-your-trip/','blog/','blog/exploring-cairo-beyond-giza/']:process.env.QA_HOME_IMAGES_ONLY?['']:width===390||process.env.QA_SMOKE?['','packages/dolce_vita_family/']:['','packages/dolce_vita_family/','explore/','tours/ras_mohammed_white_island_vip/','egypt/','login/'];
  for(const route of routes){
   const response=await page.goto(`${origin}/${locale}/${route}`,{waitUntil:'load'});
   assert.equal(response.status(),200,`${locale}/${route}`);
   const reject=page.getByRole('button',{name:shared[locale].cookies.reject,exact:true});
   if(!(await context.cookies()).some(cookie=>cookie.name==='fabio_consent')) {
    await reject.waitFor({state:'visible'});await reject.click();await reject.waitFor({state:'hidden'});
   }
   await page.evaluate(()=>document.fonts.ready);
   if(!route){
    for(const selector of ['#who-fabio','.lux-entry-card:nth-child(1)','.lux-entry-card:nth-child(2)','.lux-entry-card:nth-child(3)']){
     await page.locator(selector).scrollIntoViewIfNeeded();
     await page.waitForFunction(selector=>[...document.querySelectorAll(`${selector} img`)].every(img=>img.complete&&img.naturalWidth>0),selector);
    }
    await page.evaluate(()=>scrollTo(0,0));
   }
   const facts=await page.evaluate(()=>({lang:document.documentElement.lang,h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,robots:document.querySelector('meta[name=robots]')?.content,switches:[...document.querySelectorAll('.site-language [data-lang-switch]')].map(n=>({lang:n.dataset.lang,href:n.getAttribute('href')})),brokenImages:[...document.images].filter(n=>n.complete&&!n.naturalWidth&&n.getBoundingClientRect().width>0).map(n=>n.src)}));
   assert.equal(facts.lang,locale);assert.equal(facts.h1,1);assert.equal(facts.overflow,false,`horizontal overflow ${locale}/${route}/${width}`);
   assert.match(facts.robots,/noindex/);assert.deepEqual(facts.brokenImages,[]);
   if(!route.startsWith('login')&&!route.startsWith('blog')){
    assert.equal(facts.switches.length,supportedLocales.length);
    for(const link of facts.switches)assert.equal(new URL(link.href,origin).pathname,`/${link.lang}/${route}`);
   }
   if(route.startsWith('packages')){
    assert.equal(await page.locator('h1').innerText(),packages[locale].dolce_vita_family.title);
    const card=page.locator('#included-trips-grid [data-trip-id]').first(),id=await card.getAttribute('data-trip-id');
    await card.click();await page.locator('#included-trip-modal').waitFor({state:'visible'});
    assert.equal(await page.locator('#included-trip-active-title').innerText(),trips[locale][id].title);
    await page.keyboard.press('Escape');
    await page.locator('#inp-name').fill('QA');
    await page.locator('#inp-date').fill(new Date(Date.now()+86400000).toISOString().slice(0,10));
    await page.locator('#nation-picker').click();await page.locator('#nation-list [data-nationality="Italian"]').click();
    assert.equal(await page.locator('#inp-nation').inputValue(),'Italian');
    await page.locator('#btn-submit-booking').click();await page.locator('#invoice-modal').waitFor({state:'visible'});
    const nationality=locale==='es'?'Italia':locale==='de'?'Italien':'Itália';
    assert.ok((await page.locator('#invoice-content').innerText()).includes(nationality));
    await page.evaluate(()=>{window.open=url=>{window.__qaWhatsAppUrl=url;return null;};});
    await page.locator('#confirm-invoice').click();
    const url=new URL(await page.evaluate(()=>window.__qaWhatsAppUrl));
    assert.equal(url.hostname,'wa.me');assert.ok(url.searchParams.get('text').includes(packages[locale].dolce_vita_family.title));
    assert.ok(url.searchParams.get('text').includes(nationality));
   }
   if(route==='explore/'){
    assert.equal(await page.locator('[data-explore-location]').count(),4);
    await page.locator('[data-explore-location="cairo"]').click();
    assert.equal(new URL(page.url()).pathname,`/${locale}/explore/cairo/`);
    assert.equal(await page.locator('[data-explore]').getAttribute('data-location'),'cairo');
   }
   if(route.startsWith('tours'))assert.equal(await page.locator('h1').innerText(),trips[locale].ras_mohammed_white_island_vip.title);
   assert.deepEqual(errors,[]);
   if(!route||process.env.QA_CAPTURE_ALL)await page.screenshot({path:`qa/i18n/screenshots/${route.replaceAll('/','-')||'home'}-${locale}-${width}.png`,fullPage:true});
   results.push({locale,width,route,h1:true,noOverflow:true,languageLinks:true,packageInteraction:route.startsWith('packages'),errors:[]});
  }
  await context.close();
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||'qa/i18n/site.json',JSON.stringify({origin,results},null,2)+'\n');
console.log(JSON.stringify({cases:results.length,pass:true,origin}));
