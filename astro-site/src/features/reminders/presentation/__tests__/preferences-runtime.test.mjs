import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createPreferenceRuntime} from '../preferences-runtime.ts';
import {readPreferenceRuntimeConfig,createPreferenceFetch} from '../../data/preference-runtime-config.ts';
import {createPreferenceLimiter} from '../../data/preference-limiter.ts';
import {createPreferenceUserVerifier} from '../../data/preference-user.ts';
const a='00000000-0000-4000-8000-000000000001';
const requestId='00000000-0000-4000-8000-000000000002';
const origin='http://127.0.0.1:4322';
const row={enabled:true,locale:'en',wording_version:'wishlist-reminders-v1',updated_at:'2026-10-24T00:00:00Z',enabled_since:'2026-10-24T00:00:00Z'};
// Test values only; not deployment quotas.
const env={REMINDER_PREFERENCE_ALLOWED_ORIGINS:origin,REMINDER_PREFERENCE_READ_LIMIT:'2',REMINDER_PREFERENCE_READ_WINDOW_SECONDS:'60',
  REMINDER_PREFERENCE_WRITE_LIMIT:'1',REMINDER_PREFERENCE_WRITE_WINDOW_SECONDS:'60',REMINDER_PREFERENCE_MAX_BODY_BYTES:'1024',
  REMINDER_PREFERENCE_NETWORK_TIMEOUT_MS:'100',REMINDER_PREFERENCE_BODY_TIMEOUT_MS:'20',REMINDER_PREFERENCE_MAX_UPSTREAM_BYTES:'4096'};
const config=()=>readPreferenceRuntimeConfig(key=>env[key]);
const request=(method='GET',body)=>new Request(origin+'/preferences',{method,headers:{Origin:origin,Authorization:'Bearer synthetic-user-token',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const command={requestId,enabled:true,locale:'en',wordingVersion:'wishlist-reminders-v1'};
function fixture({limit={allowed:true,retry_after_seconds:0},authStatus=200,limitOutage=false}={}){
  const calls=[];
  const fetcher=async(url,init)=>{
    const path=new URL(url).pathname;calls.push({path,headers:new Headers(init.headers),body:init.body?JSON.parse(init.body):undefined});
    if(path==='/auth/v1/user')return Response.json(authStatus===200?{id:a,user_metadata:{user_id:'attacker'}}:{msg:'Synthetic Auth failure'},{status:authStatus});
    if(path==='/rest/v1/rpc/consume_wishlist_preference_limit')return limitOutage?Response.json({message:'private provider error'},{status:503}):Response.json([limit]);
    if(path==='/rest/v1/rpc/change_wishlist_email_preference_v2')return Response.json([row]);
    if(path==='/rest/v1/wishlist_email_preferences')return Response.json(row);
    throw new Error('Unexpected network path.');
  };
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:createPreferenceFetch(fetcher,100,4096)}};
  const authClient=createClient('https://runtime-qa.invalid','sb_publishable_synthetic',options);
  const backendClient=createClient('https://runtime-qa.invalid','sb_secret_synthetic',options);
  return {calls,handle:createPreferenceRuntime({authClient,backendClient,config:config()})};
}

test('runtime authenticates before shared limiter, binds ownership, and isolates backend credentials',async()=>{
  const f=fixture();const response=await f.handle(request('PATCH',command));assert.equal(response.status,200);
  assert.deepEqual(f.calls.map(call=>call.path),['/auth/v1/user','/rest/v1/rpc/consume_wishlist_preference_limit','/rest/v1/rpc/change_wishlist_email_preference_v2']);
  assert.equal(f.calls[0].headers.get('Authorization'),'Bearer synthetic-user-token');
  for(const call of f.calls.slice(1)){
    assert.equal(call.headers.get('apikey'),'sb_secret_synthetic');
    assert.notEqual(call.headers.get('Authorization'),'Bearer synthetic-user-token');
    assert.equal(call.body.p_user_id,a);
  }
  assert.equal(f.calls[1].body.p_operation,'write');assert.equal(f.calls[1].body.p_limit,1);
  assert.equal((await response.json()).preference.enabled,true);
});

test('read is read-only and uses its own configured quota',async()=>{
  const f=fixture();assert.equal((await f.handle(request())).status,200);
  assert.equal(f.calls[1].body.p_operation,'read');assert.equal(f.calls[1].body.p_limit,2);
  assert.equal(f.calls[2].path,'/rest/v1/wishlist_email_preferences');
});

test('denied or unavailable limiter blocks both data reads and writes with no local fallback',async()=>{
  for(const method of ['GET','PATCH']){
    const f=fixture({limit:{allowed:false,retry_after_seconds:17}});
    const response=await f.handle(request(method,method==='PATCH'?command:undefined));
    assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'17');assert.equal(f.calls.length,2);
  }
  const f=fixture({limitOutage:true});const response=await f.handle(request('PATCH',command));
  assert.equal(response.status,503);assert.equal(f.calls.length,2);assert.deepEqual(await response.json(),{error:'unavailable'});
});

