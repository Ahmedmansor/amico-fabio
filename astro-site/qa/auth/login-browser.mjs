import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4332';
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const results=[];
const fixtureUser={id:'00000000-0000-4000-8000-000000000091',email:'qa@libero.it',aud:'authenticated',role:'authenticated',user_metadata:{},app_metadata:{provider:'email'},email_confirmed_at:'2026-10-28T00:00:00Z'};
const jwt=`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:fixtureUser.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.synthetic`;
const session={user:fixtureUser,access_token:jwt,refresh_token:'synthetic',expires_in:3600,token_type:'bearer'};
try{
  for(const locale of ['it','en'])for(const width of [375,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),calls=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await context.route('https://challenges.cloudflare.com/**',route=>route.fulfill({contentType:'application/javascript',body:`window.turnstile={render(el,options){window.qaCaptcha=options;setTimeout(()=>options.callback('synthetic-token'),0);return 'qa';},reset(){setTimeout(()=>window.qaCaptcha.callback('synthetic-token'),0)},remove(){}};`}));
    await context.route('https://auth-qa.invalid/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*'};
      if(request.method()==='OPTIONS')return route.fulfill({status:200,headers,body:''});
      calls.push({path:url.pathname,query:url.search,body:request.postDataJSON()});
      if(url.pathname.endsWith('/signup'))return route.fulfill({headers,json:{user:{...fixtureUser,email_confirmed_at:null},session:null}});
      if(url.pathname.endsWith('/otp'))return route.fulfill({headers,json:{}});
      if(url.pathname.endsWith('/token'))return route.fulfill({headers,json:session});
      if(url.pathname.endsWith('/user'))return route.fulfill({headers,json:fixtureUser});
      if(url.pathname.endsWith('/logout'))return route.fulfill({headers,json:{}});
      return route.fulfill({status:400,headers,json:{message:'Synthetic unexpected endpoint'}});
    });
    await page.goto(`${origin}/${locale}/`);await page.locator('.auth-trigger[aria-busy="false"]').waitFor();
    await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).first().click();
    await page.waitForTimeout(500); // Cookie modal exit transition must finish before visual capture.
    assert.equal(await page.locator('[data-auth-form]').count(),0);
    assert.equal(await page.locator('script[src*="challenges.cloudflare.com"]').count(),0);
    await page.screenshot({path:new URL(`login-home-${locale}-${width}.png`,output).pathname.replace(/^\/(.:)/,'$1'),fullPage:false});
    await page.locator('.auth-trigger').click();await page.waitForURL(`**/${locale}/login/**`);
    if(locale==='it'&&width===375){
      await page.goto(`${origin}/login/?redirect=%2Fit%2Fwishlist%2F`);
      await page.waitForURL('**/it/login/?redirect=%2Fit%2Fwishlist%2F');
      assert.equal(new URL(page.url()).searchParams.get('redirect'),'/it/wishlist/');
    }
    await page.locator('[data-login-mode="signup"]').click();
    await page.locator('#login-password').fill('synthetic password');
    for(const email of ['broken','person@gamil.com','person@playfine.com']){
      await page.locator('#login-email').fill(email);assert.equal(await page.locator('[data-login-submit]').isDisabled(),true);
    }
    assert.equal(calls.length,0,'Rejected inputs must not make Auth requests');
    await page.locator('#login-email').fill('person@gamil.com');await page.locator('[data-login-correct]').click();
    assert.equal(await page.locator('#login-email').inputValue(),'person@gmail.com');
    await page.locator('#login-email').fill('qa@libero.it');
    await page.evaluate(()=>window.qaCaptcha['expired-callback']());
    assert.equal(await page.locator('[data-login-submit]').isDisabled(),true);
    await page.evaluate(()=>window.qaCaptcha.callback('synthetic-token'));
    await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
    await page.waitForTimeout(250); // Allow Chromium to repaint after input-driven viewport scrolling.
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:new URL(`login-signup-${locale}-${width}.png`,output).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
    await page.locator('[data-login-submit]').click();
    await page.waitForFunction(()=>document.querySelector('#login-password').value==='');
    assert.equal(calls.filter(c=>c.path.endsWith('/signup')).length,1);
    const signup=calls.find(c=>c.path.endsWith('/signup')).body;
    assert.equal(signup.gotrue_meta_security.captcha_token,'synthetic-token');
    assert.equal(signup.data.marketing_consent,false);
    assert.equal(await page.locator('[data-login-account]').isHidden(),true,'Unconfirmed signup is not signed in');
    await page.reload();await page.locator('[data-login-recovery]').click();
    await page.locator('#login-email').fill('qa@libero.it');await page.locator('[data-login-submit]:enabled').waitFor();await page.locator('[data-login-submit]').click();
    await page.waitForFunction(()=>document.querySelector('[data-login-cooldown]').hidden===false);
    assert.equal(calls.find(c=>c.path.endsWith('/otp')).body.create_user,false);
    await page.goto(`${origin}/${locale}/login/?redirect=${encodeURIComponent(`/${locale}/wishlist/`)}`);
    await page.locator('#login-email').fill('qa@libero.it');await page.locator('#login-password').fill('synthetic password');
    await page.locator('[data-login-submit]:enabled').waitFor();await page.locator('[data-login-submit]').click();await page.waitForURL(`**/${locale}/wishlist/`);
    assert.equal(calls.filter(c=>c.path.endsWith('/token')).length,1);
    assert.equal(calls.filter(c=>c.path.endsWith('/otp')).length,1,'Password login sends no extra email');
    await page.goto(`${origin}/${locale}/login/`);
    await page.locator('[data-login-account]:visible').waitFor();
    assert.equal(await page.locator('[data-login-password-settings]').getAttribute('open'),null);
    await page.locator('[data-login-password-settings] summary').click();
    await page.locator('#account-password').fill('new synthetic password');
    await page.locator('[data-login-set-password] button').click();
    await page.waitForFunction(()=>document.querySelector('#account-password').value==='');
    assert.equal(calls.filter(c=>c.path.endsWith('/user')&&c.body?.password==='new synthetic password').length,1);
    await page.locator('.auth-trigger[aria-busy="false"]').click();
    await page.locator('[data-auth-signout]').click();await page.waitForURL(`**/${locale}/`);
    assert.equal(calls.filter(c=>c.path.endsWith('/logout')).length,1);
    assert.deepEqual(errors,[]);
    results.push({locale,width,passed:true,checks:['guest navigation','no home CAPTCHA','typo/disposable/syntax preflight','explicit correction','expired CAPTCHA','signup unconfirmed','existing-only Magic Link','password login without email','safe return','authenticated password setting','account dialog and signout'],externalEmailSent:false});
    await context.close();
  }
  await writeFile(new URL('./login-browser-results.json',import.meta.url),JSON.stringify({synthetic:true,results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
