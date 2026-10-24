import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreferenceHandler} from '../preferences-handler.ts';
import {createPreferenceService} from '../../data/preferences-service.ts';
import {createPreferenceUserVerifier} from '../../data/preference-user.ts';
import {reminderConsentVersion} from '../../domain/preferences.ts';
const userId='00000000-0000-4000-8000-000000000001';
const origin='http://127.0.0.1:4322';
const body={requestId:'00000000-0000-4000-8000-000000000002',enabled:true,locale:'en',wordingVersion:reminderConsentVersion};
function fixture(){
  const calls=[];
  const repository={read:async id=>{calls.push(['read',id]);return {ok:true,value:null};},change:async(id,command)=>{calls.push(['change',id,command]);return {ok:true,value:{enabled:command.enabled}};}};
  const options={service:createPreferenceService(repository),verifyUser:async token=>token==='synthetic-test-token'?{ok:true,userId}:{ok:false,reason:'unauthenticated'},allowedOrigins:[origin],maxBodyBytes:1024};
  return {calls,options,handle:createPreferenceHandler(options)};
}
const request=(method='GET',value=undefined,headers={})=>new Request(origin+'/preferences',{
  method,headers:{Origin:origin,Authorization:'Bearer synthetic-test-token',...(value===undefined?{}:{'Content-Type':'application/json'}),...headers},
  ...(value===undefined?{}:{body:typeof value==='string'?value:JSON.stringify(value)}),
});
test('verified GET is read-only; PATCH binds identity from the verifier, never the request',async()=>{
  const f=fixture();assert.equal((await f.handle(request())).status,200);
  assert.deepEqual(f.calls,[['read',userId]]);
  const response=await f.handle(request('PATCH',body));assert.equal(response.status,200);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.deepEqual(f.calls[1],['change',userId,body]);
});
test('rejects unauthorized origins, missing identity and forged ownership without writes',async()=>{
  const f=fixture();
  assert.equal((await f.handle(request('PATCH',body,{Origin:'https://untrusted.test'}))).status,403);
  assert.equal((await f.handle(request('GET',undefined,{Authorization:''}))).status,401);
  assert.equal((await f.handle(request('PATCH',{...body,userId:'someone-else'}))).status,400);
  assert.deepEqual(f.calls,[]);
});
test('bounded parsing, wrong content types and stale consent never write',async()=>{
  const f=fixture();
  assert.equal((await f.handle(request('PATCH','not-json'))).status,400);
  assert.equal((await f.handle(request('PATCH',body,{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await f.handle(request('PATCH','a'.repeat(1025)))).status,413);
  assert.equal((await f.handle(request('PATCH',{...body,wordingVersion:'old'}))).status,409);
  assert.deepEqual(f.calls,[]);
});
test('preflight requires no token; provider outage does not become successful subscription',async()=>{
  const f=fixture();assert.equal((await f.handle(request('OPTIONS'))).status,204);
  const outage=createPreferenceHandler({...f.options,verifyUser:async()=>({ok:false,reason:'unavailable'})});
  assert.equal((await outage(request('PATCH',body))).status,503);assert.deepEqual(f.calls,[]);
  assert.throws(()=>createPreferenceHandler({...f.options,allowedOrigins:['*']}),/origins/);
});
test('Auth adapter uses remote getUser and discards metadata; no local JWT-only trust',async()=>{
  const seen=[];
  const verifier=createPreferenceUserVerifier({auth:{getUser:async token=>{seen.push(token);return {data:{user:{id:userId,user_metadata:{user_id:'attacker'}}},error:null};}}});
  assert.deepEqual(await verifier('synthetic-test-token'),{ok:true,userId});
  assert.deepEqual(seen,['synthetic-test-token']);
  const expired=createPreferenceUserVerifier({auth:{getUser:async()=>({data:{user:null},error:{status:401}})}});
  assert.deepEqual(await expired('expired-test-token'),{ok:false,reason:'unauthenticated'});
});
