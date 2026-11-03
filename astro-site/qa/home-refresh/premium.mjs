import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const phase=process.argv[2]||'after',origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];await mkdir(`qa/home-refresh/screenshots/premium-${phase}`,{recursive:true});
const baseline=phase==='after'?JSON.parse(await readFile('qa/home-refresh/premium-before.json','utf8')):null;
try{
 for(const locale of ['it','en'])for(const width of [375,768,820,1024,1180,1440]){
  const page=await browser.newPage({viewport:{width,height:width===820?1180:900},hasTouch:width>=768&&width<=1180,reducedMotion:'reduce'});
  const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/vimeo\.com/.test(r.url()))external.push(r.url());});
  await page.goto(`${origin}/${locale}/`,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  await page.waitForFunction(()=>!document.documentElement.classList.contains('show--consent'));
  const content=await page.evaluate(()=>({
   hero:[...document.querySelectorAll('.hero-title,.hero-desc,.hero-btn')].map(n=>n.textContent.trim()),
   biography:document.querySelector('.wf-overlay-text').innerHTML,
   sections:[...document.querySelectorAll('.home-trust span,.wf-copy h2,.wf-copy>p:not(.home-eyebrow),.home-section-heading h2,.home-benefit h3,.home-benefit p,.home-steps h3,.home-steps p,.home-steps-cta,#trips-grid,.lux-entry-title,.lux-entry-cta,.home-video-caption,.home-video-privacy,.review-card')].map(n=>n.textContent.replace(/\s+/g,' ').trim()),
   links:[...document.querySelectorAll('.home-page main a')].map(n=>n.getAttribute('href')),
   images:[...document.querySelectorAll('main img')].map(n=>n.alt),
  }));
  const geometry=await page.evaluate(()=>{
   const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   return {overflow:document.documentElement.scrollWidth>innerWidth,hero:bounds('.hero-slider-box'),copy:bounds('.hero-content'),image:bounds('.hero-slider-bg'),title:bounds('.hero-title'),trustColumns:getComputedStyle(document.querySelector('.home-trust')).gridTemplateColumns.split(' ').length};
  });
  assert.equal(geometry.overflow,false);
  await page.screenshot({path:`qa/home-refresh/screenshots/premium-${phase}/${locale}-${width}-top.png`,animations:'disabled'});
  for(const section of ['who-fabio','trips-grid','reviews-section']){
   await page.locator(`#${section}`).scrollIntoViewIfNeeded();
   if(section==='who-fabio')await page.locator('.wf-figure').evaluate(n=>n.decode());
   await page.screenshot({path:`qa/home-refresh/screenshots/premium-${phase}/${locale}-${width}-${section}.png`,animations:'disabled'});
  }
  await page.locator('.home-videos').scrollIntoViewIfNeeded();
  for(const img of await page.locator('.home-video-media img').all())await img.evaluate(n=>{n.loading='eager';return n.decode();});
  await page.screenshot({path:`qa/home-refresh/screenshots/premium-${phase}/${locale}-${width}-videos.png`,animations:'disabled'});
  assert.equal(await page.locator('.home-video-media').evaluateAll(nodes=>nodes.every(n=>Math.abs(n.clientWidth-n.clientHeight)<2&&getComputedStyle(n.querySelector('img')).objectFit==='contain')),true);
  await page.locator('.wf-bio-btn').click();assert.equal(await page.locator('#fabio-biography').evaluate(n=>n.open),true);await page.keyboard.press('Escape');
  await page.locator('[data-review-next]').click();await page.waitForFunction(()=>document.querySelector('#reviewsTrack').scrollLeft>10);
  if(phase==='after'){
   assert.deepEqual(content,baseline.results.find(r=>r.locale===locale&&r.width===width).content);
   if(width>=1024)assert.ok(geometry.copy.right<=geometry.image.x+1,'Desktop copy must not overlap the image');
   if(width>=768&&width<1024)assert.ok(geometry.image.bottom<=geometry.copy.y+1,'Portrait iPad image must sit above copy');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  results.push({locale,width,content,geometry,biography:true,reviews:true,squareThumbnails:true,externalVideoRequests:external.length,errors});
  console.log(`${phase} ${locale} ${width}: content, layout, biography, reviews, video privacy PASS`);await page.close();
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||`qa/home-refresh/premium-${phase}.json`,JSON.stringify({origin,results},null,2)+'\n');
console.log(`${results.length} cases passed`);
