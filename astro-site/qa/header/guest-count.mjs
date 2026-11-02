// Guest-only first-paint/navigation QA. No login, real account or external writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
const output=new URL('./screenshots/guest-count/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
try{
  const context=await browser.newContext({viewport:{width:375,height:850},reducedMotion:'reduce'});
  await context.addInitScript(()=>{
    if(!localStorage.getItem('qa:guest-seeded')){
      localStorage.setItem('fabio:wishlist:v1:trip:ras_mohammed_bus_half_day','1');
      localStorage.setItem('fabio:wishlist:v1:trip:ras_mohammed_white_island_vip','1');
      localStorage.setItem('fabio:wishlist:v1:package:dolce_vita_family','1');
      localStorage.setItem('qa:guest-seeded','1');
    }
    window.__qaFrames={observed:0,blank:0};
    const sample=()=>{
      const badge=document.querySelector('[data-wishlist-count]');
      if(badge){const style=getComputedStyle(badge);window.__qaFrames.observed++;if(badge.hidden||!badge.textContent||style.visibility==='hidden'||style.display==='none')window.__qaFrames.blank++;}
      requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  const page=await context.newPage(),errors=[],requests=[];let gate,release;
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==origin){if(url.hostname.endsWith('.supabase.co')&&/^\/(auth|rest)\/v1\//.test(url.pathname))requests.push(url.pathname);return route.abort();}
    if(request.resourceType()==='script'&&url.pathname.startsWith('/_astro/'))await gate;
    return route.continue();
  });
  async function navigate(path,expected){
    gate=new Promise(resolve=>{release=resolve;});
    await page.goto(origin+path,{waitUntil:'commit'});
    const badge=page.locator('[data-wishlist-count]');await badge.waitFor({state:'visible'});
    assert.equal(await badge.textContent(),String(expected),'Count must be correct before module downloads');
    await page.evaluate(()=>document.getElementById('global-header').setAttribute('data-session-pending','true'));
    assert(await badge.isVisible(),'Auth pending must not mask local favorites');
    assert.equal(await page.locator('.wishlist-loading').isVisible(),false);
    const before=await badge.boundingBox();
    await page.locator('#global-header').screenshot({path:fileURLToPath(new URL(path.replaceAll('/','_')+'-before.png',output))});
    release();await page.waitForLoadState('load');
    await page.waitForFunction(()=>window.__qaFrames.observed>=5);
    assert.equal(await badge.textContent(),String(expected));assert.deepEqual(await badge.boundingBox(),before);
    const frames=await page.evaluate(()=>window.__qaFrames);assert.equal(frames.blank,0);
    assert.deepEqual(requests,[]);results.push({path,expected,countBeforeModules:true,authIndependent:true,stableGeometry:true,frames,backendRequests:0});
  }
  await navigate('/en/',3);await navigate('/en/explore/',3);await navigate('/en/tours/super_safari_5_senses/',3);
  await page.locator('.product-title-row [data-favorite]').click();await page.waitForFunction(()=>document.querySelector('[data-wishlist-count]')?.textContent==='4');
  await navigate('/en/wishlist/',4);
  const other=await context.newPage();await other.goto(origin+'/en/');
  await other.evaluate(()=>localStorage.removeItem('fabio:wishlist:v1:trip:ras_mohammed_bus_half_day'));
  await page.waitForFunction(()=>document.querySelector('[data-wishlist-count]')?.textContent==='3');
  assert(await page.locator('[data-wishlist-count]').isVisible());assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  results.push({addUpdatesImmediately:true,crossTabRemoval:true,backendRequests:0});
  await context.close();
  await writeFile(new URL('./guest-count-results.json',import.meta.url),JSON.stringify({results,errors},null,2)+'\n');
  console.log('Guest wishlist count: 5 focused cases passed; correct before module loading on four pages, zero blank sampled frames, no Auth/rest requests, add and cross-tab updates.');
}finally{await browser.close();}
