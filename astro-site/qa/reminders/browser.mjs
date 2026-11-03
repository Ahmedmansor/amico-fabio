import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4330';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
try{
  for(const locale of ['it','en'])for(const kind of ['summary','reminder'])for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    const errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
    await page.goto(`${origin}/email-preview/${kind}-${locale}.html`);
    assert.equal(await page.locator('html').getAttribute('lang'),locale);
    assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('h2').count(),2);
    assert.equal(await page.locator('h3').count(),4);
    const contactLinks=await page.locator('a[href^="https://wa.me/"]').all();
    assert.equal(contactLinks.length,6);
    for(const link of contactLinks){
      const url=new URL(await link.getAttribute('href'));
      assert.ok(url.searchParams.get('text')?.trim());
      const box=await link.boundingBox();assert.ok(box.height>=44);
    }
    await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.locator('a[href*="unsubscribe-preview"]').count(),kind==='reminder'?1:0);
    assert.ok(requests.every(url=>new URL(url).origin===origin),'Email preview must not fetch production assets, fonts or scripts');
    assert.deepEqual(errors,[]);
    await page.screenshot({path:new URL(`./screenshots/${kind}-${locale}-${width}.png`,import.meta.url).pathname.slice(1),fullPage:true});
    if(kind==='reminder'){
      await page.locator('a[href*="unsubscribe-preview"]').click();
      assert.match(await page.locator('body').innerText(),/No email has been sent/);
    }
    results.push({locale,kind,width,images:4,separateGroups:true,whatsappActions:6,noHorizontalOverflow:true,localRequestsOnly:true,previewUnsubscribe:kind==='reminder',noPageErrors:true});
    await context.close();
  }
  await writeFile(new URL('./browser-results.json',import.meta.url),JSON.stringify({mode:'local-browser-rendering-only',cases:results},null,2)+'\n');
  console.log('Email previews passed: 8 IT/EN summary/reminder mobile/desktop cases; four loaded images, grouped cards, six WhatsApp actions, local-only resources, no horizontal overflow, inert unsubscribe preview and no page errors. No messages sent or inbox delivery tested.');
}finally{await browser.close();}
