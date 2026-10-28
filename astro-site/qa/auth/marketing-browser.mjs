import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4332';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const results=[];
try{
  for(const locale of ['it','en'])for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    const page=await context.newPage(),calls=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    let preference={marketing_consent:false,revision:0,verified:true,pending_signup:false},failNext=true;
    const user={id:'00000000-0000-4000-8000-000000000092',email:'qa@libero.it',aud:'authenticated',role:'authenticated',email_confirmed_at:'2026-10-28T00:00:00Z',user_metadata:{marketing_consent:true},app_metadata:{provider:'email'}};
    const jwt=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.synthetic`;
    const session={user,access_token:jwt,refresh_token:'synthetic',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer'};
    await context.route('https://challenges.cloudflare.com/**',route=>route.fulfill({contentType:'application/javascript',body:`window.turnstile={render(el,o){window.qaCaptcha=o;setTimeout(()=>o.callback('synthetic-token'),0);return 'qa'},reset(){setTimeout(()=>window.qaCaptcha.callback('synthetic-token'),0)}};`}));
    await context.route('https://auth-qa.invalid/**',async route=>{
      const request=route.request(),url=new URL(request.url()),headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*'};
      if(request.method()==='OPTIONS')return route.fulfill({headers,body:''});
      const input=request.postDataJSON();calls.push({path:url.pathname,input});
      if(url.pathname.endsWith('/signup'))return route.fulfill({headers,json:{user:{...user,email_confirmed_at:null},session:null}});
      if(url.pathname.endsWith('/user'))return route.fulfill({headers,json:user});
      if(url.pathname.endsWith('/read_account_marketing_consent'))return route.fulfill({headers,json:[preference]});
      if(url.pathname.endsWith('/set_account_marketing_consent')){
        assert.equal(input.p_expected_user_id,user.id);assert.equal(input.p_expected_revision,preference.revision);
        if(failNext){failNext=false;return route.fulfill({status:503,headers,json:{message:'Synthetic failure'}});}
        preference={...preference,marketing_consent:input.p_enabled,revision:preference.revision+1};return route.fulfill({headers,json:[preference]});
      }
      return route.fulfill({status:400,headers,json:{message:'Unexpected synthetic endpoint'}});
    });
    await page.goto(`${origin}/${locale}/login/`);
    await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-login-mode="signup"]').click();
    assert.equal(await page.locator('[data-login-marketing-intent]').isChecked(),false);
    await page.locator('#login-email').fill('qa@libero.it');await page.locator('#login-password').fill('synthetic password');
    await page.locator('[data-login-marketing-intent]').check();
    await page.locator('[data-login-submit]:enabled').waitFor();await page.locator('[data-login-submit]').click();
    await page.waitForFunction(()=>document.querySelector('#login-password').value==='');
    const signup=calls.find(call=>call.path.endsWith('/signup')).input;
    assert.equal(signup.data.marketing_consent,true);assert.equal(signup.data.marketing_notice_version,'favorites-offers-v1');
    assert.equal(calls.filter(call=>call.path.includes('marketing_consent')).length,0,'Guest metadata must not write confirmed consent');
    await context.addInitScript(session=>localStorage.setItem('fabio:auth:session:v1',JSON.stringify(session)),session);
    await page.goto(`${origin}/${locale}/wishlist/`);
    const checkbox=page.locator('[data-marketing-choice]'),save=page.locator('[data-marketing-save]');
    await page.locator('[data-marketing-save]:enabled').waitFor();
    assert.equal(await checkbox.isChecked(),false,'Editable user metadata must not grant consent');
    await checkbox.check();await save.click();await page.locator('[data-marketing-retry]:visible').waitFor();
    assert.equal(await checkbox.isDisabled(),true,'Failed write cannot imply confirmed consent');
    await page.locator('[data-marketing-retry]').click();await page.locator('[data-marketing-save]:enabled').waitFor();
    assert.equal(await checkbox.isChecked(),false);
    await checkbox.check();await save.click();await page.waitForFunction(()=>document.querySelector('[data-marketing-choice]').checked&&!document.querySelector('[data-marketing-save]').disabled);
    await checkbox.uncheck();await save.click();await page.waitForFunction(()=>!document.querySelector('[data-marketing-choice]').checked&&!document.querySelector('[data-marketing-save]').disabled);
    await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.waitForTimeout(250);
    await page.screenshot({path:new URL(`marketing-${locale}-${width}.png`,output).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
    assert.equal(preference.marketing_consent,false);assert.equal(preference.revision,2);
    assert.equal(calls.some(call=>/wishlist-email|send-email/.test(call.path)),false,'No reminder or email calls');
    assert.deepEqual(errors,[]);
    results.push({locale,width,passed:true,checks:['default unchecked signup','versioned intent only','metadata cannot grant','verified preference read','failed write and retry','explicit opt-in','withdrawal','no reminder/email calls'],synthetic:true});
    await context.close();
  }
  await writeFile(new URL('./marketing-browser-results.json',import.meta.url),JSON.stringify({results,sqlRoleTestsExecuted:false,externalEmailsSent:0},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
