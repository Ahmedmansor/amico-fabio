// Focused SVG/Sandy/planner revision checks. No form or external message is submitted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../../dist/',import.meta.url));
const screenshots=new URL('./screenshots/',import.meta.url);
await fs.mkdir(screenshots,{recursive:true});
let server;
let origin=process.env.QA_ORIGIN;
if(!origin){
 server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
   if(!file.startsWith(root)){res.writeHead(403).end();return;}
   const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
   res.setHeader('Content-Type',type);res.end(await fs.readFile(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
const results=[];
try{
 for(const locale of ['it','en'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({status:200,body:'QA: no external submission.'}));
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  assert.equal((await page.goto(`${origin}/${locale}/blu/`)).status(),200);
  await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  await page.locator('html.show--consent').waitFor({state:'hidden'});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('[data-experience-card]').count(),6);
  assert.equal(await page.locator('[data-program-preview]').count(),4);
  assert.equal(await page.locator('[data-blu-planner]').count(),1);
  for(const href of await page.locator('[data-blu-planner]').evaluateAll(links=>links.map(a=>a.getAttribute('href'))))assert.equal(href,`/${locale}/tailor-your-trip/`);
  assert.equal(await page.locator('[data-programs-jump]').getAttribute('href'),'#blu-adventure');
  const programs=page.locator('[data-program-preview]');
  const programHrefs=await page.locator('[data-program]').evaluateAll(links=>links.map(a=>a.href));
  for(const program of await programs.all()){
   assert.ok((await program.locator('.blu-program-duration').innerText()).trim());
   assert.ok((await program.locator('.blu-program-copy>p').innerText()).trim());
   await program.locator('summary').press('Enter');
   assert.equal(await program.locator('details').getAttribute('open'),'');
   assert.ok(await program.locator('ol li').count()>=5);
   for(const description of await program.locator('li p').allTextContents())assert.ok(description.trim());
   await program.locator('summary').press('Enter');
  }
  const programPopup=page.waitForEvent('popup');await page.locator('[data-program]').first().click();await(await programPopup).close();
  const programTitle=await programs.first().locator('h3').innerText();
  const bottleMessage=new URL(await page.locator('[data-mobile-bottle]').getAttribute('href')).searchParams.get('text');
  assert.ok(bottleMessage.includes(programTitle));assert.ok(bottleMessage.includes(locale==='it'?'Il programma che mi interessa':"The program I'm interested in"));
  assert.deepEqual(await page.locator('[data-program]').evaluateAll(links=>links.map(a=>a.href)),programHrefs,'Selecting one program must not overwrite the others.');
  assert.match(await page.locator('.blu-card-sandy h3').innerText(),/Sandy/);
  assert.doesNotMatch(await page.locator('#blu-programs').innerText(),/[€$£]|\bEUR\b|\b(?:prezzo|prices?)\b/i);
  assert.equal(await page.locator('main form').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('main img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  for(const character of ['squid','treasure','sandy']){
   const art=page.locator(`.blu-card-${character} .blu-card-art`);
   assert.equal(await art.evaluate(el=>{const box=el.getBoundingClientRect(),media=(el.querySelector('svg')||el.querySelector('img')).getBoundingClientRect();return media.top>=box.top&&media.bottom<=box.bottom&&media.left>=box.left&&media.right<=box.right;}),true);
   if(locale==='en'&&width===1440)await art.screenshot({path:fileURLToPath(new URL(`revision-${character}.png`,screenshots))});
  }
  await page.locator('main img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  await page.screenshot({path:fileURLToPath(new URL(`revision-${locale}-${width}.png`,screenshots)),fullPage:true});
  if(locale==='en'&&width===1440)await page.locator('[data-program-preview]').first().screenshot({path:fileURLToPath(new URL('program-preview.png',screenshots))});
  const popup=page.waitForEvent('popup');await page.locator('[data-experience="sandy"]').click();await(await popup).close();
  assert.match(decodeURIComponent(await page.locator('[data-mobile-bottle]').getAttribute('href')),/Sandy/);
  await page.locator('[data-blu-planner]').first().click();await page.locator('[data-trip-planner]').waitFor();
  assert.equal(new URL(page.url()).pathname,`/${locale}/tailor-your-trip/`);assert.equal(await page.locator('html').getAttribute('lang'),locale);
  assert.deepEqual(errors,[]);
  results.push({locale,width,experienceCards:6,programs:4,programStopsVerified:true,programInquiryUpdatesBottle:true,otherProgramLinksPreserved:true,plannerLinks:1,plannerDestinationVerified:true,sandyUpdatesBottle:true,artContained:true,noPricesOrForms:true,overflow:false,errors});
  await context.close();
 }
 await fs.writeFile(new URL('./revision-results.json',import.meta.url),JSON.stringify({results,externalSubmission:false},null,2)+'\n');
 console.log('Blu revision: 4 IT/EN mobile/desktop cases passed; six character cards, four programs, one working planner link, Sandy WhatsApp draft and contained artwork. No external submission.');
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
