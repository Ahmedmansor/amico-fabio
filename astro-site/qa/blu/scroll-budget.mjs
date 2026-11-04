import {chromium} from 'file:///C:/Users/ahmedMansour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4387')?route.continue():route.abort());
 await page.addInitScript(()=>{
  const original=window.requestAnimationFrame.bind(window);
  let synthetic=0;
  window.requestAnimationFrame=callback=>original(now=>{
   if(window.__slowScroll){synthetic+=50;callback(synthetic);}else{synthetic=now;callback(now);}
  });
 });
 await page.goto('http://127.0.0.1:4387/en/blu/');
 await page.getByRole('button',{name:'Reject optional',exact:true}).click();
 assert.equal(await page.locator('#blu-effects').inputValue(),'auto');
 await page.waitForSelector('body[data-effects="full"]');
 await page.waitForTimeout(3000);
 assert.equal(await page.locator('img.blu-medusa').count(),3);
 assert.ok(await page.evaluate(()=>document.getAnimations().length>=29));
 await page.evaluate(()=>{window.__slowScroll=true;window.scrollBy(0,40);});
 await page.waitForSelector('body[data-effects="lite"]',{timeout:10000});
 assert.equal(await page.locator('.blu-bubble').count(),0);
 assert.equal(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.effect?.target?.closest?.('.blu-underwater')).length),0);
 console.log('Fresh visitor Auto enabled native ocean effects; synthetic slow scrolling triggered Reduced and cancelled native ocean animations.');
}finally{await browser.close()}
