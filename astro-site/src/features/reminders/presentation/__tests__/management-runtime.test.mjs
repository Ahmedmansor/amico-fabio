import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {readManagementRuntimeConfig,createManagementIngress} from '../../data/management-runtime-config.ts';
import {createPreferenceFetch} from '../../data/preference-runtime-config.ts';
import {createManagementRuntime} from '../management-runtime.ts';
const origin='http://127.0.0.1:4322',token='a'.repeat(64);
// Synthetic test limits only; not deployment settings.
const env={WISHLIST_MANAGEMENT_ALLOWED_ORIGINS:origin,WISHLIST_MANAGEMENT_INGRESS_LIMIT:'2',WISHLIST_MANAGEMENT_INGRESS_WINDOW_SECONDS:'60',
  WISHLIST_MANAGEMENT_MAX_BODY_BYTES:'1024',WISHLIST_MANAGEMENT_BODY_TIMEOUT_MS:'10',WISHLIST_MANAGEMENT_NETWORK_TIMEOUT_MS:'100',WISHLIST_MANAGEMENT_MAX_UPSTREAM_BYTES:'4096'};
const config=()=>readManagementRuntimeConfig(name=>env[name]);
const request=()=>new Request(origin+'/management',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',
  'X-Forwarded-For':'forged-client','X-Real-IP':'also-forged'},body:JSON.stringify({token,command:{operation:'read'}})});
function fixture(limit={allowed:true,retry_after_seconds:0}){
  const calls=[];const client=createClient('https://management-runtime-qa.invalid','sb_secret_synthetic',{
    auth:{persistSession:false,autoRefreshToken:false},global:{fetch:createPreferenceFetch(async(url,init)=>{
      const path=new URL(url).pathname,body=JSON.parse(init.body);calls.push({path,body});
      if(path.endsWith('/consume_wishlist_management_limit'))return Response.json([limit]);
      if(path.endsWith('/manage_wishlist_correspondence'))return Response.json([{enabled:false,locale:'it',revision:0,conflict:false}]);
      throw new Error('Unexpected path.');
    },100,4096)}});
  return {calls,handle:createManagementRuntime(client,config())};
}
test('runtime gates all lookups with one fixed distributed budget, ignoring caller identity headers',async()=>{
  const f=fixture(),response=await f.handle(request());assert.equal(response.status,200);
  assert.deepEqual(f.calls.map(call=>call.path),['/rest/v1/rpc/consume_wishlist_management_limit','/rest/v1/rpc/manage_wishlist_correspondence']);
  assert.deepEqual(f.calls[0].body,{p_limit:2,p_window_seconds:60});
  assert.notEqual(f.calls[1].body.p_token_hash,token);assert.equal(JSON.stringify(f.calls).includes('forged-client'),false);
});
test('limited or broken ingress never looks up a capability and distinguishes 429 from outage',async()=>{
  for(const [row,status]of [[{allowed:false,retry_after_seconds:20},429],[{allowed:false,retry_after_seconds:0},503],[{allowed:true,retry_after_seconds:1},503]]){
    const f=fixture(row);assert.equal((await f.handle(request())).status,status);assert.equal(f.calls.length,1);
  }
});
test('policy is mandatory and public remote origins cannot use insecure HTTP',()=>{
  for(const changed of [{WISHLIST_MANAGEMENT_INGRESS_LIMIT:''},{WISHLIST_MANAGEMENT_INGRESS_LIMIT:'0'},
    {WISHLIST_MANAGEMENT_INGRESS_WINDOW_SECONDS:'1.5'},{WISHLIST_MANAGEMENT_ALLOWED_ORIGINS:'http://remote.invalid'}])
    assert.throws(()=>readManagementRuntimeConfig(name=>({...env,...changed})[name]));
});
test('ingress deadline aborts a stalled upstream instead of leaving an admission request pending',async()=>{
  let signal;const client={rpc(){return {abortSignal(value){signal=value;return new Promise((_resolve,reject)=>value.addEventListener('abort',()=>reject(new Error('aborted'))));}};}};
  await assert.rejects(createManagementIngress(client,{...config(),networkTimeoutMs:5}).take());assert.equal(signal.aborted,true);
});
test('disabled Edge entry reads no runtime keys and fails closed',async()=>{
  const previous=globalThis.Deno;let reads=0,handler;
  globalThis.Deno={env:{get(){reads++;throw new Error('must not read');}},serve(value){handler=value;}};
  try{await import('../../../../../supabase/functions/wishlist-email-management/index.mjs');
    assert.equal(reads,0);assert.equal((await handler(request())).status,503);
  }finally{if(previous===undefined)delete globalThis.Deno;else globalThis.Deno=previous;}
});
