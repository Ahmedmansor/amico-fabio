import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {webkit,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4347';
const browser=await webkit.launch(),results=[];
try{
 for(const locale of ['it','en','es','pt','de']){
  const context=await browser.newContext({...devices['iPhone 13']}),page=await context.newPage();
  await context.route('**/*',async r=>{
   if(new URL(r.request().url()).origin!==origin)return r.abort();
   if(r.request().resourceType()==='document'){const response=await r.fetch();return r.fulfill({response,body:(await response.text()).replaceAll(/"siteOrigin":"[^"]+"/g,`"siteOrigin":"${origin}"`)});}
   return r.continue();
  });
  await page.goto(`${origin}/${locale}/explore/`,{waitUntil:'networkidle'});
  const label=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);await page.getByRole('button',{name:label,exact:true}).first().tap();
  await page.locator('.auth-trigger[aria-busy="false"]').waitFor();
  const hearts=page.locator('[data-explore-card]:visible [data-favorite]');
  await hearts.nth(0).tap();assert.equal(await page.locator('[data-wishlist-invitation]').isVisible(),false);
  await hearts.nth(1).tap();await page.locator('[data-wishlist-invitation]').waitFor({state:'visible'});
  await page.locator('[data-wishlist-invite-signin]').tap();await page.waitForURL(`**/${locale}/login/**`);
  assert.equal(await page.locator('[data-wishlist-invitation]').count(),0);
  assert(await page.evaluate(()=>localStorage.getItem('fabio:wishlist:invite-dismissed:v1')));
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-wishlist-invitation]').count(),0);
  await page.goto(`${origin}/${locale}/explore/`,{waitUntil:'networkidle'});assert.equal(await page.locator('[data-wishlist-invitation]').isVisible(),false);
  assert.equal(await page.locator('[data-favorite][aria-pressed="true"]').count(),2);
  await page.evaluate(()=>localStorage.removeItem('fabio:wishlist:invite-dismissed:v1'));
  await page.goto(`${origin}/${locale}/login/`,{waitUntil:'networkidle'});assert.equal(await page.locator('[data-wishlist-invitation]').count(),0);
  results.push({locale,threshold:true,acceptancePersists:true,loginAndReloadExcluded:true,directLoginExcluded:true,guestFavoritesRetained:true});console.log(JSON.stringify(results.at(-1)));await context.close();
 }
}finally{await browser.close();}
await writeFile('qa/wishlist/login-invitation.json',JSON.stringify({origin,engine:'WebKit',externalSubmissions:0,results},null,2)+'\n');
