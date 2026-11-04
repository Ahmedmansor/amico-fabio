// Local static QA only. External traffic is blocked; no account or lead submissions.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(fileURLToPath(new URL('../../dist/',import.meta.url)));
const screenshots=new URL('./screenshots/',import.meta.url);
await fs.mkdir(screenshots,{recursive:true});
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
const results=[];
async function context(options={}){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',locale:'de-DE',...options});
 await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({status:204,body:''}));
 return context;
}
async function rejectCookies(page){
 const button=page.getByRole('button',{name:'Rifiuta facoltativi',exact:true});
 await button.waitFor();await button.click();
 await page.locator('html.show--consent').waitFor({state:'hidden'});
}
try{
 for(const width of [390,1440]){
  const ctx=await context({viewport:{width,height:900}}),page=await ctx.newPage();
  await page.goto(origin+'/');await rejectCookies(page);
  assert.equal(new URL(page.url()).pathname,'/');
  assert.equal(await page.locator('html').getAttribute('lang'),'it');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://fabioegypt.com/it/');
  const offer=page.locator('[data-language-offer="de"]');await offer.waitFor({state:'visible'});
  assert.equal(await offer.locator('[data-language-question]').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:fileURLToPath(new URL(`root-de-${width}.png`,screenshots))});
  await offer.locator('[data-language-accept]').click();await page.waitForURL(origin+'/de/');
  assert.equal(await page.evaluate(()=>localStorage.getItem('fabio_lang')),'de');
  // A fresh tab shares the explicit choice, without a forced redirect or repeated question.
  const returning=await ctx.newPage();await returning.goto(origin+'/');
  const back=returning.locator('[data-language-offer="de"]');await back.waitFor({state:'visible'});
  assert.equal(new URL(returning.url()).pathname,'/');
  assert.equal(await back.locator('[data-language-question]').isVisible(),false);
  assert.equal(await back.locator('[data-language-dismiss]').isVisible(),false);
  assert.equal(await back.locator('a').innerText(),'Zur deutschen Version');
  await returning.goto(origin+'/it/');
  assert.equal(await returning.locator('[data-language-entry]').count(),0);
  assert.equal(await returning.evaluate(()=>localStorage.getItem('fabio_lang')),'de');
  await returning.screenshot({path:fileURLToPath(new URL(`italian-${width}.png`,screenshots))});
  results.push({scenario:'first visit, explicit acceptance, new-tab return and direct Italian link',width,passed:true});
  await ctx.close();
 }
 {
  const ctx=await context(),page=await ctx.newPage();await page.goto(origin+'/');await rejectCookies(page);
  await page.locator('[data-language-offer="de"] [data-language-dismiss]').click();
  await page.reload();assert.equal(await page.locator('.language-offer:visible').count(),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('fabio_lang')),'it');
  // Explicit menu changes still supersede the remembered dismissal.
  await page.locator('.site-language summary').click();await page.locator('.site-language [data-lang="en"]').click();
  await page.waitForURL(origin+'/en/');assert.equal(await page.evaluate(()=>localStorage.getItem('fabio_lang')),'en');
  await page.goto(origin+'/');await page.locator('[data-language-offer="en"]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-language-offer="en"] [data-language-question]').isVisible(),false);
  results.push({scenario:'dismissal persists; explicit header choice supersedes it',passed:true});await ctx.close();
 }
 for(const locale of ['it-IT','ar-EG']){
  const ctx=await context({locale}),page=await ctx.newPage();await page.goto(origin+'/');await rejectCookies(page);
  assert.equal(await page.locator('.language-offer:visible').count(),0);
  results.push({scenario:'no unsupported or redundant suggestion',locale,passed:true});await ctx.close();
 }
 {
  const ctx=await context();await ctx.addInitScript(()=>{Object.defineProperty(navigator,'languages',{get:()=>['ar-EG','pt-BR']});});
  const page=await ctx.newPage();await page.goto(origin+'/');await rejectCookies(page);
  await page.locator('[data-language-offer="pt"]').waitFor({state:'visible'});
  results.push({scenario:'first supported language in browser preference order',passed:true});await ctx.close();
 }
 {
  const ctx=await context();await ctx.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage unavailable');}});});
  const page=await ctx.newPage();await page.goto(origin+'/');await rejectCookies(page);
  await page.locator('[data-language-offer="de"] [data-language-accept]').click();await page.waitForURL(origin+'/de/');
  results.push({scenario:'denied storage does not prevent native language navigation',passed:true});await ctx.close();
 }
 {
  const ctx=await context({javaScriptEnabled:false}),page=await ctx.newPage();await page.goto(origin+'/');
  assert.equal(new URL(page.url()).pathname,'/');assert.ok((await page.locator('h1').innerText()).trim());
  assert.equal(await page.locator('.language-offer:visible').count(),0);
  results.push({scenario:'no JavaScript: complete Italian homepage without redirect',passed:true});await ctx.close();
 }
 const index=await fs.readFile(path.join(root,'index.html'),'utf8');
 const italian=await fs.readFile(path.join(root,'it/index.html'),'utf8');
 assert.doesNotMatch(index,/http-equiv="refresh"|Redirecting from/);
 const canonical='https://fabioegypt.com/it/';assert.ok(index.includes(`rel="canonical" href="${canonical}"`));
 // Main content stays identical; only the root gets the language suggestion.
 const home=html=>{
  const start=html.indexOf('<section id="hero-slider-section"');
  const end=html.indexOf('</section>',html.indexOf('<section id="reviews-section"'));
  assert.ok(start>=0&&end>start);return html.slice(start,end+10);
 };
 assert.equal(home(index),home(italian));
 const icon=index.match(/<link\b[^>]*rel="icon"[^>]*href="([^"]+)"/)?.[1];assert.ok(icon);
 const metadata=await sharp(path.join(root,icon)).metadata();
 assert.equal(metadata.width,96);assert.equal(metadata.height,96);assert.equal(metadata.hasAlpha,true);
 const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');assert.ok(!sitemap.includes('<loc>https://fabioegypt.com/</loc>'));
 results.push({scenario:'identical Italian main HTML; no redirect; transparent 96px favicon; canonical sitemap',passed:true});
 await fs.writeFile(new URL('./results.json',import.meta.url),JSON.stringify({results,realExternalSubmissions:0},null,2)+'\n');
 console.log(`Language entry QA: ${results.length} scenarios passed; screenshots local; no external submissions.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
