import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341',results=[];
await mkdir('qa/home-refresh/screenshots/mobile-motion',{recursive:true});
try{
 for(const [locale,width] of [['en',375],['it',430],['en',1280]]){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<768}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  if(width===375){const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  await page.addInitScript(()=>{window.motionTasks=[];new PerformanceObserver(list=>window.motionTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});});
  await page.goto(`${origin}/${locale}/`,{waitUntil:'load'});await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#home-hero-track').dataset.autoRunning==='true');
  const hero=page.locator('#home-hero-track');
  if(width<768){await page.waitForFunction(()=>document.querySelector('#home-hero-track').scrollLeft>100,{},{timeout:10000});}
  else await page.waitForFunction(()=>document.querySelectorAll('.hero-slide')[1]?.classList.contains('active-slide'),{},{timeout:10000});
  console.log(`${locale} ${width}: real hero autoplay PASS`);
  if(width===375){
   await page.waitForFunction(()=>document.querySelector('#home-hero-track').scrollLeft>document.querySelector('#home-hero-track').clientWidth*1.7,{},{timeout:10000});
   await page.waitForTimeout(650);const pause=page.locator('[data-auto-pause-for="home-hero-track"]');await pause.click();const position=await hero.evaluate(n=>n.scrollLeft);
   await page.waitForTimeout(5500);assert.ok(Math.abs((await hero.evaluate(n=>n.scrollLeft))-position)<2);
   await pause.click();await page.waitForFunction(()=>document.querySelector('#home-hero-track').scrollLeft<10,{},{timeout:10000});
   console.log('375: sequential slides, wrap and explicit pause/resume PASS');
  }
  await page.locator('#reviewsTrack').scrollIntoViewIfNeeded();await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelector('#reviewsTrack').scrollLeft>40,{},{timeout:11000});
  const offscreen=await hero.evaluate(n=>n.scrollLeft);assert.equal(await hero.getAttribute('data-auto-running'),'false');
  console.log(`${locale} ${width}: real Facebook review autoplay PASS`);
  if(width<768){
   const videos=page.locator('#home-video-track');await videos.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('#home-video-track').scrollLeft>40,{},{timeout:12000});
   assert.equal(await hero.evaluate(n=>n.scrollLeft),offscreen);
   assert.equal(requests.some(url=>url.includes('vimeo.com')),false);
   await page.screenshot({path:`qa/home-refresh/screenshots/mobile-motion/${locale}-${width}-videos.png`});
   console.log(`${locale} ${width}: real video-card autoplay, offscreen stop and Vimeo privacy PASS`);
   if(width===375){
    await page.waitForTimeout(650);await page.locator('.home-video-dialog').evaluate(n=>n.showModal());
    await page.waitForFunction(()=>document.querySelector('#home-video-track').dataset.autoRunning==='false');
    const left=await videos.evaluate(n=>n.scrollLeft);await page.waitForTimeout(7500);assert.equal(await videos.evaluate(n=>n.scrollLeft),left);
    await page.keyboard.press('Escape');await page.locator('.home-video-toolbar button').waitFor({state:'hidden'});
    await videos.dispatchEvent('pointerdown',{pointerType:'touch'});await page.waitForTimeout(7500);assert.equal(await videos.evaluate(n=>n.scrollLeft),left);
    await videos.dispatchEvent('pointerup',{pointerType:'touch'});await page.waitForFunction(left=>document.querySelector('#home-video-track').scrollLeft>left+40,left,{timeout:12000});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#home-video-track').dataset.autoRunning==='false');
    console.log('375: modal/touch pause, idle resume and live reduced-motion cleanup PASS');
   }
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  results.push({locale,width,autoplay:true,offscreenStop:true,vimeoRequests:requests.filter(url=>url.includes('vimeo.com')).length,errors,longTasksMs:await page.evaluate(()=>window.motionTasks)});await page.close();
 }
 for(const route of ['explore/sharm/','tours/ras_mohammed_white_island_vip/','packages/dolce_vita_family/']){
  const page=await browser.newPage({viewport:{width:375,height:900},hasTouch:true});
  await page.addInitScript(()=>{window.revealCount=0;const animate=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.hasAttribute('data-desktop-reveal'))window.revealCount++;return animate.apply(this,args);};});
  await page.goto(`${origin}/en/${route}`,{waitUntil:'load'});await page.getByRole('button',{name:'Reject optional',exact:true}).click();await page.locator('[data-desktop-reveal]').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.revealCount>0);results.push({route,mobileReveal:true});await page.close();
 }
 const reduced=await browser.newPage({viewport:{width:375,height:900},reducedMotion:'reduce'}),requests=[];
 reduced.on('request',r=>requests.push(r.url()));await reduced.goto(`${origin}/en/`,{waitUntil:'load'});
 assert.equal(requests.some(url=>url.includes('home-motion')||url.includes('desktop-reveal')),false);
 assert.equal(await reduced.locator('.hero-motion-controls').isVisible(),false);results.push({coldReducedMotion:true,noMotionChunks:true});await reduced.close();
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||'qa/home-refresh/mobile-motion.json',JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify({cases:results.length,pass:true}));