test('Auth failures never reach limiter; Auth 429 is unavailable rather than a false signout',async()=>{
  const expired=fixture({authStatus:401});assert.equal((await expired.handle(request())).status,401);assert.equal(expired.calls.length,1);
  const throttled=fixture({authStatus:429});assert.equal((await throttled.handle(request())).status,503);assert.equal(throttled.calls.length,1);
  const verifier=createPreferenceUserVerifier({auth:{getUser:async()=>({data:{user:null},error:{status:429}})}});
  assert.deepEqual(await verifier('synthetic-token'),{ok:false,reason:'unavailable'});
});

test('stalled incoming body times out without preference mutation',async()=>{
  const f=fixture();const body=new ReadableStream({start(){}});
  const response=await f.handle(new Request(origin+'/preferences',{method:'PATCH',duplex:'half',body,headers:{Origin:origin,Authorization:'Bearer synthetic-user-token','Content-Type':'application/json'}}));
  assert.equal(response.status,408);assert.equal(f.calls.length,2);
});

test('upstream deadline includes response body, enforces size and preserves caller cancellation',async()=>{
  const stalled=createPreferenceFetch(async()=>new Response(new ReadableStream({start(){}})),10,100);
  await assert.rejects(()=>stalled('https://runtime-qa.invalid'),/timed out/);
  const large=createPreferenceFetch(async()=>Response.json({large:'x'.repeat(100)}),100,10);
  await assert.rejects(()=>large('https://runtime-qa.invalid'),/too large/);
  const controller=new AbortController();controller.abort();let observed;
  const cancelled=createPreferenceFetch(async(_url,init)=>{observed=init.signal;return Response.json({});},100,100);
  await cancelled('https://runtime-qa.invalid',{signal:controller.signal});assert.equal(observed.aborted,true);
});

test('invalid limiter replies fail closed; missing configuration never supplies silent defaults',async()=>{
  for(const row of [{allowed:false,retry_after_seconds:0},{allowed:false,retry_after_seconds:61},{allowed:true,retry_after_seconds:3}]){
    const limiter=createPreferenceLimiter({rpc:async()=>({data:[row],error:null})},config().ratePolicy);
    assert.deepEqual(await limiter.take(a,'read'),{status:'unavailable'});
  }
  for(const missing of Object.keys(env))assert.throws(()=>readPreferenceRuntimeConfig(key=>key===missing?undefined:env[key]));
  assert.throws(()=>readPreferenceRuntimeConfig(key=>key==='REMINDER_PREFERENCE_ALLOWED_ORIGINS'?'*':env[key]));
  assert.throws(()=>readPreferenceRuntimeConfig(key=>key==='REMINDER_PREFERENCE_ALLOWED_ORIGINS'?'http://remote.test':env[key]));
});

test('approved entry fails closed when injected Supabase bindings are absent',async()=>{
  const previous=globalThis.Deno;let handler,reads=0;
  globalThis.Deno={env:{get(){reads++;return undefined;}},serve(value){handler=value;}};
  try{
    await import('../../../../../supabase/functions/wishlist-email-preferences/index.mjs');
    assert.ok(reads>0);assert.equal(typeof handler,'function');
    const response=await handler(request());assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{error:'unavailable'});
  }finally{if(previous===undefined)delete globalThis.Deno;else globalThis.Deno=previous;}
});
