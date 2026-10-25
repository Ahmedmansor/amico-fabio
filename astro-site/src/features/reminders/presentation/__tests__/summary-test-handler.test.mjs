import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSummaryTestHandler} from '../summary-test-handler.ts';
const userId='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const origin='http://127.0.0.1:4322';
const now=Date.parse('2026-10-24T00:00:00Z');
function fixture(overrides={}){
  const calls=[];
  const bearers=[];
  const options={senderForBearer:bearer=>{bearers.push(bearer);return {sendForUser:async(...args)=>{calls.push(args);return {status:'accepted',messageId:'<synthetic@example.test>'};}};},
    verifyUser:async()=>({ok:true,userId}),userId,deliveryId:other,locale:'en',allowedOrigin:origin,createdAt:now,expiresAt:now+20*60*1000,now:()=>now,bodyTimeoutMs:20,...overrides};
  return {calls,bearers,options,handler:createSummaryTestHandler(options)};
}
const request=(options={})=>new Request(origin+'/email-test',{method:'POST',headers:{Origin:origin,Authorization:'Bearer synthetic-test-token'},...options});

test('durable bilingual QA can stay open beyond provider TTL but sends each immutable language job once',async()=>{
  const records=new Map();
  const ledger={async claim(id,user,locale){const key=id+user+locale;if(records.has(key))return records.get(key);records.set(key,{outcome:'unknown'});return {outcome:'new'};},
    async finish(id,user,locale,status,messageId){records.set(id+user+locale,status==='accepted'?{outcome:'accepted',messageId}:{outcome:'unknown'});}};
  const itId='00000000-0000-4000-8000-000000000003';
  const f=fixture({jobs:{it:itId,en:other},ledger,expiresAt:now+24*60*60*1000});
  for(const locale of ['it','en','it','en']){
    const reply=await f.handler(request({headers:{Origin:origin,Authorization:'Bearer synthetic-test-token','Content-Type':'application/json'},body:JSON.stringify({locale})}));
    assert.equal(reply.status,200);assert.equal((await reply.json()).locale,locale);
  }
  assert.deepEqual(f.calls,[[userId,'it',itId],[userId,'en',other]]);
  assert.throws(()=>fixture({jobs:{it:other,en:other},ledger}));
});
test('durable QA never retries an ambiguous send or overwrites its language identity',async()=>{
  let claimed=false,sends=0;
  const ledger={async claim(){if(claimed)return {outcome:'unknown'};claimed=true;return {outcome:'new'};},async finish(){}};
  const f=fixture({ledger,senderForBearer:()=>({sendForUser:async()=>{sends++;return {status:'unknown'};}})});
  assert.equal((await f.handler(request())).status,503);assert.equal((await f.handler(request())).status,503);assert.equal(sends,1);
});
test('legacy empty requests use fixed owner/default locale/delivery ID without recipient input',async()=>{
  const f=fixture();for(let attempt=0;attempt<2;attempt++)assert.equal((await f.handler(request())).status,200);
  assert.deepEqual(f.calls,[[userId,'en',other],[userId,'en',other]]);
  assert.deepEqual(f.bearers,['synthetic-test-token','synthetic-test-token']);
});
test('wrong identity, missing bearer, wrong origin or arbitrary body never reaches sender',async()=>{
  const f=fixture();
  assert.equal((await f.handler(request({headers:{Origin:'https://untrusted.test',Authorization:'Bearer synthetic-test-token'}}))).status,403);
  assert.equal((await f.handler(request({headers:{Origin:origin}}))).status,401);
  assert.equal((await f.handler(request({body:JSON.stringify({recipient:'other@example.test'})}))).status,415);
  assert.equal(f.calls.length,0);
  assert.equal(f.bearers.length,0);
  const otherAccount=fixture({verifyUser:async()=>({ok:true,userId:other})});assert.equal((await otherAccount.handler(request())).status,403);assert.equal(otherAccount.calls.length,0);
});
test('page language reaches its matching configured job; owner and delivery identity stay fixed',async()=>{
  for(const locale of ['it','en']){
    const f=fixture({locale});
    const response=await f.handler(request({headers:{Origin:origin,Authorization:'Bearer synthetic-test-token','Content-Type':'application/json'},body:JSON.stringify({locale})}));
    assert.equal(response.status,200);assert.equal((await response.json()).locale,locale);
    assert.deepEqual(f.calls,[[userId,locale,other]]);
  }
});
test('one immutable job cannot accept two content languages under the same provider key',async()=>{
  const f=fixture();
  const response=await f.handler(request({headers:{Origin:origin,Authorization:'Bearer synthetic-test-token','Content-Type':'application/json'},body:JSON.stringify({locale:'it'})}));
  assert.equal(response.status,409);assert.deepEqual(await response.json(),{error:'job-locale-mismatch',locale:'en'});
  assert.equal(f.calls.length,0);assert.equal(f.bearers.length,0);
});
test('invalid/oversized language payloads cannot supply identity, consent, recipients or another job',async()=>{
  const f=fixture();
  const headers={Origin:origin,Authorization:'Bearer synthetic-test-token','Content-Type':'application/json'};
  for(const body of [null,[],{}, {locale:'fr'}, {locale:'it',recipient:'other@example.test'},
    {locale:'it',userId:other},{locale:'en',deliveryId:userId},{locale:'it',enabled:true}])
    assert.equal((await f.handler(request({headers,body:JSON.stringify(body)}))).status,400);
  assert.equal((await f.handler(request({headers,body:'x'.repeat(257)}))).status,413);
  assert.equal(f.calls.length,0);assert.equal(f.bearers.length,0);
});
test('expired/future/invalid-time jobs cannot send; job window must stay below Brevo deduplication TTL',async()=>{
  for(const time of [now-1,now+20*60*1000,NaN]){const f=fixture({now:()=>time});assert.equal((await f.handler(request())).status,410);assert.equal(f.calls.length,0);}
  assert.throws(()=>fixture({expiresAt:now+30*60*1000}),/bounded/);
});
test('preflight never sends and ambiguous provider results are not reported as delivered',async()=>{
  const f=fixture();const response=await f.handler(request({method:'OPTIONS'}));assert.equal(response.status,204);assert.equal(f.calls.length,0);
  const unknown=fixture({senderForBearer:()=>({sendForUser:async()=>({status:'unknown'})})});const result=await unknown.handler(request());assert.equal(result.status,503);assert.deepEqual(await result.json(),{status:'unknown'});
});

test('each verified request gets its own bearer-bound sender without sharing tokens',async()=>{
  const f=fixture();
  await Promise.all(['first-synthetic-token','second-synthetic-token'].map(token=>f.handler(request({headers:{Origin:origin,Authorization:`Bearer ${token}`}}))));
  assert.deepEqual(f.bearers.sort(),['first-synthetic-token','second-synthetic-token']);
  const denied=fixture({verifyUser:async()=>({ok:true,userId:other})});
  await denied.handler(request());assert.equal(denied.bearers.length,0);
});

test('empty POST stream is accepted, nonempty or stalled body never sends',async()=>{
  const empty=fixture();assert.equal((await empty.handler(request({duplex:'half',body:new ReadableStream({start(controller){controller.close();}})}))).status,200);
  const stalled=fixture();assert.equal((await stalled.handler(request({duplex:'half',body:new ReadableStream({start(){}})}))).status,408);assert.equal(stalled.calls.length,0);
});
