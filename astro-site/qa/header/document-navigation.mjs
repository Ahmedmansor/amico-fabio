// Actual link navigation and browser-native page swaps; no frame-recording claim.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
const output=new URL('./screenshots/document-navigation/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
try{
  for(const width of [1280,375]){
    const context=await browser.newContext({viewport:{width,height:850},reducedMotion:width===375?'reduce':'no-preference'});
    await context.addInitScript(()=>{
      localStorage.setItem('fabio_theme','dark');localStorage.setItem('fabio:wishlist:v1:trip:ras_mohammed_bus_half_day','1');
      addEventListener('pageswap',event=>sessionStorage.setItem('qa:outbound',JSON.stringify({native:!!event.viewTransition,visibility:document.visibilityState})));
      addEventListener('pagereveal',event=>{
        sessionStorage.setItem('qa:inbound',JSON.stringify({native:!!event.viewTransition,path:location.pathname}));
        if(!event.viewTransition)return;
        event.viewTransition.ready.then(()=>{
          const header=document.getElementById('global-header');
          const record={path:location.pathname,native:true,marker:!!document.getElementById('site-header-ready'),name:getComputedStyle(header).viewTransitionName,count:header.querySelector('[data-wishlist-count]').textContent,
            visible:[...header.querySelectorAll('.wishlist-link>svg,.auth-trigger-avatar,.site-language summary,.site-currency summary,.site-menu summary')].filter(n=>n.getBoundingClientRect().width>0).every(n=>getComputedStyle(n).visibility==='visible')};
          const records=JSON.parse(sessionStorage.getItem('qa:native-swaps')||'[]');records.push(record);sessionStorage.setItem('qa:native-swaps',JSON.stringify(records));
        }).catch(()=>sessionStorage.setItem('qa:swap-error','Native transition skipped'));
      });
    });
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){external.push(url.hostname);return route.abort();}return route.continue();});
    await page.goto(origin+'/en/');
    const c=page.locator('#cookie-consent-config'),label=await c.evaluate(n=>JSON.parse(n.textContent).messages.reject);
    const reject=page.getByRole('button',{name:label,exact:true}).first();if(await reject.isVisible())await reject.click();
    await page.evaluate(()=>document.fonts.ready);
    for(const path of ['/en/explore/','/en/blog/','/en/egypt/','/en/wishlist/']){
      const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('qa:native-swaps')||'[]').length);
      const link=path==='/en/wishlist/'?page.locator('[data-wishlist-link]'):width<1200?page.locator(`.site-menu a[href="${path}"]`):page.locator(`.site-desktop-nav a[href="${path}"]`);
      if(width<1200&&path!=='/en/wishlist/')await page.locator('.site-menu>summary').click();
      await link.click();await page.waitForURL(origin+path);await page.waitForLoadState('load');
      await page.waitForFunction(before=>JSON.parse(sessionStorage.getItem('qa:native-swaps')||'[]').length>before,before,{timeout:5000}).catch(async error=>{
        console.log(JSON.stringify({browser:browser.version(),width,path,diagnostic:await page.evaluate(()=>({visibility:document.visibilityState,inbound:sessionStorage.getItem('qa:inbound'),outbound:sessionStorage.getItem('qa:outbound'),revealSupported:'onpagereveal' in window,headerName:getComputedStyle(document.getElementById('global-header')).viewTransitionName,error:sessionStorage.getItem('qa:swap-error'),records:sessionStorage.getItem('qa:native-swaps')}))}));throw error;
      });
      await page.locator('#global-header').screenshot({path:fileURLToPath(new URL(`${width}-${path.replaceAll('/','_')}.png`,output))});
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('qa:swap-error')),null);
    }
    const swaps=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('qa:native-swaps')||'[]'));
    assert.equal(swaps.length,4);assert(swaps.every(s=>s.native&&s.marker&&s.name==='fabio-header'&&s.count==='1'&&s.visible));
    assert.deepEqual(errors,[]);
    // Poster images use the same existing gallery import paths.
    for(const slug of ['il_grande_blu','sharm_confidential']){
      await page.goto(`${origin}/en/packages/${slug}/`);const image=page.locator('.product-photo img').first();await image.evaluate(n=>n.decode());
      assert(await image.evaluate(n=>n.naturalWidth>0));await page.locator('.product-gallery').screenshot({path:fileURLToPath(new URL(`${width}-${slug}.png`,output))});
    }
    results.push({width,reducedMotion:width===375,nativeSwaps:swaps,postersLoaded:true,errors});await context.close();
  }
  await writeFile(new URL('./document-navigation-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
  console.log('Document navigation: 8 real link transitions passed across home/explore/blog/Egypt/wishlist at mobile/desktop; complete visible header and count at native transition readiness; 2 new posters loaded.');
}finally{await browser.close();}
