import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4322';
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
try{
 for(const locale of ['it','en']){
  const html=await(await fetch(`${origin}/${locale}/login/`)).text();
  const {config}=JSON.parse(html.match(/id="login-config"[^>]*>(.*?)<\/script>/s)[1]);
  const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});
  const page=await context.newPage(),calls=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  const user={id:'00000000-0000-4000-8000-000000000091',email:'qa@libero.it',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{first_name:'Mario',last_name:'Rossi',full_name:'Mario Rossi'}};
  const jwt=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.synthetic`;
  await context.route(config.url+'/**',async route=>{
   const request=route.request(),url=new URL(request.url()),headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*'};
   if(request.method()==='OPTIONS')return route.fulfill({headers,body:''});
   const input=request.postDataJSON();calls.push({path:url.pathname,input});
   if(url.pathname.endsWith('/signup')){assert.equal(input.data.full_name,'Mario Rossi');assert.equal('password_confirmation' in input.data,false);return route.fulfill({headers,json:{user,session:null}});}
   if(url.pathname.endsWith('/verify')){
    assert.equal(input.email,'qa@libero.it');assert.equal(input.type,'email');
    if(input.token!=='012345')return route.fulfill({status:403,headers,json:{code:'otp_expired',message:'Synthetic used or invalid code'}});
    return route.fulfill({headers,json:{user,access_token:jwt,refresh_token:'synthetic',expires_in:3600,token_type:'bearer'}});
   }
   if(url.pathname.endsWith('/user'))return route.fulfill({headers,json:user});
   return route.fulfill({headers,json:[]});
  });
  await context.route('https://challenges.cloudflare.com/**',route=>route.fulfill({contentType:'application/javascript',body:`window.turnstile={render(el,o){window.qaCaptcha=o;setTimeout(()=>o.callback('synthetic-token'),0);return 'fake'},reset(){setTimeout(()=>window.qaCaptcha.callback('synthetic-token'),0)},remove(){}};`}));
  await page.goto(`${origin}/${locale}/login/`);
  await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).first().click();
  await page.locator('[data-login-mode="signup"]').click();
  await page.locator('#login-first-name').focus();await page.locator('#login-last-name').focus();await page.locator('#login-first-name-error:visible').waitFor();
  await page.locator('#login-first-name').fill('Mario');await page.locator('#login-last-name').fill('Rossi');
  await page.locator('#login-email').fill('probe@tanpony.com');await page.locator('#login-password').fill('synthetic password');await page.locator('#login-password-confirm').fill('wrong password');
  await page.locator('#login-password-match-error:visible').waitFor();assert.equal(await page.locator('[data-login-submit]').isDisabled(),true);assert.equal(calls.length,0);
  await page.locator('#login-password-confirm').fill('synthetic password');assert.equal(await page.locator('[data-login-submit]').isDisabled(),true);assert.equal(calls.length,0);
  await page.locator('#login-email').fill('qa@libero.it');
  await page.locator('[data-login-submit]:enabled').waitFor();await page.locator('[data-login-submit]').click();
  await page.locator('[data-login-check-email]:visible').waitFor();assert.equal(await page.locator('[data-login-controls]').isVisible(),false);
  assert.equal(await page.locator('[data-code-cell]').count(),6);
  await page.locator('#login-code').fill('12345');assert.equal(await page.locator('[data-login-verify-code]').isDisabled(),true);
  assert.deepEqual(await page.locator('[data-code-cell]').allTextContents(),['1','2','3','4','5','']);
  assert.equal(await page.locator('[data-login-intro]').isVisible(),false);
  await page.screenshot({path:new URL(`./screenshots/otp-six-${locale}.png`,import.meta.url).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
  await page.locator('#login-code').fill('abc');assert.equal(await page.locator('[data-login-verify-code]').isDisabled(),true);
  await page.locator('#login-code').fill('999999');await page.locator('[data-login-verify-code]').click();await page.locator('[data-login-code-error]:visible').waitFor();
  await page.waitForTimeout(3100); // The narrow client retry guard after an invalid attempt.
  await page.locator('#login-code').evaluate(input=>{const clipboardData=new DataTransfer();clipboardData.setData('text','012 345');input.dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}));});
  assert.equal(await page.locator('#login-code').inputValue(),'012345');
  assert.deepEqual(await page.locator('[data-code-cell]').allTextContents(),['0','1','2','3','4','5']);
  await page.locator('[data-login-verify-code]').click();await page.waitForURL(`**/${locale}/`);
  await page.locator('.auth-trigger[aria-busy="false"]').waitFor();assert.ok((await page.locator('.auth-trigger-label').textContent()).includes('Mario'));
  await page.goto(`${origin}/${locale}/login/?settings=password`);await page.locator('[data-login-account]:visible').waitFor();
  await page.locator('#account-password').fill('new synthetic password');await page.locator('#account-password-confirm').fill('different password');
  await page.locator('#account-password-match-error:visible').waitFor();assert.equal(await page.locator('[data-login-set-password] button').isDisabled(),true);
  assert.equal(calls.filter(c=>c.input?.password==='new synthetic password').length,0);
  await page.locator('#account-password-confirm').fill('new synthetic password');await page.locator('[data-login-set-password] button').click();
  await page.waitForFunction(()=>document.querySelector('#account-password').value==='');assert.equal(calls.filter(c=>c.input?.password==='new synthetic password').length,1);
  assert.equal(calls.filter(c=>c.path.endsWith('/signup')).length,1);
  assert.equal(calls.filter(c=>c.path.endsWith('/verify')).length,2);
  assert.equal(calls.some(c=>c.path.endsWith('/otp')||c.path.endsWith('/resend')),false);
  assert.deepEqual(errors,[]);
  results.push({locale,passed:true,synthetic:true,checks:['check-email screen replaces signup','invalid format blocked','wrong/used code stays signed out','numeric code preserves leading zero','same-browser sign-in without PKCE verifier','no second email']});
  await context.close();
 }
 await writeFile(new URL('./otp-browser-results.json',import.meta.url),JSON.stringify({results,realEmailsSent:0},null,2)+'\n');
 console.log(JSON.stringify(results));
}finally{await browser.close();}
