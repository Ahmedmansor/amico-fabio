import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const[modulePath,executablePath,mode]=process.argv.slice(2),{chromium}=await import(pathToFileURL(modulePath).href);
const headersOnly=mode==='--headers-only';
const origin='http://127.0.0.1:4327',browser=await chromium.launch({headless:true,executablePath}),results=headersOnly?JSON.parse(await readFile(new URL('../../qa/trip-planner/BROWSER.json',import.meta.url),'utf8')).results:[],headers=[];
const output=new URL('../../qa/trip-planner/screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const date=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
async function rejectCookies(page){const label=await page.locator('#cookie-consent-config').evaluate(node=>JSON.parse(node.textContent).messages.reject);const button=page.getByRole('button',{name:label,exact:true});if(await button.count())await button.first().click();}
try{
 if(!headersOnly){
 for(const lang of ['en','it'])for(const width of [375,768,1280]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce',timezoneId:'Africa/Cairo'}),page=await context.newPage(),errors=[];let intercepted=0;
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('https://wa.me/**',async route=>{intercepted++;await route.fulfill({contentType:'text/html',body:'<title>Intercepted local test</title>'});});
  assert.equal((await page.goto(`${origin}/${lang}/tailor-your-trip/`,{waitUntil:'networkidle'})).status(),200);await rejectCookies(page);await page.evaluate(()=>document.fonts.ready);
  const form=page.locator('[data-trip-planner]'),submit=form.locator('[type=submit]');assert.equal(await submit.isDisabled(),true);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('[name=flight],[name=airport],[name=destination]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${lang} ${width}`);
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(node=>node.id));assert.equal(ids.length,new Set(ids).size);
  await page.screenshot({path:fileURLToPath(new URL(`planner-${lang}-${width}.png`,output)),fullPage:true});
  const interaction=(lang==='en'&&width===375)||(lang==='it'&&width===1280);
  if(interaction){
   for(const[name,value]of Object.entries({name:'Design review guest',email:'not-an-email',phone:'+39 320 123 4567',arrival:date(45),departure:date(53),budget:'1800,50',startCity:'Cairo',finishCity:'Aswan',details:'Cairo → Luxor → Aswan. A & B, 50%, #sunset\nPlease include a Nile journey.'}))await form.locator(`[name="${name}"]`).fill(value);
   await form.locator('[name=nationality]').selectOption('Italian');await form.locator('[name=places][value=cairo]').check();await form.locator('[name=places][value=luxor]').check();
   await form.locator('[name=email]').blur();assert.equal(await submit.isDisabled(),true);assert.equal(await form.locator('[name=email]').getAttribute('aria-invalid'),'true');
   await form.locator('[name=email]').fill('design@example.com');assert.equal(await submit.isEnabled(),true);await submit.click();
   const review=page.locator('[data-planner-review]');assert.equal(await review.isVisible(),true);assert.equal(await form.isVisible(),false);
   const text=await review.locator('[data-planner-summary]').textContent();assert.ok(text.includes('Cairo → Luxor → Aswan'));assert.ok(text.includes('1800.5 EUR'));
   const href=await review.locator('[data-planner-fallback]').getAttribute('href');assert.ok(!href.includes('?'));
   assert.equal(await page.locator('a[href*="design@example.com"],a[href*="text="]').count(),0);
   await review.locator('[data-planner-edit]').click();assert.equal(await form.locator('[name=startCity]').inputValue(),'Cairo');await submit.click();
   const popupPromise=context.waitForEvent('page');await review.locator('[data-planner-handoff]').click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
   const url=new URL(popup.url()),message=url.searchParams.get('text');assert.equal(url.hostname,'wa.me');assert.ok(message.includes('design@example.com'));assert.ok(message.includes('Cairo → Luxor → Aswan'));assert.ok(message.includes('A & B, 50%, #sunset'));await popup.close();assert.equal(intercepted,1);
   await page.reload({waitUntil:'networkidle'});assert.equal(await form.locator('[name=name]').inputValue(),'');assert.equal(await submit.isDisabled(),true);
  }
  assert.deepEqual(errors,[]);results.push({lang,width,interactionVerified:interaction,whatsappIntercepted:intercepted,screenshot:`qa/trip-planner/screenshots/planner-${lang}-${width}.png`});await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
 await page.goto(origin+'/en/blog/common-tourist-traps-egypt/',{waitUntil:'networkidle'});await rejectCookies(page);
 assert.equal(await page.locator('[data-editorial-toc] a').first().getAttribute('target'),null);
 const [guide]=await Promise.all([page.waitForEvent('popup'),page.locator('article a[href="/en/egypt/giza-pyramids/"]').click()]);await guide.waitForLoadState('domcontentloaded');assert.ok(guide.url().endsWith('/en/egypt/giza-pyramids/'));assert.ok(page.url().endsWith('/en/blog/common-tourist-traps-egypt/'));
 const [planner]=await Promise.all([page.waitForEvent('popup'),page.locator('article .blog-cta a').click()]);await planner.waitForLoadState('domcontentloaded');assert.ok(planner.url().endsWith('/en/tailor-your-trip/'));await context.close();
 }
 for(const lang of ['en','it'])for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});
  const link=page.locator('#global-header [data-planner-nav]');assert.equal(await link.getAttribute('href'),`/${lang}/tailor-your-trip/`);const box=await link.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width,`${lang} ${width} planner header clipped`);headers.push({lang,width,href:await link.getAttribute('href'),visible:true});await page.close();
 }
 console.log('PASS: six IT/EN planner layouts; required/invalid gating, edit/review, encoded WhatsApp interception and reload reset.');
 console.log('PASS: content/CTA links open new tabs, TOC stays local, and main headers expose the planner at mobile/desktop widths.');
}finally{await browser.close();await writeFile(new URL('../../qa/trip-planner/BROWSER.json',import.meta.url),JSON.stringify({origin,results,headers,headerOnlyFollowup:headersOnly},null,2)+'\n');}
