import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {nextLocaleState} from '../../src/features/auth/domain/locale-preference.ts';
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href):await import('playwright');
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4335',endpoint='https://auth-qa.invalid';
const optIn=process.env.QA_REMINDER_OPT_IN==='1';
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
const results=[],output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const id='00000000-0000-4000-8000-000000000001';
const user={id,email:'qa@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'google',providers:['google']},
  user_metadata:{full_name:'QA Traveler'},created_at:'2026-10-23T00:00:00Z'};
const payload={sub:id,aud:'authenticated',role:'authenticated',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600};
const token=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.synthetic`;
try{
for(const locale of ['it','en'])for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
  await context.addInitScript(({user,token})=>{
    if(!localStorage.getItem('qa:locale:seeded')){
      localStorage.setItem('qa:locale:seeded','1');
      localStorage.setItem('fabio:auth:session:v1',JSON.stringify({access_token:token,refresh_token:'synthetic_refresh',token_type:'bearer',
        expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user}));
    }
  },{user,token});
  let state={siteLocale:locale,revision:0,email:optIn?null:{locale,source:'follow_site'}};
  let preference=null,loseConsentReply=optIn;
  const consentCommands=[],consentRequests=new Set();
  const calls={reads:0,writes:0,logout:0,authVerifies:0,preferenceReads:0,preferenceWrites:0},errors=[];
  await context.route(`${endpoint}/**`,async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method();
    const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*','access-control-allow-methods':'GET, POST, PATCH, DELETE, OPTIONS','cache-control':'no-store'};
    if(method==='OPTIONS')return route.fulfill({status:200,headers,body:''});
    if(url.pathname==='/auth/v1/user'){calls.authVerifies++;return route.fulfill({status:200,headers,json:user});}
    if(url.pathname==='/auth/v1/logout'){calls.logout++;return route.fulfill({status:204,headers});}
    if(url.pathname==='/functions/v1/account-locale'){
      assert.ok(request.headers().authorization?.startsWith('Bearer '));
      if(method==='GET'){calls.reads++;return route.fulfill({status:200,headers,json:{state}});}
      assert.equal(method,'PATCH');calls.writes++;
      const command=request.postDataJSON();assert.equal('enabled' in command,false);assert.equal('userId' in command,false);
      const result=nextLocaleState(state,command);assert.equal(result.ok,true);state=result.value;
      if(preference)preference={...preference,locale:state.email.locale};
      return route.fulfill({status:200,headers,json:{outcome:'applied',state}});
    }
    if(url.pathname==='/functions/v1/wishlist-email-preferences'&&optIn){
      if(method==='GET'){calls.preferenceReads++;return route.fulfill({status:200,headers,json:{preference}});}
      assert.equal(method,'PATCH');calls.preferenceWrites++;
      const command=request.postDataJSON();consentCommands.push(command);
      assert.equal('userId' in command,false);assert.equal('enabledSince' in command,false);
      if(!consentRequests.has(command.requestId)){
        consentRequests.add(command.requestId);
        const language=state.email?.locale??command.locale;
        preference={enabled:command.enabled,locale:language,wordingVersion:command.wordingVersion,updatedAt:'2026-10-25T00:00:00Z',
          enabledSince:command.enabled?'2026-10-25T00:00:00Z':null};
        if(!state.email)state={...state,email:{locale:language,source:'explicit'}};
      }
      if(loseConsentReply){loseConsentReply=false;return route.fulfill({status:503,headers,json:{error:'unavailable'}});}
      return route.fulfill({status:200,headers,json:{preference}});
    }
    if(url.pathname==='/rest/v1/profiles'&&method==='POST')return route.fulfill({status:201,headers,body:''});
    if(['/rest/v1/wishlists','/rest/v1/package_wishlists'].includes(url.pathname)&&method==='GET')return route.fulfill({status:200,headers,json:[]});
    errors.push(`Unexpected synthetic API: ${method} ${url.pathname}`);return route.abort();
  });
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.origin===origin||url.origin===endpoint)return route.fallback();
    errors.push(`Unexpected external request: ${url.origin}`);return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${origin}/${locale}/wishlist/`);
  await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  const trigger=page.locator('#global-header [data-auth-open]');
  await page.waitForFunction(()=>!document.querySelector('#global-header [data-auth-open]')?.disabled);
  assert.match(await trigger.textContent(),/QA/);
  if(optIn){
    await page.waitForFunction(()=>!document.querySelector('[data-reminder-form] fieldset')?.disabled);
    const choice=page.locator('[data-reminder-choice]');assert.equal(await choice.isChecked(),false);
    const initialLanguage=locale==='it'?'en':'it';
    await page.locator('[data-reminder-language]').selectOption(initialLanguage);
    assert.equal(calls.preferenceWrites,0);assert.equal(calls.preferenceReads,1);
    await choice.check();await page.waitForTimeout(1100);assert.equal(calls.preferenceWrites,0);
    await page.locator('[data-reminder-save]').click();await page.locator('[data-reminder-retry]').waitFor({state:'visible'});
    assert.equal(preference.enabled,true);assert.equal(calls.preferenceWrites,1);
    assert.equal(preference.locale,initialLanguage);
    assert.equal(consentCommands[0].consentLocale,locale);
    await page.locator('[data-reminder-retry]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-reminder-form] fieldset')?.disabled);
    assert.equal(await choice.isChecked(),true);assert.equal(calls.preferenceWrites,2);
    assert.equal(consentCommands[0].requestId,consentCommands[1].requestId);
  }
  await trigger.click();await page.locator('[data-auth-dialog]').waitFor({state:'visible'});
  const ready=()=>page.waitForFunction(()=>document.querySelector('[data-locale-settings]')?.getAttribute('data-state')==='ready');
  await ready();const stableReads=calls.reads;await page.waitForTimeout(1100);assert.equal(calls.reads,stableReads);
  assert.equal(calls.writes,0);
  const select=page.locator('[data-locale-choice]');await select.focus();await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('[data-auth-close]').evaluate(node=>node===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await select.evaluate(node=>node===document.activeElement),true);
  const other=optIn?locale:locale==='it'?'en':'it';await select.selectOption(other);await page.locator('[data-locale-save]').click();await ready();
  assert.equal(state.email.source,'explicit');assert.equal(state.email.locale,other);assert.equal(calls.writes,1);
  assert.equal(calls.authVerifies,1); // Header and wishlist share verified restoration.
  assert.equal(await page.locator('[data-auth-dialog]').evaluate(node=>node.scrollWidth<=node.clientWidth),true);
  await page.screenshot({path:new URL(`locale-auth-${locale}-${width}.png`,output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
  if(optIn){
    await page.locator('[data-auth-close]').click();
    await page.locator('[data-reminder-choice]').uncheck();await page.locator('[data-reminder-save]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-reminder-form] fieldset')?.disabled);
    assert.equal(preference.enabled,false);assert.equal(preference.enabledSince,null);
    assert.equal(preference.locale,other);assert.equal(state.email.source,'explicit');
    assert.equal(calls.preferenceWrites,3);assert.equal(consentRequests.size,2);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:new URL(`preferences-auth-${locale}-${width}.png`,output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
    await trigger.click();await ready();
  }
  const beforeSignout=calls.reads;
  await page.locator('[data-auth-signout]').click();await page.waitForURL(`${origin}/${locale}/`);
  await page.waitForFunction(()=>!document.querySelector('#global-header [data-auth-open]')?.disabled);
  assert.equal(calls.logout,1);assert.equal(calls.reads,beforeSignout);
  assert.equal(await page.locator('[data-auth-dialog]').isVisible(),false);
  assert.equal(await page.locator('[data-locale-settings]').isVisible(),false);
  if(optIn)assert.equal(await page.locator('[data-reminder-preferences]').isVisible(),false);
  assert.equal(errors.length,0,errors.join('\n'));
  results.push({locale,width,passed:true,calls,errors});await context.close();
}
await writeFile(new URL(optIn?'../reminders/preferences-auth-browser-results.json':'./locale-auth-browser-results.json',import.meta.url),JSON.stringify({syntheticOnly:true,cases:results},null,2)+'\n');
console.log(`Full Auth/locale${optIn?'/consent':''} integration passed: ${results.length} IT/EN mobile/desktop cases; one Auth restore, explicit saves/retries, and home after logout.`);
}finally{await browser.close();}
