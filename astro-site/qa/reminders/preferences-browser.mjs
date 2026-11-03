import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4331';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname))throw new Error('Loopback QA only.');
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const results=[];
await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
try{
  for(const locale of ['it','en'])for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    await context.route('**/*',route=>{
      if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}
      return route.continue();
    });
    const response=await page.goto(`${origin}/${locale}/qa-reminder-preferences/`);assert.equal(response.status(),200);
    await page.waitForFunction(()=>!!globalThis.reminderQA);
    const root=page.locator('[data-reminder-preferences]'),choice=page.locator('[data-reminder-choice]'),save=page.locator('[data-reminder-save]');
    assert.equal(await root.isVisible(),false);
    await page.evaluate(id=>globalThis.reminderQA.connect(id),a);
    assert.equal(await root.isVisible(),true);assert.equal(await choice.isChecked(),false);assert.equal(await save.isDisabled(),true);
    assert.equal(await page.evaluate(()=>globalThis.reminderQA.commands().length),0);
    await choice.focus();assert.notEqual(await choice.evaluate(node=>getComputedStyle(node).outlineStyle),'none');
    await page.keyboard.press('Space');assert.equal(await choice.isChecked(),true);assert.equal(await save.isEnabled(),true);
    await page.keyboard.press('Tab');await page.keyboard.press('Enter');
    await page.waitForFunction(()=>globalThis.reminderQA.state().preference?.enabled===true);
    assert.equal(await save.isDisabled(),true);
    assert.equal(await page.locator('.reminder-privacy').getAttribute('href'),`/${locale}/legal/`);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:new URL(`./screenshots/preferences-${locale}-${width}.png`,import.meta.url).pathname.slice(1),fullPage:true});
    await page.evaluate(()=>globalThis.reminderQA.failNext());await choice.uncheck();await save.click();
    await page.waitForFunction(()=>globalThis.reminderQA.state().status==='error');
    assert.equal(await choice.isChecked(),true);assert.equal(await choice.isDisabled(),true);
    await page.locator('[data-reminder-retry]').click();
    await page.waitForFunction(()=>globalThis.reminderQA.state().status==='ready');
    assert.equal(await choice.isChecked(),false);
    const commands=await page.evaluate(()=>globalThis.reminderQA.commands());assert.equal(commands.length,3);assert.deepEqual(commands[1],commands[2]);
    await page.evaluate(()=>globalThis.reminderQA.connect(null));assert.equal(await root.isVisible(),false);
    await page.evaluate(()=>{globalThis.reminderQA.holdNext();void globalThis.reminderQA.connect('00000000-0000-4000-8000-000000000001');});
    assert.equal(await root.getAttribute('aria-busy'),'true');assert.equal(await choice.isDisabled(),true);
    await page.evaluate(id=>globalThis.reminderQA.connect(id),b);await page.evaluate(()=>globalThis.reminderQA.release());
    assert.equal(await choice.isChecked(),false);assert.equal(await page.evaluate(()=>globalThis.reminderQA.state().userId),b);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    results.push({locale,width,uncheckedByDefault:true,keyboardSave:true,noImplicitConsent:true,retrySameRequest:true,accountIsolation:true,noOverflow:true,localOnly:true,noPageErrors:true});
    await context.close();
  }
  await writeFile(new URL('./preferences-browser-results.json',import.meta.url),JSON.stringify({mode:'synthetic-local-only',cases:results},null,2)+'\n');
  console.log('Preference UI passed: 4 IT/EN mobile/desktop cases; keyboard save, explicit consent, uncertain-write retry, account isolation, no overflow, local resources only, no page errors. No live subscription or email.');
}finally{await browser.close();}
