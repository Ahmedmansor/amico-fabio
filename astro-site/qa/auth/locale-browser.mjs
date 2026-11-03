import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {nextLocaleState} from '../../src/features/auth/domain/locale-preference.ts';
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href):await import('playwright');
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const results=[],output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
try{
for(const locale of ['it','en'])for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
  await context.addInitScript(({a,locale})=>{
    if(sessionStorage.getItem('qa:retired-intent'))return;
    sessionStorage.setItem('qa:retired-intent','1');
    sessionStorage.setItem(`fabio:locale-pending:v1:${a}`,JSON.stringify({version:1,savedAt:Date.now(),value:{
      intent:{kind:'site',locale},command:{kind:'site',locale,expectedRevision:0,requestId:crypto.randomUUID()}}}));
  },{a,locale});
  const state=new Map([[a,{siteLocale:locale,revision:0,email:{locale,source:'follow_site'}}],[b,{siteLocale:locale,revision:0,email:null}]]);
  const commands=[],reads=[],ledger=new Map(),errors=[];let loseNext=false;
  await context.route('https://locale-qa.invalid/**',async route=>{
    const request=route.request(),method=request.method();
    const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'Authorization, Content-Type','access-control-allow-methods':'GET, PATCH, OPTIONS','cache-control':'no-store'};
    if(method==='OPTIONS')return route.fulfill({status:204,headers});
    const owner=request.headers().authorization?.replace('Bearer synthetic-','');assert.ok(state.has(owner));
    if(method==='GET'){reads.push(owner);return route.fulfill({status:200,headers,json:{state:state.get(owner)}});}
    assert.equal(method,'PATCH');const command=request.postDataJSON();commands.push({owner,command});
    assert.equal('userId' in command,false);assert.equal('enabled' in command,false);
    const key=owner+':'+command.requestId;
    if(ledger.has(key))return route.fulfill({status:200,headers,json:{outcome:'duplicate',state:state.get(owner)}});
    const result=nextLocaleState(state.get(owner),command);
    if(!result.ok)return route.fulfill({status:409,headers,json:{error:'conflict',state:result.state}});
    state.set(owner,result.value);ledger.set(key,true);
    if(loseNext){loseNext=false;return route.fulfill({status:503,headers,json:{error:'unavailable'}});}
    return route.fulfill({status:200,headers,json:{outcome:'applied',state:result.value}});
  });
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin||url.hostname==='locale-qa.invalid')return route.fallback();
    errors.push(`Unexpected external request: ${url.origin}`);return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const ready=async()=>{
    try{await page.waitForFunction(()=>document.querySelector('[data-locale-settings]')?.getAttribute('data-state')==='ready');}
    catch(error){console.error(JSON.stringify({locale,width,reads,commands:commands.length,errors,
      ui:await page.locator('[data-locale-settings]').textContent(),state:await page.locator('[data-locale-settings]').getAttribute('data-state')}));throw error;}
  };
  await page.goto(`${origin}/${locale}/qa-account-locale/`);
  await page.locator('[data-qa-a]').waitFor();assert.equal(reads.length,0);assert.equal(commands.length,0);
  assert.equal(await page.locator('[data-locale-settings]').isVisible(),false);
  await page.locator('[data-qa-a]').click();await ready();assert.equal(reads.length,1);
  const select=page.locator('[data-locale-choice]');
  assert.equal(await select.inputValue(),locale);
  assert.equal(await select.getAttribute('aria-describedby'),'email-locale-status');
  await select.focus();await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-locale-save]').evaluate(node=>node===document.activeElement),true);
  const choice=locale==='it'?'en':'it';
  await select.selectOption(choice);await page.locator('[data-locale-save]').click();await ready();
  assert.equal(state.get(a).email.source,'explicit');assert.equal(state.get(a).email.locale,choice);
  assert.equal(await page.locator('[data-locale-status]').textContent(),locale==='it'?'Lingua salvata.':'Language saved.');
  const beforeReload=reads.length;await page.reload();await page.locator('[data-qa-a]').click();await ready();
  assert.equal(reads.length,beforeReload); // bounded display cache, no navigation write
  loseNext=true;
  await page.locator('[data-locale-choice]').selectOption(locale);
  await page.locator('[data-locale-save]').click();
  await page.waitForFunction(()=>document.querySelector('[data-locale-settings]')?.getAttribute('data-state')==='uncertain');
  assert.equal(await page.locator('[data-locale-save]').isDisabled(),true);
  const lostId=commands.at(-1).command.requestId;
  await page.locator('[data-locale-retry]').click();await ready();
  assert.equal(commands.at(-1).command.requestId,lostId);
  // Another device changes settings; no automatic overwrite follows a conflict.
  const remote=state.get(a);state.set(a,{...remote,revision:remote.revision+1,email:{locale,source:'explicit'}});
  await page.locator('[data-locale-choice]').selectOption(choice);
  await page.locator('[data-locale-save]').click();
  await page.waitForFunction(()=>document.querySelector('[data-locale-settings]')?.getAttribute('data-state')==='conflict');
  const conflicts=commands.length;await page.waitForTimeout(40);assert.equal(commands.length,conflicts);
  await page.locator('[data-locale-save]').click();await ready();assert.equal(state.get(a).email.locale,choice);
  await page.locator('[data-qa-b]').click();await ready();
  assert.equal(await page.locator('[data-locale-form]').isVisible(),false);
  assert.equal(await page.locator('[data-locale-no-preference]').isVisible(),true);
  assert.equal(commands.filter(item=>item.owner===b).length,0);
  await page.locator('[data-qa-out]').click();assert.equal(await page.locator('[data-locale-settings]').isVisible(),false);
  await page.locator('[data-qa-a]').click();await ready();
  await page.locator('[data-locale-choice]').selectOption(choice);await page.locator('[data-locale-save]').click();await ready();
  await page.screenshot({path:new URL(`locale-${locale}-${width}.png`,output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const selector of ['[data-locale-choice]','[data-locale-save]'])
    assert.ok(await page.locator(selector).evaluate(node=>node.getBoundingClientRect().height)>=44);
  // Browsing anchors never write the account or correspondence language.
  const previousRevision=state.get(a).revision,previousWrites=commands.length;
  const nextLocale=locale==='it'?'en':'it';
  await page.locator(`[data-lang="${nextLocale}"]`).click();
  await page.waitForURL(`${origin}/${nextLocale}/qa-account-locale/`);
  await page.locator('[data-qa-a]').click();await ready();
  assert.equal(state.get(a).email.locale,choice);
  assert.equal(state.get(a).revision,previousRevision);assert.equal(commands.length,previousWrites);
  assert.equal(errors.length,0,errors.join('\n'));
  results.push({locale,width,passed:true,requests:{reads:reads.length,writesIncludingRetries:commands.length},errors});
  await context.close();
}
await writeFile(new URL('./locale-browser-results.json',import.meta.url),JSON.stringify({syntheticOnly:true,cases:results},null,2)+'\n');
console.log(`Locale browser checks passed: ${results.length} IT/EN mobile/desktop cases; no real Auth, subscriptions or emails.`);
}finally{await browser.close();}
