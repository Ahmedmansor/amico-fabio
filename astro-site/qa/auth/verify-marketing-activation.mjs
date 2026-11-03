// Public artifact/API-denial and guest UI checks only; never submits signup.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const origin='https://amico-fabio-iyzo.vercel.app',artifacts=[];
let connection;
for(const locale of ['it','en'])for(const route of ['login/','wishlist/']){
 const response=await fetch(`${origin}/${locale}/${route}`),html=await response.text();
 assert.equal(response.status,200);assert.match(html,/<meta name="robots" content="noindex, follow"/);
 assert.ok(html.includes('data-marketing-consent'));assert.ok(html.includes('id="marketing-config"'));
 if(route==='login/'){
  const {config,marketingEnabled}=JSON.parse(html.match(/<script\b(?=[^>]*\bid="login-config")[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(marketingEnabled,true);assert.equal(config.siteOrigin,origin);
  assert.equal(config.googleEnabled,true);assert.equal(config.passwordEnabled,true);
  assert.ok(html.includes('data-login-marketing-intent'));connection=config;
 }
 artifacts.push({locale,route,status:200,noindex:true,marketingEnabled:true});
}
const denied=await fetch(`${connection.url}/rest/v1/rpc/read_account_marketing_consent`,{
 method:'POST',headers:{apikey:connection.publishableKey,'Content-Type':'application/json'},
 body:JSON.stringify({p_expected_user_id:'00000000-0000-4000-8000-000000000092'})
});
assert.ok([401,403].includes(denied.status),`Anonymous RPC must be denied: ${denied.status}`);
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER}),ui=[];
await mkdir('qa/auth/screenshots',{recursive:true});
try{
 for(const locale of ['it','en'])for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),sends=[];
  page.on('request',request=>{if(request.method()==='POST'&&/\/auth\/v1\/(signup|otp|resend|verify|token)/.test(request.url()))sends.push('unexpected-auth-send');});
  await page.goto(`${origin}/${locale}/login/`,{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true});await reject.waitFor();await reject.click();
  await page.locator('[data-login-mode=signup]').click();
  const row=page.locator('[data-login-marketing-row]'),choice=row.locator('[data-login-marketing-intent]');
  await row.scrollIntoViewIfNeeded();await row.locator('img').evaluate(img=>img.decode());
  assert.equal(await choice.isChecked(),false);assert.equal(await choice.evaluate(n=>n.required),false);
  await choice.focus();await page.keyboard.press('Space');assert.equal(await choice.isChecked(),true);
  await page.keyboard.press('Space');assert.equal(await choice.isChecked(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(sends,[]);
  await page.screenshot({path:`qa/auth/screenshots/marketing-live-${locale}-${width}.png`});
  ui.push({locale,width,portraitLoads:true,uncheckedOptional:true,keyboardToggle:true,authSends:0});await page.close();
 }
}finally{await browser.close();}
const report={origin,sourceCommit:process.env.QA_SOURCE_COMMIT,artifacts,ui,anonymousRpcStatus:denied.status,
 authenticatedNativeEvidence:'../../supabase/marketing-consent/native-overlap-2026-11-02.json',
 realBrowserAccountOrInboxTest:false,promotionalEmailsSent:0};
await writeFile(new URL('./marketing-activation-deployment.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({artifacts:artifacts.length,ui:ui.length,anonymousRpcStatus:denied.status,pass:true}));
