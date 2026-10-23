import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4330';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
try{
  for(const locale of ['it','en'])for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900}});
    let requests=0;await context.route('https://auth-qa.invalid/**',route=>{requests++;return route.abort();});
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${origin}/${locale}/explore/`);
    await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
    const invite=page.locator('[data-wishlist-invitation]');assert.equal(await invite.isVisible(),false);
    const hearts=page.locator('[data-explore-card]:not([hidden]) [data-favorite]');
    await hearts.nth(0).waitFor({state:'visible'});await hearts.nth(0).click();await invite.waitFor({state:'visible'});
    assert.equal(await hearts.nth(0).evaluate(button=>button===document.activeElement),true,'Invitation must not steal focus');
    const bounds=await invite.boundingBox();assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width && bounds.y>=0 && bounds.y+bounds.height<=900);
    await page.screenshot({path:new URL(`./screenshots/invitation-${locale}-${width}.png`,import.meta.url).pathname.slice(1)});
    await page.locator('[data-wishlist-invite-dismiss]').click();await invite.waitFor({state:'hidden'});
    assert.ok(await page.evaluate(()=>localStorage.getItem('fabio:wishlist:invite-dismissed:v1')));
    await hearts.nth(1).click();assert.equal(await invite.isVisible(),false);
    await page.reload();await hearts.nth(0).waitFor({state:'visible'});assert.equal(await invite.isVisible(),false);
    await page.locator('#global-header [data-auth-open]').click();await page.locator('[data-auth-dialog]').waitFor({state:'visible'});
    await page.keyboard.press('Escape');
    await page.evaluate(()=>localStorage.setItem('fabio:wishlist:invite-dismissed:v1',String(Date.now()-8*24*60*60*1000)));
    await page.reload();await hearts.nth(2).waitFor({state:'visible'});await hearts.nth(2).click();await invite.waitFor({state:'visible'});
    await page.locator('[data-wishlist-invite-signin]').click();await page.locator('[data-auth-dialog]').waitFor({state:'visible'});
    assert.equal(await invite.isVisible(),false);await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.activeElement?.matches('#global-header [data-auth-open]'));
    assert.deepEqual(errors,[]);assert.equal(requests,0,'Guest invitation never sends Auth mail or database requests');
    results.push({locale,width,afterSave:true,noFocusSteal:true,dismissalPersists:true,manualSignInDuringDismissal:true,expiry:true,opensDialog:true,noExternalRequests:true});
    await context.close();
  }
  await writeFile(new URL('./invitation-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
  console.log('Guest invitation: 4 cases passed; after-save invitation, seven-day suppression/reload, manual sign-in, expiry, focus and no external requests.');
}finally{await browser.close();}
