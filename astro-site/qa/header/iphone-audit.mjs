// Touch journey audit. All external traffic is blocked or explicitly synthetic.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {webkit,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4337';
const phase=process.env.QA_PHASE||'before';
const selected=(process.env.QA_JOURNEYS||'').split(',').filter(Boolean);
const shots=`qa/header/screenshots/iphone-audit-${phase}`;
await mkdir(shots,{recursive:true});
const browser=await webkit.launch({headless:true}),results=[];
const future='2026-12-20';
async function dismiss(page){
 const config=page.locator('#cookie-consent-config');
 if(await config.count()){
  const name=await config.evaluate(n=>JSON.parse(n.textContent).messages.reject);
  const button=page.getByRole('button',{name,exact:true}).first();
  if(await button.isVisible())await button.tap();
 }
}
async function go(page,path){const response=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(response.status(),200,path);await dismiss(page);}
async function noOverflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal page overflow');}
async function country(form){
 const trigger=form.locator('[data-nationality-trigger]');
 if(await trigger.isVisible()){
  await trigger.tap();await form.page().locator('[data-nationality-value="Italian"]:visible').first().tap();
 }else await form.locator('[name=nationality]').selectOption('Italian');
}
async function run(device,locale,name,action){
 const context=await browser.newContext({...devices[device]}),page=await context.newPage(),errors=[],requests=[],failedScripts=[];
 let navigating=false;
 page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())navigating=true;});
 page.on('domcontentloaded',()=>{navigating=false;});
 page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>{if(r.resourceType()==='script'&&new URL(r.url()).origin===origin)failedScripts.push({path:new URL(r.url()).pathname,error:r.failure()?.errorText,duringNavigation:navigating});});
 await context.addInitScript(()=>{window.__qaHandoffs=[];window.open=url=>{window.__qaHandoffs.push(String(url));return null;};});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin===origin){
   if(request.resourceType()==='document'){
    const response=await route.fetch();let body=await response.text();
    // Test transport only: use the local origin in public Auth configs.
    body=body.replaceAll(/"siteOrigin":"[^"]+"/g,`"siteOrigin":"${origin}"`);
    return route.fulfill({response,body});
   }
   return route.continue();
  }
  if(url.hostname==='challenges.cloudflare.com')return route.fulfill({contentType:'application/javascript',body:`window.turnstile={render(el,o){window.__qaCaptcha=o;setTimeout(()=>o.callback('synthetic-captcha'),0);return 'qa';},reset(){setTimeout(()=>window.__qaCaptcha.callback('synthetic-captcha'),0)},remove(){}};`});
  if(url.pathname.startsWith('/auth/v1/')){
   const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*'};
   if(request.method()==='OPTIONS')return route.fulfill({headers,body:''});
   requests.push(url.pathname);
   if(url.pathname.endsWith('/signup')||url.pathname.endsWith('/otp'))return route.fulfill({headers,json:{user:null,session:null}});
   return route.fulfill({headers,status:400,json:{code:'invalid_credentials',message:'Synthetic invalid credentials'}});
  }
  return route.abort();
 });
 let status='pass',error;
 let navigationCancellations=0;
 try{
  await action(page,locale,requests);await noOverflow(page);
  const cancelled=failedScripts.filter(r=>r.duringNavigation&&r.error==='Load request cancelled').length;
  const unexpected=errors.filter(message=>{if(message==='TypeError: Importing a module script failed.'&&navigationCancellations<cancelled){navigationCancellations++;return false;}return true;});
  assert.deepEqual(unexpected,[]);
 }
 catch(e){status='fail';error=e.message.split('\n').slice(0,9).join('\n');}
 await page.screenshot({path:`${shots}/${device.replaceAll(/[^a-z0-9]/gi,'-')}-${locale}-${name}-${status}.png`,fullPage:status==='fail'}).catch(()=>{});
 const row={device,locale,name,status,...(error?{error}:{}),pageErrors:errors,failedScripts,navigationCancellations,syntheticAuthRequests:requests.length};results.push(row);console.log(JSON.stringify(row));
 await writeFile(`qa/header/iphone-audit-${phase}.json`,JSON.stringify({origin,engine:'WebKit '+browser.version(),physicalDevice:false,externalSubmissions:0,results},null,2)+'\n');
 await context.close();
}
const journeys={
 async home(page,l){
  await go(page,`/${l}/`);
  const track=page.locator('#reviewsTrack'),before=await track.evaluate(n=>n.scrollLeft);
  await page.locator('[data-review-next]').tap();await page.waitForFunction(previous=>document.getElementById('reviewsTrack').scrollLeft!==previous,before);
  await page.locator('[data-review-pause]').tap();
  await page.locator('[data-home-video]').first().tap();await page.locator('#cc-main .pm').waitFor({state:'visible'});
  await page.locator('#cc-main .pm__close-btn').tap();
  assert.equal(await page.locator('iframe[src*="vimeo.com"]').count(),0);
  await page.locator('.site-menu>summary').tap();await page.locator(`.site-menu a[href="/${l}/#reviews-section"]`).tap();
  await page.waitForFunction(()=>!document.querySelector('.site-menu').open);assert.equal(new URL(page.url()).hash,'#reviews-section');
 },
 async guideLegal(page,l){
  await go(page,`/${l}/sharm-secrets/`);await page.locator('#secrets-index-toggle').tap();
  const index=page.locator('#indexMenu');assert(await index.evaluate(n=>n.open));await index.locator('.index-link').nth(1).tap();assert.equal(await index.evaluate(n=>n.open),false);
  await page.locator('.adventure-card').first().tap();assert(await page.locator('#adventuresModal').evaluate(n=>n.open));await page.locator('.adventures-modal-close').tap();
  await go(page,`/${l}/legal/`);await page.locator('#legal-fab').tap();assert.equal(await page.locator('#indexMenu').getAttribute('inert'),null);
  const link=page.locator('#indexMenu .index-link').nth(1),hash=await link.getAttribute('href');await link.tap();assert.equal(new URL(page.url()).hash,hash);await page.waitForFunction(()=>document.getElementById('indexMenu').inert);
 },
 async navigation(page,l){
  await go(page,`/${l}/`);
  await page.locator('.site-language>summary').tap();await page.locator(`.site-language a[data-lang="${l==='it'?'en':'it'}"]`).tap();await page.waitForURL(`**/${l==='it'?'en':'it'}/`);
  await page.goBack({waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,`/${l}/`);
  await page.locator('.site-menu>summary').tap();await page.locator('.site-menu [data-theme-option="dark"]').tap();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.locator('.site-menu a[href$="/explore/"]').tap();await page.waitForURL(`**/${l}/explore/`);
  await page.locator('.site-currency>summary').tap();await page.locator('[data-currency="GBP"]').tap();
  assert.equal((await page.locator('[data-current-currency]').textContent()).trim(),'GBP');
  await page.reload({waitUntil:'networkidle'});assert.equal((await page.locator('[data-current-currency]').textContent()).trim(),'GBP');
 },
 async catalog(page,l){
  await go(page,`/${l}/explore/`);
  await page.locator('#price-sort').selectOption('price_asc');
  const prices=await page.locator('[data-explore-card]:visible').evaluateAll(ns=>ns.map(n=>Number(n.dataset.price)));assert.deepEqual(prices,[...prices].sort((a,b)=>a-b));
  const tour=page.locator('[data-explore-card][data-card-key^="trip:"]:visible').first();
  await tour.locator('[data-favorite]').tap();
  await page.locator('[data-filter="bundles"]').tap();
  const pack=page.locator('[data-explore-card][data-card-key^="package:"]:visible').first();await pack.locator('[data-favorite]').tap();
  await page.locator('[data-wishlist-link]').tap();await page.waitForURL(`**/${l}/wishlist/`);
  assert.equal(await page.locator('[data-wishlist-item]:visible').count(),2);assert.equal(await page.locator('[data-wishlist-section]:visible').count(),2);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-wishlist-item]:visible').count(),2);
  await page.locator('[data-wishlist-item]:visible [data-favorite]').first().tap();await page.waitForFunction(()=>[...document.querySelectorAll('[data-wishlist-item]')].filter(n=>n.getClientRects().length).length===1);
 },
 async booking(page,l){
  await go(page,`/${l}/explore/`);const href=await page.locator('[data-explore-card][data-card-key^="trip:"] [data-detail-link]').first().getAttribute('href');await go(page,href);
  await page.locator('[data-gallery-open]').first().tap();assert(await page.locator('[data-product-gallery-dialog]').evaluate(n=>n.open));await page.locator('[data-gallery-next]').tap();await page.keyboard.press('Escape');
  const total=Number(await page.locator('#live-total-price').getAttribute('data-price-eur'));await page.locator('[data-pax="adults"][data-change="1"]').tap();assert(Number(await page.locator('#live-total-price').getAttribute('data-price-eur'))>total);
  await page.locator('#btn-submit-booking').tap();assert.equal(await page.locator('#invoice-modal').isVisible(),false);
  await page.locator('#inp-name').fill('QA Example');await page.locator('#inp-date').fill(future);await page.locator('#nation-picker').tap();await page.locator('[data-nationality="Italian"]').tap();
  await page.locator('#btn-submit-booking').tap();await page.locator('#invoice-modal').waitFor({state:'visible'});
  await page.locator('#cancel-invoice').tap();assert.equal(await page.locator('#inp-name').inputValue(),'QA Example');
  await page.locator('#btn-submit-booking').tap();await page.locator('#confirm-invoice').tap();assert.equal(await page.evaluate(()=>window.__qaHandoffs.length),1);
 },
 async package(page,l){
  await go(page,`/${l}/explore/`);const href=await page.locator('[data-card-key="package:dolce_vita_family"] [data-detail-link]').first().getAttribute('href');await go(page,href);
  const card=page.locator('#included-trips-grid [data-trip-id]').first();await card.tap();const dialog=page.locator('#included-trip-modal');assert(await dialog.isVisible());
  const thumbs=dialog.locator('[data-gallery-src]');if(await thumbs.count()>1){await thumbs.nth(1).tap();assert.equal(await thumbs.nth(1).getAttribute('aria-pressed'),'true');}
  await dialog.locator('#included-trip-modal-close').tap();assert.equal(await dialog.isVisible(),false);
 },
 async inquiry(page,l){
  await go(page,`/${l}/egypt/cairo/`);const form=page.locator('[data-blog-inquiry]:visible').first();
  await form.locator('[name=name]').fill('QA Example');await country(form);await form.locator('[name=date]').fill(future);
  await form.locator('[data-step="adults"][data-change="1"]').tap();assert.equal(await form.locator('[name=adults]').inputValue(),'2');
  await form.locator('[name=message]').fill('A family visit to Egypt.');await form.locator('[type=submit]').tap();
  const review=page.locator('[data-inquiry-review]:visible').first();await review.waitFor();await review.locator('[data-inquiry-edit]').tap();assert.equal(await form.locator('[name=name]').inputValue(),'QA Example');
  await form.locator('[type=submit]').tap();await page.locator('[data-whatsapp-handoff]:visible').tap();assert.equal(await page.evaluate(()=>window.__qaHandoffs.length),1);
 },
 async planner(page,l){
  await go(page,`/${l}/tailor-your-trip/`);const form=page.locator('[data-trip-planner]');assert(await form.locator('[type=submit]').isDisabled());
  for(const [name,value] of Object.entries({name:'QA Example',email:'qa@example.com',phone:'+391234567890',arrival:future,departure:'2026-12-25',budget:'2000',details:'A family visit to Cairo and Luxor.'}))await form.locator(`[name=${name}]`).fill(value);
  await country(form);await form.locator('[name=places]').first().check();await form.locator('[type=submit]').tap();
  const review=page.locator('[data-planner-review]');await review.waitFor({state:'visible'});await review.locator('[data-planner-edit]').tap();assert.equal(await form.locator('[name=email]').inputValue(),'qa@example.com');
  await form.locator('[type=submit]').tap();await review.locator('[data-planner-handoff]').tap();assert.equal(await page.evaluate(()=>window.__qaHandoffs.length),1);
 },
 async login(page,l,calls){
  await go(page,`/${l}/login/`);await page.locator('[data-login-mode="signup"]').tap();
  await page.locator('#login-first-name').fill('QA');await page.locator('#login-last-name').fill('Example');await page.locator('#login-email').fill('qa@example.com');await page.locator('#login-password').fill('Test password 123!');await page.locator('#login-password-confirm').fill('different');
  assert(await page.locator('[data-login-submit]').isDisabled());await page.locator('#login-password-confirm').fill('Test password 123!');
  await page.locator('[data-password-target="login-password"]').tap();assert.equal(await page.locator('#login-password').getAttribute('type'),'text');await page.locator('[data-password-target="login-password"]').tap();
  await page.locator('[data-login-submit]').tap();await page.locator('[data-login-check-email]').waitFor({state:'visible'});assert(calls.some(p=>p.endsWith('/signup')));
  const code=page.locator('#login-code');await code.fill('123');assert(await page.locator('[data-login-code-form] [type=submit]').isDisabled());await code.fill('123456');assert.equal(await page.locator('[data-login-code-form] [type=submit]').isDisabled(),false);
  await page.locator('[data-login-code-form] [type=submit]').tap();await page.locator('#login-code-error').waitFor({state:'visible'});
 },
 async recovery(page,l,calls){
  await go(page,`/${l}/login/`);
  await page.locator('#login-email').fill('broken');await page.locator('#login-password').fill('Test password 123!');await page.locator('[data-login-submit]').tap();
  await page.waitForFunction(()=>document.querySelector('[data-login-status]').textContent.length>0);assert.equal(calls.length,0);
  await page.locator('#login-email').fill('qa@example.com');await page.locator('#login-password').fill('Test password 123!');
  await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/auth/v1/token')),page.locator('[data-login-submit]').tap()]);
  await page.waitForFunction(()=>document.querySelector('[data-login-form]').getAttribute('aria-busy')==='false');
  assert(calls.some(p=>p.endsWith('/token')));
  await page.locator('[data-login-recovery]').tap();assert.equal(await page.locator('#login-password').isVisible(),false);
  await page.locator('[data-login-submit]:enabled').waitFor();await page.locator('[data-login-submit]').tap();await page.locator('[data-login-check-email]').waitFor({state:'visible'});
  assert.equal(calls.filter(p=>p.endsWith('/otp')).length,1);
  await page.locator('[data-login-resend-options]>summary').tap();assert(await page.locator('[data-login-resend-code]').isDisabled());
  assert.equal(await page.locator('#login-code').getAttribute('autocomplete'),'one-time-code');
  assert.equal(await page.locator('[data-code-cell]').count(),6);
 },
};
try{
 for(const device of ['iPhone 13','iPad (gen 7)'])for(const locale of ['it','en'])for(const [name,action] of Object.entries(journeys))if((!selected.length&&name!=='inquiry')||selected.includes(name))await run(device,locale,name,action);
 if(!selected.length||selected.includes('layout'))for(const device of ['iPhone SE','iPhone 13','iPad (gen 7)'])for(const locale of ['it','en','es','pt','de'])await run(device,locale,'layout',async(page,l)=>{
  for(const route of ['', 'login/','tailor-your-trip/','explore/','wishlist/','legal/','blog/']){
   if(route==='blog/'&&!['it','en','de'].includes(l))continue;
   await go(page,`/${l}/${route}`);await noOverflow(page);
  }
 });
}finally{await browser.close();}
console.log(JSON.stringify({cases:results.length,passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status==='fail').length}));
if(results.some(r=>r.status==='fail'))process.exitCode=1;
