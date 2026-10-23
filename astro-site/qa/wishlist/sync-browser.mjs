import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4330';
const html=await(await fetch(`${origin}/en/wishlist/`)).text();
const bootstrap=JSON.parse(html.match(/<script[^>]*id="wishlist-config"[^>]*>([\s\S]*?)<\/script>/)?.[1]||'null');
assert.ok(bootstrap,'Run on the isolated enabled synthetic sync server');
assert.equal(bootstrap.auth.url,'https://auth-qa.invalid');
const [first,second,third]=bootstrap.publishedIds;
assert.ok(first&&second&&third);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
const userId='00000000-0000-4000-8000-000000000001';
const account=id=>({id,email:'synthetic@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'google',providers:['google']},user_metadata:{full_name:'Alex Example'},created_at:'2026-10-23T00:00:00Z'});
function token(id){return `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)})).toString('base64url')}.synthetic_signature`;}
function session(id){return {access_token:token(id),refresh_token:'synthetic_refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:account(id)};}
async function seed(context,id,guestIds=[]){
  await context.addInitScript(({session,guestIds})=>{
    if(session && !localStorage.getItem('qa:seeded')){localStorage.setItem('fabio:auth:session:v1',JSON.stringify(session));for(const id of guestIds)localStorage.setItem('fabio:wishlist:v1:trip:'+encodeURIComponent(id),'1');localStorage.setItem('qa:seeded','1');}
  },{session:id?session(id):null,guestIds});
}
async function mock(context,backend){
  await context.route('https://auth-qa.invalid/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    const headers={'access-control-allow-origin':origin,'access-control-allow-headers':'*'};
    if(request.method()==='OPTIONS')return route.fulfill({status:200,headers,body:''});
    let id=null;try{id=JSON.parse(Buffer.from((request.headers().authorization||'').split('.')[1],'base64url')).sub;}catch{}
    if(url.pathname.endsWith('/user'))return route.fulfill({status:200,headers,json:account(id||userId)});
    if(url.pathname.endsWith('/logout'))return route.fulfill({status:204,headers,body:''});
    if(url.pathname==='/rest/v1/profiles'){
      if(backend.missingSchema)return route.fulfill({status:404,headers,json:{code:'PGRST205',message:'synthetic missing schema'}});
      backend.profileWrites++;return route.fulfill({status:201,headers,body:''});
    }
    if(url.pathname==='/rest/v1/wishlists'){
      const key=url.searchParams.get('user_id')?.replace(/^eq\./,'');
      if(request.method()==='GET'){
        assert.equal(key,id,'Account reads filter the authenticated identity');
        const cursor=url.searchParams.get('trip_id')?.replace(/^gt\./,'');
        const rows=(backend.rows.get(id)||[]).filter(value=>!cursor || value>cursor).sort().slice(0,Math.min(Number(url.searchParams.get('limit')||200),backend.pageCap||200));
        backend.reads++;return route.fulfill({status:200,headers,json:rows.map(trip_id=>({trip_id}))});
      }
      if(request.method()==='POST'){
        if(backend.failNext){backend.failNext=false;return route.fulfill({status:503,headers,json:{message:'synthetic failure'}});}
        if(backend.gate)await backend.gate;
        for(const row of request.postDataJSON()){
          assert.equal(row.user_id,id);assert.equal('added_at' in row,false);
          backend.rows.set(id,[...new Set([...(backend.rows.get(id)||[]),row.trip_id])]);
        }
        return route.fulfill({status:201,headers,body:''});
      }
      if(request.method()==='DELETE'){
        assert.equal(key,id);const removed=url.searchParams.get('trip_id')?.replace(/^eq\./,'');
        backend.rows.set(id,(backend.rows.get(id)||[]).filter(value=>value!==removed));
        return route.fulfill({status:204,headers,body:''});
      }
    }
    throw new Error('Unexpected synthetic endpoint: '+url.pathname);
  });
}
async function count(page,value){await page.waitForFunction(value=>document.querySelector('[data-wishlist-count]')?.textContent===String(value),value);await page.locator('[data-wishlist-count]').waitFor({state:'visible'});}
await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
try{
  for(const locale of ['it','en'])for(const width of [375,1440]){
    const backend={rows:new Map([[userId,[first]]]),reads:0,profileWrites:0,pageCap:1};
    const context=await browser.newContext({viewport:{width,height:900}});await mock(context,backend);await seed(context,userId,[second]);
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${origin}/${locale}/wishlist/`);
    await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
    await count(page,2);assert.deepEqual(new Set(backend.rows.get(userId)),new Set([first,second]));
    assert.equal(await page.locator('[data-wishlist-invitation]').isVisible(),false);
    await page.reload();await count(page,2);assert.equal(backend.rows.get(userId).length,2);
    await page.locator(`[data-wishlist-item][data-trip-id="${first}"] [data-favorite]`).click();await count(page,1);
    assert.deepEqual(backend.rows.get(userId),[second]);
    const device=await browser.newContext();await mock(device,backend);await seed(device,userId);
    const other=await device.newPage();await other.goto(`${origin}/${locale}/wishlist/`);await count(other,1);await device.close();
    const sameBrowser=await context.newPage();await sameBrowser.goto(`${origin}/${locale}/wishlist/`);await count(sameBrowser,1);
    await page.bringToFront();
    await page.goto(`${origin}/${locale}/explore/`);await count(page,1);
    const unsaved=page.locator(`[data-favorite-id="${third}"]`);await unsaved.waitFor({state:'visible'});
    backend.failNext=true;await unsaved.click();
    await unsaved.locator('..').locator('[data-favorite-error]').waitFor({state:'visible'});
    assert.equal(await unsaved.getAttribute('aria-pressed'),'false');await count(page,1);
    await unsaved.click();await count(page,2);assert.equal(await unsaved.getAttribute('aria-pressed'),'true');
    await count(sameBrowser,2);await sameBrowser.close();
    await page.evaluate(()=>localStorage.setItem('fabio:wishlist:v1:trip:unpublished_fixture','1'));
    await page.goto(`${origin}/${locale}/wishlist/`);await count(page,2);
    assert.equal(await page.locator('[data-wishlist-sync-retry]').isVisible(),false);
    assert.equal(await page.locator('[data-wishlist-catalog-notice]').isVisible(),true);
    await page.screenshot({path:new URL(`./screenshots/sync-${locale}-${width}.png`,import.meta.url).pathname.slice(1)});
    await page.locator('#global-header [data-auth-open]').click();await page.locator('[data-auth-signout]').click();
    await count(page,1);assert.ok(await page.evaluate(()=>localStorage.getItem('fabio:wishlist:v1:trip:unpublished_fixture')));
    assert.equal(await page.locator('.auth-trigger-avatar img').getAttribute('src'),null);
    assert.deepEqual(errors,[]);results.push({locale,width,merge:true,deduplicated:true,remove:true,secondDevice:true,crossTab:true,serverSmallCap:true,writeFailure:true,retry:true,unpublishedRetained:true,signout:true,noPageErrors:true});
    await context.close();
  }
  const backend={rows:new Map([[userId,[first]]]),reads:0,profileWrites:0,missingSchema:true};
  const context=await browser.newContext();await mock(context,backend);await seed(context,userId,[second]);
  const page=await context.newPage();await page.goto(`${origin}/en/wishlist/`);
  await page.locator('[data-wishlist-error]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-wishlist-link]').getAttribute('aria-busy'),'false');
  assert.equal(await page.evaluate(id=>localStorage.getItem('fabio:wishlist:v1:trip:'+id),second),'1');
  backend.missingSchema=false;await page.locator('[data-wishlist-sync-retry]').click();await count(page,2);
  await context.close();
  await writeFile(new URL('./sync-results.json',import.meta.url),JSON.stringify({mode:'synthetic-only-no-remote-writes',cases:results,missingSchemaRecovery:true},null,2)+'\n');
  console.log('Account wishlist browser: 4 language/viewport cases passed; merge, duplicate retry, second device, edits, write failure, signout, retained unavailable items and missing-schema recovery.');
}finally{await browser.close();}
