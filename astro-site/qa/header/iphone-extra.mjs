import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {webkit,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4337',phase=process.env.QA_PHASE||'before';
const browser=await webkit.launch(),results=[];
const output=`qa/header/screenshots/extra-${phase}`;await mkdir(output,{recursive:true});
async function dismiss(p){const c=p.locator('#cookie-consent-config');if(await c.count()){const name=await c.evaluate(n=>JSON.parse(n.textContent).messages.reject);const b=p.getByRole('button',{name,exact:true}).first();await b.waitFor({state:'visible',timeout:2500}).catch(()=>{});if(await b.isVisible()){await b.tap();await p.waitForFunction(()=>!document.documentElement.classList.contains('show--consent'));}}}
async function tapPulsing(page){
 await page.locator('#submitBtn').evaluate(n=>n.scrollIntoView({behavior:'instant',block:'center'}));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const box=await page.locator('#submitBtn').boundingBox();
 await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
}
for(const device of ['iPhone SE','iPhone 13','iPad (gen 7)'])for(const kind of (process.env.QA_KINDS||'invoice,offer,welcome').split(',')){
 const context=await browser.newContext({...devices[device]}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(7000);
 let posts=0,dialogs=0;await page.addInitScript(()=>{window.__handoffs=[];window.open=url=>{window.__handoffs.push(String(url));return null;};});
 page.on('dialog',async d=>{dialogs++;await d.dismiss();});
 await context.route('**/*',r=>{
  const req=r.request(),url=new URL(req.url());if(url.origin===origin)return r.continue();
  if(url.hostname==='script.google.com'&&req.method()==='POST'){posts++;return r.fulfill({headers:{'access-control-allow-origin':'*'},json:{result:'error'}});}
  return r.abort();
 });
 let status='pass',error,details;
 try{
  if(kind==='invoice'){
   await page.goto(origin+'/en/explore/',{waitUntil:'networkidle'});await dismiss(page);
   const href=await page.locator('[data-card-key="trip:ras_mohammed_white_island_vip"] [data-detail-link]').first().getAttribute('href');await page.goto(origin+href,{waitUntil:'networkidle'});
   await page.locator('#inp-name').fill('QA Example');await page.locator('#inp-date').fill('2026-12-20');await page.locator('#nation-picker').tap();await page.locator('[data-nationality="Italian"]').tap();
   for(const input of await page.locator('#trip-booking-form input[type=checkbox]').all())await input.check();
   await page.locator('#btn-submit-booking').tap();await page.locator('#invoice-modal').waitFor({state:'visible'});
   details=await page.locator('#invoice-modal>div').evaluate(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight,scrollable:getComputedStyle(n).overflowY};});
   assert(details.top>=0&&details.bottom<=details.viewport,'Invoice exceeds viewport; heading or confirmation inaccessible');
   await page.locator('#cancel-invoice').tap();
  }else if(kind==='offer'){
   await page.goto(origin+'/offerta-sharm/',{waitUntil:'networkidle'});await dismiss(page);
   await page.locator('#osh-hamburger-btn').tap();await page.locator('#osh-menu-close').tap();
   await page.locator('#whatsapp-booking-btn').tap();assert.equal(await page.evaluate(()=>window.__handoffs.length),0);
   await page.locator('#lsh-name').fill('QA Example');await page.locator('#lsh-date').fill('2026-12-20');await page.locator('#lsh-people').fill('3');await page.locator('#whatsapp-booking-btn').tap();assert.equal(await page.evaluate(()=>window.__handoffs.length),1);
  }else{
   await page.goto(origin+'/welcome/',{waitUntil:'networkidle'});await dismiss(page);
   await page.evaluate(()=>{window.__welcomeEvents=[];for(const type of ['pointerdown','pointerup','mousedown','mouseup','click','invalid','submit'])document.addEventListener(type,e=>window.__welcomeEvents.push({type,target:e.target.id||e.target.tagName}),true);});
   // Tap the observed center after scrolling: the legacy CTA never becomes
   // geometrically stable because of its continuous pulse animation.
   await tapPulsing(page);assert.equal(posts,0);
   await page.locator('#name').fill('QA Example');await page.locator('#whatsapp').fill('+391234567890');
   await Promise.all([page.waitForEvent('dialog'),tapPulsing(page)]);
   await page.waitForFunction(()=>!document.getElementById('submitBtn').disabled);assert.equal(posts,1);assert.equal(dialogs,1);
   assert.equal(await page.locator('#name').inputValue(),'QA Example');
   details=await page.locator('#name').evaluate(n=>{
    const c=document.createElement('canvas');c.width=c.height=1;const context=c.getContext('2d');
    const rgb=color=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].slice(0,3);};
    return {text:rgb(getComputedStyle(n).color),background:rgb(getComputedStyle(n).backgroundColor)};
   });
   const luminance=color=>color.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   const a=luminance(details.text),b=luminance(details.background);details.contrast=Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2));assert(details.contrast>=4.5,'Welcome input contrast below 4.5');
   const preferences=page.locator('[data-cc="show-preferencesModal"]');
   await preferences.evaluate(n=>n.scrollIntoView({behavior:'instant',block:'center'}));
   const hit=await preferences.evaluate(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,220);});
   assert(!hit?.includes('inset-0'),`Decorative overlay blocks cookie preferences: ${hit}`);
   await preferences.tap();await page.locator('#cc-main .pm').waitFor({state:'visible'});
   await page.locator('#cc-main .pm__close-btn').tap();await page.waitForFunction(()=>!document.documentElement.classList.contains('show--preferences'));
   await Promise.all([page.waitForEvent('dialog'),tapPulsing(page)]);await page.waitForFunction(()=>!document.getElementById('submitBtn').disabled);assert.equal(posts,2);details.preferencesReopenedAndClosed=true;
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');assert.deepEqual(errors,[]);
 }catch(e){status='fail';error=e.message.split('\n').slice(0,7).join('\n');if(kind==='welcome')details=await page.evaluate(()=>({events:window.__welcomeEvents,valid:document.getElementById('contactForm').checkValidity(),nameFilled:!!document.getElementById('name').value,phoneFilled:!!document.getElementById('whatsapp').value,htmlClass:document.documentElement.className,cookie:[...document.querySelectorAll('#cc-main,#cc-main .cm,#cc-main .cm__desc')].map(n=>({class:n.className,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,opacity:getComputedStyle(n).opacity,pointer:getComputedStyle(n).pointerEvents,rect:n.getBoundingClientRect().toJSON()})),viewport:{w:innerWidth,h:innerHeight,scale:visualViewport.scale,offset:visualViewport.offsetTop}}));}
 await page.screenshot({path:`${output}/${device.replaceAll(/[^a-z0-9]/gi,'-')}-${kind}.png`}).catch(()=>{});
 const row={device,kind,status,...(details?{details}:{}),...(error?{error}:{}),pageErrors:errors,syntheticLeadPosts:posts,externalLeadPosts:0};results.push(row);console.log(JSON.stringify(row));await context.close();
}
await browser.close();await writeFile(`qa/header/iphone-extra-${phase}.json`,JSON.stringify({origin,results},null,2)+'\n');if(results.some(r=>r.status==='fail'))process.exitCode=1;
