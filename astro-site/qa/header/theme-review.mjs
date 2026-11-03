// Browser review of the changed UI only. Never submit an Auth/booking form.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4333';
const output=new URL('./screenshots/theme/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[],authOnly=process.argv.includes('--auth-only');
async function screenshot(page,name){await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),fullPage:name.includes('signup')});}
async function dismiss(page){const config=page.locator('#cookie-consent-config');if(await config.count()){const label=await config.evaluate(n=>JSON.parse(n.textContent).messages.reject);const b=page.getByRole('button',{name:label,exact:true});await b.first().waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await b.first().isVisible())await b.first().click();}}
try{
 for(const locale of ['it','en']) for(const width of authOnly?[320,375,768,1280]:[375,768,1280]) for(const route of authOnly?['login/']:['','explore/','login/']){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(`${origin}/${locale}/${route}`,{waitUntil:'domcontentloaded'});await dismiss(page);await page.evaluate(()=>document.fonts.ready);
  const name=`${locale}-${route.replaceAll('/','')||'home'}-${width}`;
  await screenshot(page,name);
  let extra={};
  if(route==='login/'){
   const signup=page.locator('[data-login-mode="signup"]');await signup.click();await page.locator('#login-first-name').waitFor({state:'visible',timeout:10000});
   extra={signupVisible:await page.locator('#login-first-name').isVisible()&&await page.locator('#login-last-name').isVisible()&&await page.locator('#login-password-confirm').isVisible(),googleIcon:await page.locator('[data-login-oauth="google"] svg').count(),passwordVisible:await page.locator('#login-password').isVisible()};
   await screenshot(page,name+'-signup');
  }
  if(route==='explore/'){
   const cards=page.locator('[data-explore-card]:visible');
   extra={cards:await cards.count(),prices:await cards.evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.cardKey,price:n.dataset.price,label:n.querySelector('.price-new')?.textContent}))),detailLinks:await cards.locator('[data-detail-link]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))};
   await page.locator('#price-sort').selectOption('price_asc');
   const prices=await cards.evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.price)));
   extra.sortWorks=prices.every((price,index)=>index===0||price>=prices[index-1]);
   const bundles=page.locator('[data-filter="bundles"]');
   if(await bundles.isVisible()){await bundles.click();extra.packagesFilterWorks=await cards.evaluateAll(nodes=>nodes.every(n=>n.dataset.cardKey.startsWith('package:')));}
   await page.locator('[data-filter="all"]').click();
   const favorite=cards.first().locator('[data-favorite]');await favorite.waitFor({state:'visible'});await favorite.click();
   await page.waitForFunction(()=>document.querySelector('[data-wishlist-count]')?.textContent==='1');
   extra.guestFavoriteCountWorks=(await favorite.getAttribute('aria-pressed'))==='true';await favorite.click();
  }
  if(route===''){await page.locator('#trips-grid').scrollIntoViewIfNeeded();await screenshot(page,name+'-destinations');await page.locator('.wf-bio-btn').click();extra.biographyWorks=await page.locator('.wf-overlay-bio').evaluate(n=>n.open);await page.keyboard.press('Escape');extra.biographyFocusRestored=await page.locator('.wf-bio-btn').evaluate(n=>document.activeElement===n);}
  results.push({path:`/${locale}/${route}`,width,status:response.status(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors,...extra});await page.close();
 }
 const page=await browser.newPage({viewport:{width:320,height:850}});await page.goto(origin+'/en/login/',{waitUntil:'domcontentloaded'});await dismiss(page);
 await page.locator('.site-language summary').click();await screenshot(page,'flags-320');
 const flags=await page.locator('.site-language .site-flag').evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),loaded:n.complete&&n.naturalWidth>0})));
 await page.keyboard.press('Escape');const escapeClosed=!(await page.locator('.site-language').getAttribute('open')!==null);
 await page.locator('.site-menu summary').click();await screenshot(page,'menu-320');
 results.push({path:'/en/login/',width:320,flags,escapeClosed,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.close();
 for(const width of authOnly?[]:[375,1280]) for(const route of ['it/blog/cosa-mangiare-egitto/','en/egypt/giza-pyramids/','it/packages/','en/wishlist/','it/legal/','offerta-sharm/','welcome/']){
  // Packages have slug routes; select a real generated link from Explore.
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  let target=route;
  if(route==='it/packages/'){await page.goto(origin+'/it/explore/',{waitUntil:'domcontentloaded'});target=await page.locator('a[href*="/it/packages/"]').first().getAttribute('href');}
  const response=await page.goto(new URL(target,origin+'/').href,{waitUntil:'domcontentloaded'});await dismiss(page);
  await screenshot(page,route.replaceAll('/','-')+width);
  results.push({path:target,width,status:response.status(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.close();
 }
}finally{await browser.close();}
if(authOnly){
 await writeFile(new URL('./theme-review-auth.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');
 const previous=JSON.parse(await readFile(new URL('./theme-review.json',import.meta.url),'utf8'));
 previous.results=previous.results.map(old=>results.findLast(row=>row.path===old.path&&row.width===old.width)??old);
 previous.note='Auth rows updated by focused review after compact CAPTCHA correction; other rows retain the unchanged final-build review.';
 await writeFile(new URL('./theme-review.json',import.meta.url),JSON.stringify(previous,null,2)+'\n');
}else await writeFile(new URL('./theme-review.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');
console.log(JSON.stringify({cases:results.length,failures:results.filter(r=>r.status&&r.status!==200||r.overflow||r.errors?.length||['signupVisible','escapeClosed','sortWorks','packagesFilterWorks','guestFavoriteCountWorks','biographyWorks','biographyFocusRestored'].some(key=>r[key]===false))},null,2));
