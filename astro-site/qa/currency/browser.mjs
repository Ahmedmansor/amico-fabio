// Local preview only. WhatsApp is intercepted; no booking/Auth request is sent.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4333';
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
async function dismiss(page){
  const config=page.locator('#cookie-consent-config');
  if(await config.count()){
    const label=await config.evaluate(n=>JSON.parse(n.textContent).messages.reject);
    const b=page.getByRole('button',{name:label,exact:true}).first();
    await b.waitFor({state:'visible',timeout:2500}).catch(()=>{});
    if(await b.isVisible())await b.click();
  }
}
async function choose(page,code){
  await page.locator('.site-currency summary').click();
  await page.locator(`[data-currency="${code}"]`).click();
  await page.waitForFunction(code=>document.querySelector('[data-current-currency]')?.textContent===code,code);
}
async function prices(page,code,locale){
  const bad=await page.locator('[data-price-eur]').evaluateAll((nodes,{code,locale})=>nodes.flatMap(n=>{
    const eur=Number(n.dataset.priceEur),rate=code==='USD'?1.12:code==='GBP'?.88:1;
    const value=code==='EUR'?eur:Math.ceil(Number((eur*rate).toFixed(10)));
    const expected=new Intl.NumberFormat(locale,{style:'currency',currency:code,minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
    return n.textContent===expected?[]:[{eur,actual:n.textContent,expected}];
  }),{code,locale});
  assert.deepEqual(bad,[]);
}
try{
  for(const locale of ['it','en','es','pt'])for(const width of [320,375,1280]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${origin}/${locale}/explore/`);await dismiss(page);
    await prices(page,'EUR',locale);
    await choose(page,'USD');await prices(page,'USD',locale);
    await page.locator('#price-sort').selectOption('price_asc');await prices(page,'USD',locale);
    const sorted=await page.locator('[data-explore-card]:visible').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.price)));
    assert(sorted.every((v,i)=>i===0||v>=sorted[i-1]));
    await page.reload();await prices(page,'USD',locale);
    await choose(page,'GBP');await prices(page,'GBP',locale);
    await page.locator('.site-currency summary').click();
    await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}.png`,output))});
    await page.keyboard.press('Escape');assert.equal(await page.locator('.site-currency').getAttribute('open'),null);
    assert(await page.locator('.site-currency summary').evaluate(n=>n===document.activeElement));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,`${locale} ${width} overflow`);
    const favorite=page.locator('[data-explore-card]:visible [data-favorite]').first();await favorite.click();
    await page.goto(`${origin}/${locale}/wishlist/`);await page.locator('.wishlist-card:visible').first().waitFor();await prices(page,'GBP',locale);
    await page.goto(`${origin}/${locale}/tours/ras_mohammed_bus_half_day/`);await prices(page,'GBP',locale);
    const before=await page.locator('#live-total-price').getAttribute('data-price-eur');
    await page.locator('[data-pax="adults"][data-change="1"]').click();
    assert(Number(await page.locator('#live-total-price').getAttribute('data-price-eur'))>Number(before));await prices(page,'GBP',locale);
    await page.locator('#inp-name').fill('Local QA');await page.locator('#inp-date').fill('2026-12-20');
    await page.locator('#nation-picker').click();await page.locator('[data-nationality]').first().click();
    await page.locator('#btn-submit-booking').click();await page.locator('#invoice-modal').waitFor({state:'visible'});await prices(page,'GBP',locale);
    await page.evaluate(()=>{window.__qaOpened='';window.open=url=>{window.__qaOpened=String(url);return null;};});
    await page.locator('#confirm-invoice').click();
    const message=await page.evaluate(()=>new URL(window.__qaOpened).searchParams.get('text'));
    assert(message.includes('GBP'));assert(message.includes('€'));
    // Switch on the next page: persistence and shared header, independent of language.
    await page.goto(`${origin}/${locale}/explore/`);await choose(page,'USD');
    const packageHref=await page.locator('a[href*="/packages/"]').first().getAttribute('href');assert(packageHref);
    await page.goto(origin+packageHref);await prices(page,'USD',locale);
    await page.screenshot({path:fileURLToPath(new URL(`${locale}-package-${width}.png`,output)),fullPage:false});
    assert.deepEqual(errors,[]);results.push({locale,width,prices:true,sort:true,reload:true,wishlist:true,booking:true,whatsappIntercepted:true,package:true,overflow,errors});
    await context.close();
  }
  const context=await browser.newContext();const a=await context.newPage(),b=await context.newPage();
  await a.goto(origin+'/en/explore/');await b.goto(origin+'/it/explore/');await dismiss(a);await choose(a,'USD');
  await b.waitForFunction(()=>document.querySelector('[data-current-currency]')?.textContent==='USD');await prices(b,'USD','it');
  await a.evaluate(()=>localStorage.setItem('fabio_currency','invalid'));await b.reload();await prices(b,'EUR','it');await context.close();
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage denied');}});});
  const page=await blocked.newPage();await page.goto(origin+'/en/explore/');await dismiss(page);await choose(page,'GBP');await prices(page,'GBP','en');await blocked.close();
  results.push({crossTab:true,invalidSavedPreference:true,storageDenied:true});
  await writeFile(new URL('./results.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');
  console.log(`Currency browser QA: ${results.length} cases passed; four languages, mobile/desktop, prices, persistence, sorting, wishlist, bookings, packages and intercepted WhatsApp.`);
}finally{await browser.close();}
