import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
async function dismiss(page){const c=page.locator('#cookie-consent-config');if(await c.count()){const label=await c.evaluate(n=>JSON.parse(n.textContent).messages.reject);const b=page.getByRole('button',{name:label,exact:true}).first();await b.waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await b.isVisible())await b.click();}}
async function choose(page,width,theme){
  const selector=width<1200?'.site-menu':'.site-theme';
  if(!(await page.locator(selector).getAttribute('open')!==null))await page.locator(`${selector}>summary`).click();
  await page.locator(`${selector} [data-theme-option="${theme}"]`).click();
  await page.keyboard.press('Escape');
}
async function contrast(page,selector){
  const values=await page.locator(selector).first().evaluate(node=>{
    const fg=getComputedStyle(node).color;
    let bg='rgba(0, 0, 0, 0)',current=node;
    while(current){const color=getComputedStyle(current).backgroundColor;if(color!=='rgba(0, 0, 0, 0)'){bg=color;break;}current=current.parentElement;}
    return {fg,bg};
  });
  const lum=value=>{const nums=value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return nums[0]*.2126+nums[1]*.7152+nums[2]*.0722;};
  const a=lum(values.fg),b=lum(values.bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  assert(ratio>=4.5,`${selector} contrast ${ratio}: ${JSON.stringify(values)}`);return Number(ratio.toFixed(2));
}
try{
  // Focused mobile-header/theme matrix, without repeating unrelated catalog tests.
  for(const locale of ['en'])for(const width of [320,375,1280]){
    const context=await browser.newContext({viewport:{width,height:950},colorScheme:'light',reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${origin}/${locale}/explore/`);await dismiss(page);assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    const content=await page.locator('main').innerText();
    assert(await page.locator('.site-brand>span').isVisible(),'Fabio Egypt wordmark must stay visible');
    await choose(page,width,'dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('main').innerText(),content);
    await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.emulateMedia({colorScheme:'light'});assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    const ratios={card:await contrast(page,'.catalog-card-title'),description:await contrast(page,'.catalog-card-desc'),header:await contrast(page,'.site-brand')};
    await page.screenshot({path:fileURLToPath(new URL(`${locale}-explore-dark-${width}.png`,output))});
    await choose(page,width,'system');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await choose(page,width,'light');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.screenshot({path:fileURLToPath(new URL(`${locale}-explore-light-${width}.png`,output))});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
    assert.deepEqual(errors,[]);results.push({locale,width,selection:true,reload:true,systemChanges:true,explicitOverride:true,contentPreserved:true,contrast:ratios,overflow,errors});await context.close();
  }
  for(const locale of ['it'])for(const width of [375]){
    const context=await browser.newContext({viewport:{width,height:950},colorScheme:'light',reducedMotion:'reduce'});
    const page=await context.newPage();
    for(const route of ['', 'login/','tours/ras_mohammed_bus_half_day/']){
      const response=await page.goto(`${origin}/${locale}/${route}`);assert.equal(response.status(),200,route);await dismiss(page);
      const host=page.locator(route===''?'.home-evidence':'main');
      const light=await host.innerText();
      for(const theme of ['light','dark']){
        await choose(page,width,theme);assert.equal(await host.innerText(),light);
        assert(await page.locator('.site-brand>span').isVisible());
        const headerBackground=await page.locator('.site-header').evaluate(n=>getComputedStyle(n).backgroundColor);
        assert.equal(headerBackground,theme==='light'?'rgb(255, 255, 255)':'rgb(25, 25, 25)');
        await page.locator('.site-header').screenshot({path:fileURLToPath(new URL(`${locale}-${route.replaceAll('/','')||'home'}-${theme}-${width}-header.png`,output))});
        if(route==='')await host.screenshot({path:fileURLToPath(new URL(`${locale}-benefits-${theme}-${width}.png`,output))});
        await page.screenshot({path:fileURLToPath(new URL(`${locale}-${route.replaceAll('/','')||'home'}-${theme}-${width}.png`,output)),fullPage:route==='login/'});
      }
      results.push({locale,width,route,lightDarkContentParity:true});
    }
    // Campaigns retain their own appearance even when a dark preference is saved.
    for(const route of ['welcome/','offerta-sharm/']){
      await page.goto(origin+'/'+route);assert.equal(await page.locator('html').getAttribute('data-theme'),null);
      results.push({route,campaignIsolated:true});
    }
    await context.close();
  }
  const context=await browser.newContext({colorScheme:'light'}),a=await context.newPage(),b=await context.newPage();
  await a.goto(origin+'/en/explore/');await b.goto(origin+'/it/explore/');await a.evaluate(()=>localStorage.setItem('fabio_theme','dark'));await b.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await b.reload();assert.equal(await b.locator('html').getAttribute('data-theme'),'dark');
  await a.evaluate(()=>localStorage.setItem('fabio_theme','invalid'));await b.waitForFunction(()=>document.documentElement.dataset.theme==='light');await context.close();
  const denied=await browser.newContext({viewport:{width:375,height:900},colorScheme:'dark'});await denied.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage denied');}});});
  const page=await denied.newPage();await page.goto(origin+'/en/explore/');await dismiss(page);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await choose(page,375,'light');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');await denied.close();
  const nojs=await browser.newContext({javaScriptEnabled:false,colorScheme:'dark'});const fallback=await nojs.newPage();await fallback.goto(origin+'/en/explore/');assert(await fallback.locator('.catalog-card').count()>0);assert.equal(await fallback.locator('html').getAttribute('data-theme'),null);await nojs.close();
  results.push({crossTab:true,invalidPreference:true,storageDenied:true,noJavaScriptContent:true});
  await writeFile(new URL('./results.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');
  console.log(`Theme/header browser QA: ${results.length} focused cases passed; visible wordmark, white light/neutral dark, system preference, persistence, contrast, content parity and campaign isolation.`);
}finally{await browser.close();}
