// Real bundled SDK, synthetic local sessions, and fully intercepted external traffic.
// No real credentials, sign-in, account operation or email is used.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
const output=new URL('./screenshots/stable-icon/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
try{
  for(const signedIn of [false,true]){
    const context=await browser.newContext({viewport:{width:375,height:850},reducedMotion:'reduce'});
    if(signedIn)await context.addInitScript(()=>{
      if(localStorage.getItem('qa:seeded'))return;
      const expires=Math.floor(Date.now()/1000)+3600;
      const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',app_metadata:{provider:'google'},user_metadata:{full_name:'Local QA',avatar_url:'https://lh3.googleusercontent.com/qa-stable-avatar'},created_at:'2026-01-01T00:00:00Z'};
      const encode=value=>btoa(JSON.stringify(value)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
      const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,exp:expires,role:'authenticated'})+'.synthetic';
      localStorage.setItem('fabio:auth:session:v1',JSON.stringify({access_token:token,refresh_token:'synthetic-only',token_type:'bearer',expires_at:expires,expires_in:3600,user}));
      localStorage.setItem('qa:seeded','1');
    });
    const page=await context.newPage(),authRequests=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    let releaseScripts,scriptGate,releaseImage;
    let imageGate=new Promise(resolve=>{releaseImage=resolve;});
    await page.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.origin!==origin){
        if(url.pathname.startsWith('/auth/v1/'))authRequests.push(url.pathname);
        if(url.href==='https://lh3.googleusercontent.com/qa-stable-avatar'){
          await imageGate;return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="orange"/></svg>'});
        }
        return route.abort();
      }
      if(request.resourceType()==='document'){
        const response=await route.fetch();let body=await response.text();
        body=body.replace(/(<script[^>]*id="auth-config"[^>]*>)([\s\S]*?)(<\/script>)/,(_whole,start,json,end)=>{
          const data=JSON.parse(json);data.config.siteOrigin=origin;
          data.config.url='https://auth.synthetic.invalid';data.config.publishableKey='sb_publishable_synthetic_qa';
          return start+JSON.stringify(data).replaceAll('<','\\u003c')+end;
        });
        return route.fulfill({response,body});
      }
      if(request.resourceType()==='script'&&url.pathname.includes('/_astro/'))await scriptGate;
      return route.continue();
    });
    for(const [index,path]of ['/en/','/en/explore/','/en/tours/ras_mohammed_bus_half_day/'].entries()){
      scriptGate=new Promise(resolve=>{releaseScripts=resolve;});
      await page.goto(origin+path,{waitUntil:'commit'});
      const trigger=page.locator('#global-header .auth-trigger'),fallback=trigger.locator('[data-auth-avatar-fallback]'),image=trigger.locator('img');
      await fallback.waitFor({state:'visible'});assert.equal(await trigger.getAttribute('aria-busy'),'true');
      const box=await trigger.boundingBox();
      await trigger.screenshot({path:fileURLToPath(new URL(`${signedIn?'account':'guest'}-${index}-before.png`,output))});
      releaseScripts();await page.waitForFunction(()=>document.querySelector('#global-header .auth-trigger')?.getAttribute('aria-busy')==='false');
      if(signedIn){
        if(index===0){assert(await fallback.isVisible(),'Keep icon while avatar downloads');assert.equal(await image.isVisible(),false);releaseImage();}
        await image.waitFor({state:'visible'});assert.equal(await fallback.isVisible(),false);
      }else assert(await fallback.isVisible());
      assert.deepEqual(await trigger.boundingBox(),box);assert.deepEqual(authRequests,[]);
      await trigger.screenshot({path:fileURLToPath(new URL(`${signedIn?'account':'guest'}-${index}-ready.png`,output))});
      results.push({signedIn,path,visibleBeforeScripts:true,stableGeometry:true,authNetworkRequests:authRequests.length,restoredFromLocalStorage:signedIn});
    }
    if(signedIn){
      imageGate=Promise.resolve();
      await page.route('https://lh3.googleusercontent.com/qa-stable-avatar',route=>route.abort());
      await page.reload();await fallbackVisible(page);
      results.push({avatarFailureFallback:true});
    }
    assert.deepEqual(errors,[]);await context.close();
  }
  await writeFile(new URL('./stable-icon-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
  console.log('Account icon: 7 focused cases passed; static fallback, three-page navigation for guest/signed-in synthetic sessions, delayed/failed avatar, stable geometry, ZERO Auth HTTP requests with a valid stored session.');
}finally{await browser.close();}
async function fallbackVisible(page){await page.waitForFunction(()=>document.querySelector('#global-header .auth-trigger')?.getAttribute('aria-busy')==='false');await page.locator('#global-header [data-auth-avatar-fallback]').waitFor({state:'visible'});}
