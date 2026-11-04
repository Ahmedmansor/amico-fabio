// Focused campaign QA. No WhatsApp request, lead, login or external form is sent.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const dist=path.join(root,'dist');
const output=new URL('./screenshots/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const original=await fs.readFile(path.join(root,'landing-pages/blu.html'),'utf8');
const sheets=[];
for(const name of await fs.readdir(path.join(dist,'_astro')))if(name.endsWith('.css')){
 const css=await fs.readFile(path.join(dist,'_astro',name),'utf8');
 if(css.includes('.blu-toolbar'))sheets.push(css);
}
assert.equal(sheets.length,1,'Build the campaign before browser QA.');
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reference(locale){
 let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]*fonts.googleapis.com[^>]*>/g,'');
 if(locale==='en'){
  const block=original.slice(original.indexOf('            en: {')).split('\n            }')[0];
  for(const line of block.split('\n')){
   const match=line.match(/^\s*(\w+):\s*("(?:[^"\\]|\\.)*")/);
   if(match){const value=JSON.parse(match[2]);const pattern=new RegExp(`(<([a-z0-9]+)\\b[^>]*data-i18n="${match[1]}"[^>]*>)[\\s\\S]*?(<\\/\\2>)`,'gi');html=html.replace(pattern,(_,open,_tag,close)=>open+escape(value)+close);}
  }
  html=html.replace('lang="it"','lang="en"');
 }
 // Dependency-only normalization for deterministic offline visual capture.
 return html.replace('</head>',`<style>${sheets[0]}\n@font-face{font-family:Fredoka;src:url('/_qa/fredoka.woff2');font-weight:300 700}@font-face{font-family:'Plus Jakarta Sans';src:url('/_qa/jakarta.woff2');font-weight:200 800}</style></head>`);
}
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.startsWith('/_qa/reference/')){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(reference(pathname.includes('/en/')?'en':'it'));return;}
  const fonts={'/_qa/fredoka.woff2':'fredoka/files/fredoka-latin-wght-normal.woff2','/_qa/jakarta.woff2':'plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'};
  const file=fonts[pathname]?path.join(root,'node_modules/@fontsource-variable',fonts[pathname]):path.resolve(dist,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!fonts[pathname]&&!file.startsWith(dist+path.sep)){res.writeHead(403).end();return;}
  const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
  res.setHeader('Content-Type',type);res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href):await import('playwright');
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
const results=[];
const comparisons=[];
const filename=name=>fileURLToPath(new URL(name,output));
async function context(options={}){
 const ctx=await browser.newContext(options);
 await ctx.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({status:200,body:'External requests blocked by campaign QA.'}));
 return ctx;
}
async function rejectCookies(page,locale){
 await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
 await page.locator('html.show--consent').waitFor({state:'hidden'});
}
async function inspect(page,locale,width){
 assert.equal(await page.locator('[data-experience-card]').count(),6);
 assert.equal(await page.locator('[data-program-preview]').count(),4);
 assert.equal(await page.locator('form,input[type="email"],input[type="tel"]').count(),0);
 const mainText=await page.locator('#blu-programs').innerText();
 assert.doesNotMatch(mainText,/[€$£]|\bEUR\b|\b(?:prezzo|prices?|sconto)\b/i);
 assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://fabioegypt.com/${locale}/blu/`);
 assert.deepEqual(await page.locator('link[hreflang]').evaluateAll(links=>links.map(link=>link.hreflang).sort()),['en','it']);
 const html=await page.content();
 assert.doesNotMatch(html,/201000000000|cdn\.tailwindcss\.com|fonts\.googleapis\.com|onclick=/);
 assert.doesNotMatch(html,/adult_price|child_price|adultPrice|"prices"|"offers"\s*:/);
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.querySelectorAll('main img')].map(img=>({loaded:img.complete&&img.naturalWidth>0,width:img.width,height:img.height})),ids:[...document.querySelectorAll('[id]')].map(node=>node.id)}));
 assert.equal(state.overflow,false,`Overflow at ${locale}:${width}`);
 assert.equal(new Set(state.ids).size,state.ids.length,'Duplicate SVG or DOM IDs');
 for(const image of state.images){assert.equal(image.loaded,true);assert.ok(image.width>0&&image.height>0);}
 const links=await page.locator('a[href^="https://wa.me/"]').evaluateAll(nodes=>nodes.map(a=>a.href));
 for(const href of links){const url=new URL(href);assert.equal(url.pathname,'/201063239261');assert.match(url.searchParams.get('text'),/SEGRETO-BIKINI/);}
 assert.equal(await page.locator('[data-mobile-bottle]').isVisible(),width<768);
 if(width<768){
  const placement=await page.locator('[data-mobile-bottle]').evaluate(a=>({position:getComputedStyle(a).position,bottom:innerHeight-a.getBoundingClientRect().bottom}));
  assert.equal(placement.position,'fixed');assert.ok(placement.bottom>=0&&placement.bottom<=40);
 }
 return {locale,width,overflow:state.overflow,images:state.images.length,experienceCards:6,programs:4,prices:false,forms:false,whatsappLinks:links.length};
}
try{
 for(const locale of ['it','en'])for(const [name,viewport]of Object.entries({mobile:{width:390,height:844},tablet:{width:820,height:1180},desktop:{width:1440,height:900}})){
  const ctx=await context({viewport,reducedMotion:'reduce'});const page=await ctx.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${origin}/${locale}/blu/`);await rejectCookies(page,locale);
  await page.locator('main img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  await page.evaluate(()=>document.fonts.ready);
  const result=await inspect(page,locale,viewport.width);
  await page.screenshot({path:filename(`astro-${locale}-${name}.png`),fullPage:true});
  if(name==='desktop')await page.screenshot({path:filename(`astro-${locale}-hero.png`)});
  await page.locator('[data-pose="2"]').click();assert.equal(await page.locator('#fabio-pose-2').getAttribute('class'),'');
  const artFits=await page.locator('.blu-card-art').evaluateAll(items=>items.every(art=>{const box=art.getBoundingClientRect(),svg=art.querySelector('svg').getBoundingClientRect();return svg.top>=box.top&&svg.bottom<=box.bottom&&svg.left>=box.left&&svg.right<=box.right;}));
  assert.equal(artFits,true,'Character illustrations must fit inside their frames.');
  await page.locator('#blu-portal-range').focus();await page.keyboard.press('ArrowRight');assert.match(await page.locator('[data-cartoon-overlay]').getAttribute('style'),/63%/);
  // The popup is intercepted locally; WhatsApp is never reached.
  const popup=page.waitForEvent('popup');await page.locator('[data-experience="patrick"]').click();const wa=await popup;await wa.close();
  assert.match(decodeURIComponent(await page.locator('[data-mobile-bottle]').getAttribute('href')),/Patrick/);
  assert.ok((await page.locator('[data-selection-status]').innerText()).includes('Patrick'));
  assert.equal(await page.evaluate(()=>Array.from(window.dataLayer||[]).filter(item=>item[0]==='event'&&item[1]==='generate_lead').length),0,'No analytics event without consent.');
  assert.deepEqual(errors,[]);result.errors=errors;
  if(name!=='tablet'){
   const baseline=await ctx.newPage();await baseline.goto(`${origin}/_qa/reference/${locale}/`);await baseline.evaluate(()=>document.fonts.ready);
   await baseline.screenshot({path:filename(`reference-${locale}-${name}.png`),fullPage:true});
   result.reference={cards:await baseline.locator('.gsap-card').count(),heading:await baseline.locator('h1').innerText(),dependencyNormalization:'Local Tailwind/font equivalents; broken source scripts disabled; archive unchanged.'};
   const textLines=async tab=>[...new Set((await tab.locator('body').innerText()).split('\n').map(line=>line.replace(/\s+/g,' ').trim()).filter(Boolean))];
   const sourceText=await textLines(baseline),campaignText=await textLines(page);
   comparisons.push({locale,viewport,sourceOnly:sourceText.filter(line=>!campaignText.includes(line)),campaignOnly:campaignText.filter(line=>!sourceText.includes(line)),sourceLinks:await baseline.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),campaignLinks:await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href')))});
  }
  results.push(result);await ctx.close();
 }
 for(const mode of ['weak-memory','weak-cpu','save-data','reduced-motion','lite-preference','strong-mobile','unknown-hints']){
  const mobile=mode==='strong-mobile';
  const ctx=await context({viewport:mobile?{width:390,height:844}:{width:1440,height:900},reducedMotion:mode==='reduced-motion'?'reduce':'no-preference'});
  await ctx.addInitScript(mode=>{
   Object.defineProperty(navigator,'deviceMemory',{configurable:true,get:()=>mode==='unknown-hints'?undefined:mode==='weak-memory'?2:8});
   Object.defineProperty(navigator,'hardwareConcurrency',{configurable:true,get:()=>mode==='unknown-hints'?undefined:mode==='weak-cpu'?2:8});
   if(mode==='save-data')Object.defineProperty(navigator,'connection',{configurable:true,get:()=>({saveData:true,addEventListener(){},removeEventListener(){}})});
   if(mode==='lite-preference')localStorage.setItem('fabio:blu:motion','lite');
  },mode);
  const page=await ctx.newPage();const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.goto(`${origin}/en/blu/`);await rejectCookies(page,'en');
  const isStrong=mode==='strong-mobile'||mode==='unknown-hints';
  if(isStrong){
   await page.locator('body[data-effects="full"]').waitFor({timeout:10000});
   await page.waitForTimeout(2000);
   // Simulate sustained jank after actual effects initialization.
   await page.evaluate(async()=>{for(let i=0;i<4;i++){const end=performance.now()+140;while(performance.now()<end){}await new Promise(resolve=>setTimeout(resolve,60));}});
   await page.locator('body[data-effects="lite"]').waitFor({timeout:10000});
   assert.equal(await page.locator('.blu-bubble').count(),0);
  }else{
   await page.waitForTimeout(700);
   assert.equal(await page.locator('body').getAttribute('data-effects'),'lite');
   assert.ok(!requests.some(url=>/\/effects\./.test(url)),'Lite must not download effects/GSAP chunk');
  }
  results.push({mode,syntheticHardware:true,enhancementLoaded:isStrong,automaticJankDowngrade:isStrong,liteSkipsGsap:!isStrong});await ctx.close();
 }
 const consentContext=await context({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await consentContext.grantPermissions(['clipboard-read','clipboard-write']);
 const consentPage=await consentContext.newPage();await consentPage.goto(`${origin}/en/blu/`);
 await consentPage.getByRole('button',{name:'Accept all',exact:true}).click();
 await consentPage.locator('html.show--consent').waitFor({state:'hidden'});
 await consentPage.locator('[data-copy]').click();
 assert.equal(await consentPage.evaluate(()=>navigator.clipboard.readText()),'SEGRETO-BIKINI');
 assert.equal(await consentPage.locator('[data-copy-status]').innerText(),'Passphrase copied!');
 const relatedPopup=consentPage.waitForEvent('popup');await consentPage.locator('[data-program]').first().click();await(await relatedPopup).close();
 assert.match(decodeURIComponent(await consentPage.locator('[data-mobile-bottle]').getAttribute('href')),/Sharm Confidential/);
 const lead=await consentPage.evaluate(()=>Array.from(window.dataLayer||[]).find(item=>item[0]==='event'&&item[1]==='generate_lead'));
 assert.deepEqual(lead?.[2],{event_category:'LandingCampaign',campaign_id:'red-sea-cartoon',channel:'whatsapp',site_language:'en'});
 await consentPage.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,get:()=>({writeText:async()=>{throw new Error('Denied by QA');}})}));
 await consentPage.locator('[data-copy]').click();assert.match(await consentPage.locator('[data-copy-status]').innerText(),/Couldn't copy/);
 results.push({mode:'clipboard-and-consented-analytics',clipboardSuccessAndFailure:true,relatedSelectionUpdatesMobileBottle:true,leadContainsOnlyCampaignChannelLocale:true});await consentContext.close();
 const storageContext=await context({viewport:{width:320,height:700},reducedMotion:'reduce'});
 await storageContext.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
 const storagePage=await storageContext.newPage();const storageErrors=[];storagePage.on('pageerror',error=>storageErrors.push(error.message));await storagePage.goto(`${origin}/it/blu/`);await rejectCookies(storagePage,'it');
 assert.equal(await storagePage.locator('[data-pose-controls]').isVisible(),true);assert.equal(await storagePage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(storageErrors,[]);
 results.push({mode:'320px-storage-denied',overflow:false,controlsRemainUsable:true,errors:storageErrors});await storageContext.close();
 const noJS=await context({viewport:{width:390,height:844},javaScriptEnabled:false});const page=await noJS.newPage();await page.goto(`${origin}/it/blu/`);
 assert.equal(await page.locator('[data-experience-card]').count(),6);assert.equal(await page.locator('[data-mobile-bottle]').isVisible(),true);
 assert.equal(await page.locator('[data-motion-control]').isVisible(),false);assert.equal(await page.locator('form').count(),0);
 results.push({mode:'no-javascript',allContentAndDirectWhatsApp:true});await noJS.close();
 await fs.writeFile(new URL('./browser-results.json',import.meta.url),JSON.stringify({origin,results,externalSubmission:false},null,2)+'\n');
 await fs.writeFile(new URL('./content-comparison.json',import.meta.url),JSON.stringify({reference:'landing-pages/blu.html',note:'Intentional differences are explained in README.md. Source-only text includes source demo controls and unverified claims; no source runtime behavior is claimed.',comparisons},null,2)+'\n');
 console.log(`Blu browser QA passed: ${results.length} scenarios; IT/EN mobile/tablet/desktop, no prices/forms, direct WhatsApp, duplicate-ID checks, Lite chunk exclusion and automatic jank downgrade. No external message sent.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
