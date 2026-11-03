import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin='http://127.0.0.1:4337',endpoint='https://management-qa.invalid',token='a'.repeat(64);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[],screenshots=new URL('./screenshots/',import.meta.url);await mkdir(screenshots,{recursive:true});
try{for(const locale of ['it','en'])for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),calls=[],errors=[],seen=new Set();
  let state={enabled:true,locale,revision:0},loseReply=true,forceConflict=false;
  await context.route(`${endpoint}/**`,async route=>{
    const request=route.request(),headers={'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'Content-Type'};
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    assert.equal(request.method(),'POST');assert.equal(request.headers().authorization,undefined);
    assert.equal(new URL(request.url()).search,'');const body=request.postDataJSON();calls.push(body);
    if(body.token!==token)return route.fulfill({status:400,headers,json:{error:'invalid-link'}});
    const command=body.command;
    if(command.operation==='unsubscribe'){
      assert.equal(command.consentLocale,locale);state={...state,enabled:false};
      if(loseReply){loseReply=false;return route.fulfill({status:503,headers,json:{error:'unavailable'}});}
    }
    if(command.operation==='language'&&!seen.has(command.requestId)){
      if(forceConflict){forceConflict=false;state={...state,revision:state.revision+1};}
      if(command.expectedRevision!==state.revision)return route.fulfill({status:409,headers,json:{state,conflict:true}});
      seen.add(command.requestId);state={...state,locale:command.locale,revision:state.revision+1};
    }
    return route.fulfill({status:200,headers,json:{state,conflict:false}});
  });
  await context.route('**/*',async route=>{const url=new URL(route.request().url());
    if([origin,endpoint].includes(url.origin))return route.fallback();errors.push(url.origin);return route.abort();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${origin}/${locale}/email-preferences/#token=${token}`);
  await page.locator('[data-management-form]').waitFor({state:'visible'});
  assert.equal(new URL(page.url()).hash,'');assert.equal(calls.length,1);assert.equal(calls[0].command.operation,'read');
  assert.equal(await page.locator('html').getAttribute('lang'),locale);
  assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'),'no-referrer');
  assert.equal(await page.locator('[data-auth-dialog]').count(),0);
  await page.locator('[data-management-stop]').click();await page.locator('[data-management-retry]').waitFor({state:'visible'});
  const id=calls.at(-1).command.requestId;await page.locator('[data-management-retry]').click();await page.locator('[data-management-form]').waitFor({state:'visible'});
  assert.equal(calls.at(-1).command.requestId,id);assert.equal(state.enabled,false);
  assert.equal(await page.locator('[data-management-stop]').isDisabled(),true);
  const other=locale==='it'?'en':'it';await page.locator('[data-management-language]').selectOption(other);
  await page.locator('[data-management-save]').click();await page.waitForFunction(()=>!document.querySelector('[data-management-save]').disabled);
  assert.equal(state.locale,other);assert.equal(state.enabled,false);
  forceConflict=true;await page.locator('[data-management-language]').selectOption(locale);await page.locator('[data-management-save]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-management-save]').disabled);
  assert.equal(state.locale,other);assert.match(await page.locator('[data-management-status]').textContent(),locale==='it'?/altrove/:/elsewhere/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(value=>Object.values({...localStorage,...sessionStorage}).some(item=>item.includes(value)),token),false);
  await page.screenshot({path:new URL(`management-${locale}-${width}.png`,screenshots).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
  await page.goto(`${origin}/${locale}/email-preferences/#token=${'b'.repeat(64)}`);
  await page.waitForFunction(()=>/^(Questo|This) link/.test(document.querySelector('[data-management-status]')?.textContent??''));
  assert.equal(await page.locator('[data-management-form]').isVisible(),false);
  assert.equal(errors.length,0,errors.join('\n'));
  results.push({locale,width,passed:true,requests:calls.length,errors});await context.close();
}}finally{await browser.close();}
await writeFile(new URL('./management-browser-results.json',import.meta.url),JSON.stringify({syntheticOnly:true,cases:results},null,2)+'\n');
console.log(`Management browser checks passed: ${results.length} IT/EN mobile/desktop cases; no Auth, real token, consent or email.`);
