import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin='http://127.0.0.1:4332';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const id='00000000-0000-4000-8000-000000000001';
const user={id,email:'allowed@example.test',email_confirmed_at:'2026-10-24T00:00:00Z',aud:'authenticated',role:'authenticated',app_metadata:{provider:'google'},user_metadata:{}};
const token=Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.synthetic_signature';
const results=[];await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
try{
  for(const locale of ['it','en'])for(const width of [375,1440])for(const outcome of ['accepted','unknown']){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    await context.addInitScript(({token,user})=>localStorage.setItem('fabio:auth:session:v1',JSON.stringify({access_token:token,refresh_token:'synthetic-refresh',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,user})),{token,user});
    let sends=0;const errors=[];
    await context.route('https://auth-qa.invalid/**',async route=>{
      const request=route.request(),url=new URL(request.url());const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
      if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
      if(url.pathname==='/auth/v1/user')return route.fulfill({status:200,headers,json:user});
      if(url.pathname==='/functions/v1/wishlist-email-test'){
        sends++;assert.equal(request.method(),'POST');assert.equal(request.postData(),null);assert.equal(request.headers().authorization,`Bearer ${token}`);
        return route.fulfill({status:outcome==='accepted'?200:503,headers,json:outcome==='accepted'?{status:'accepted',messageId:'synthetic-id'}:{status:'unknown'}});
      }
      if(url.pathname.startsWith('/rest/v1/'))return route.fulfill({status:200,headers,json:[]});
      throw new Error('Unmocked synthetic Auth path.');
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${origin}/${locale}/wishlist/`);
    const reject=page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true});await reject.waitFor({state:'visible'});await reject.click();await reject.waitFor({state:'hidden'});
    const button=page.locator('[data-summary-email-send]');await button.waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('[data-summary-email-send]').disabled);
    assert.equal(sends,0);await button.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-summary-email-status]').textContent&&!document.querySelector('[data-summary-email-test]').hasAttribute('aria-busy')||document.querySelector('[data-summary-email-test]').getAttribute('aria-busy')==='false');
    await page.waitForFunction(()=>document.querySelector('[data-summary-email-test]').getAttribute('aria-busy')==='false');
    assert.equal(sends,1);assert.equal(await button.isDisabled(),true);
    const text=await page.locator('[data-summary-email-status]').innerText();assert.match(text,outcome==='accepted'?/Brevo/:/confermare|confirmed/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
    await page.locator('[data-summary-email-test]').screenshot({path:new URL(`./screenshots/summary-send-${locale}-${width}-${outcome}.png`,import.meta.url).pathname.slice(1)});
    results.push({locale,width,outcome,explicitSingleSend:true,noRecipientInRequest:true,noAutomaticRetry:true,noOverflow:true,noPageErrors:true});await context.close();
  }
  await writeFile(new URL('./summary-browser-results.json',import.meta.url),JSON.stringify({mode:'synthetic-no-real-email',cases:results},null,2)+'\n');
  console.log('Summary sending UI passed: 8 IT/EN mobile/desktop accepted/unknown cases, explicit single send, no recipient/body input, no automatic retry or overflow, no page errors. No real email.');
}finally{await browser.close();}
