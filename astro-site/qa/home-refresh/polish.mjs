import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341',results=[];
await mkdir('qa/home-refresh/screenshots/polish',{recursive:true});
try{
 for(const locale of ['it','en'])for(const width of [375,768,1280]){
  console.log(JSON.stringify({reviewing:locale,width}));
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===375}),errors=[],requests=[];
  await page.addInitScript(()=>{window.qaReveals=0;const native=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.hasAttribute('data-desktop-reveal'))window.qaReveals++;return native.apply(this,args);};});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(`${origin}/${locale}/`,{waitUntil:'load'});
  const reject=page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true});await reject.waitFor();await reject.click();
  const poster=page.locator('.wf-container');await poster.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.wf-container').dataset.posterVisible==='true');
  if(width===375){
   const scene=page.locator('.wf-scene');
   await page.waitForFunction(()=>document.querySelector('.wf-scene').getAnimations().some(animation=>Number(animation.currentTime)>250&&animation.playState==='running'));
   assert.notEqual(await scene.evaluate(n=>getComputedStyle(n).transform),'none');
   assert.equal(await scene.evaluate(n=>getComputedStyle(n).animationName),'fabio-mobile-drift');
   const r=await poster.boundingBox();await poster.dispatchEvent('pointerdown',{pointerType:'touch',clientX:r.x+r.width*.8,clientY:r.y+r.height*.4});
   await page.waitForFunction(()=>document.querySelector('.wf-container').dataset.posterTouch==='true');await poster.dispatchEvent('pointercancel');
  }else{
   const r=await poster.boundingBox();await poster.hover({position:{x:r.width*.8,y:r.height*.4}});await page.waitForFunction(()=>document.querySelector('.wf-container').style.getPropertyValue('--wf-ry')!=='',{},{timeout:3000});
  }
  await page.locator('.wf-bio-btn').click();const dialog=page.locator('#fabio-biography');assert.equal(await dialog.evaluate(n=>n.open),true);
  await dialog.evaluate(n=>Promise.all(n.getAnimations().map(animation=>animation.finished)));
  const source=JSON.parse(await readFile(new URL(`../../src/features/home/data/content/${locale}.json`,import.meta.url),'utf8'));
  assert.equal(await dialog.locator('.wf-overlay-text').evaluate((n,html)=>{const expected=document.createElement('div');expected.innerHTML=html;return n.textContent.replace(/\s+/g,' ').trim()===expected.textContent.replace(/\s+/g,' ').trim();},source.global.who_is_fabio_content),true);
  assert.equal(await dialog.evaluate(n=>n.contains(document.activeElement)),true);
  const closeTop=(await dialog.locator('.wf-overlay-close').boundingBox()).y;
  await page.screenshot({path:`qa/home-refresh/screenshots/polish/${locale}-${width}-biography.png`});
  await dialog.locator('.wf-bio-scroll').evaluate(n=>n.scrollTop=n.scrollHeight);
  assert.equal((await dialog.locator('.wf-overlay-close').boundingBox()).y,closeTop);
  for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.equal(await dialog.evaluate(n=>n.contains(document.activeElement)),true);}
  await page.keyboard.press('Escape');assert.equal(await dialog.evaluate(n=>n.open),false);
  assert.equal(await page.locator('.wf-bio-btn').evaluate(n=>n===document.activeElement),true);
  await page.locator('.home-benefits').scrollIntoViewIfNeeded();await page.locator('.home-videos').scrollIntoViewIfNeeded();
  const media=page.locator('.home-video-media');assert.equal(await media.count(),6);
  assert.ok(await media.evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return Math.abs(r.width-r.height)<1&&getComputedStyle(n.querySelector('img')).objectFit==='contain';})));
  await media.first().locator('img').evaluate(img=>img.decode());
  await page.screenshot({path:`qa/home-refresh/screenshots/polish/${locale}-${width}-videos.png`});
  const revealCount=await page.evaluate(()=>window.qaReveals);assert.equal(revealCount>0,width>=768);
  assert.equal(requests.some(url=>url.includes('desktop-reveal')),width>=768);
  assert.equal(requests.some(url=>url.includes('vimeo.com')),false);
  await page.waitForFunction(()=>document.querySelector('.wf-container').dataset.posterVisible==='false');
  assert.equal(await page.locator('.wf-scene').evaluate(n=>getComputedStyle(n).animationName),'none');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  results.push({locale,width,squareFullThumbnails:true,posterMotion:true,biographyTextPreserved:true,modalFocusAndScroll:true,desktopReveals:revealCount,mobileHeavyChunkAbsent:width===375,errors});await page.close();
 }
 const reduced=await browser.newPage({viewport:{width:768,height:900},reducedMotion:'reduce'}),requests=[];
 reduced.on('request',r=>requests.push(r.url()));await reduced.goto(`${origin}/en/`,{waitUntil:'load'});
 await reduced.locator('.wf-container').scrollIntoViewIfNeeded();
 assert.equal(await reduced.locator('.wf-scene').evaluate(n=>getComputedStyle(n).transform),'none');
 assert.equal(requests.some(url=>url.includes('desktop-reveal')||url.includes('home-motion')),false);
 results.push({reducedMotion:true,heavyChunksAbsent:true});await reduced.close();
}finally{await browser.close();}
await writeFile(new URL(process.env.QA_REPORT||'./polish.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify({cases:results.length,pass:true}));
