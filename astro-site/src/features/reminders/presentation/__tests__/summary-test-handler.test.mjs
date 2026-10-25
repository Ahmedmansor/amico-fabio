import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSummaryTestHandler} from '../summary-test-handler.ts';
const userId='00000000-0000-4000-8000-000000000001',enId='00000000-0000-4000-8000-000000000002',itId='00000000-0000-4000-8000-000000000003';
const origin='http://127.0.0.1:4322',now=Date.parse('2026-10-25T00:00:00Z');
function fixture(overrides={}){
 const calls=[];
 const options={senderForBearer:()=>({sendForUser:async(...args)=>{calls.push(args);return {status:'accepted',messageId:'synthetic'};}}),
 readPreference:async()=>({enabled:true,locale:'it'}),verifyUser:async()=>({ok:true,userId}),userId,deliveryId:enId,locale:'en',jobs:{it:itId,en:enId},
 allowedOrigin:origin,createdAt:now,expiresAt:now+1200000,now:()=>now,bodyTimeoutMs:20,...overrides};
 return {calls,handler:createSummaryTestHandler(options)};
}
const request=(options={})=>new Request(origin+'/test',{method:'POST',headers:{Origin:origin,Authorization:'Bearer synthetic'},...options});
test('saved language wins over the English test configuration; invalid saved locale falls back to Italian',async()=>{
 for(const [saved,expected,id] of [['it','it',itId],['en','en',enId],['de','it',itId],[null,'it',itId]]){
 const f=fixture({readPreference:async()=>({enabled:true,locale:saved})});
 const r=await f.handler(request());assert.equal(r.status,200);assert.equal((await r.json()).locale,expected);assert.deepEqual(f.calls,[[userId,expected,id]]);
 }
});
test('browser cannot override language, recipient, identity, job or consent',async()=>{
 const f=fixture(),headers={Origin:origin,Authorization:'Bearer synthetic','Content-Type':'application/json'};
 for(const body of [{locale:'en'},{userId:enId},{recipient:'other@example.test'},{enabled:true},[],null])assert.equal((await f.handler(request({headers,body:JSON.stringify(body)}))).status,400);
 assert.equal((await f.handler(request({headers,body:'x'.repeat(257)}))).status,413);assert.equal(f.calls.length,0);
});
test('disabled consent blocks; database failure never silently chooses a language',async()=>{
 for(const pref of [null,{enabled:false,locale:'it'}]){const f=fixture({readPreference:async()=>pref});const r=await f.handler(request());assert.equal(r.status,409);assert.equal((await r.json()).error,'reminder-disabled');assert.equal(f.calls.length,0);}
 const f=fixture({readPreference:async()=>{throw Error('outage');}});assert.equal((await f.handler(request())).status,503);assert.equal(f.calls.length,0);
});
test('repeat explicitly reports no new email; each saved language has a separate immutable job',async()=>{
 const records=new Map();let saved='it';
 const ledger={async claim(id){return records.get(id)??{outcome:'new'};},async finish(id,_user,_locale,status,messageId){records.set(id,status==='accepted'?{outcome:'accepted',messageId}:{outcome:'unknown'});}};
 const f=fixture({ledger,expiresAt:now+86400000,readPreference:async()=>({enabled:true,locale:saved})});
 for(const locale of ['it','en']){saved=locale;assert.equal((await (await f.handler(request())).json()).status,'accepted');assert.deepEqual(await (await f.handler(request())).json(),{status:'already-sent',locale});}
 assert.deepEqual(f.calls,[[userId,'it',itId],[userId,'en',enId]]);
});
test('uncertain delivery is quarantined rather than resent',async()=>{
 let claimed=false,sends=0;const f=fixture({ledger:{async claim(){if(claimed)return {outcome:'unknown'};claimed=true;return {outcome:'new'};},async finish(){}},senderForBearer:()=>({sendForUser:async()=>{sends++;return {status:'unknown'};}})});
 assert.equal((await f.handler(request())).status,503);assert.equal((await f.handler(request())).status,503);assert.equal(sends,1);
});
test('wrong owner, missing auth, wrong origin and expired window cannot send',async()=>{
 const f=fixture();assert.equal((await f.handler(request({headers:{Origin:origin}}))).status,401);
 assert.equal((await f.handler(request({headers:{Origin:'https://other.invalid',Authorization:'Bearer synthetic'}}))).status,403);
 const other=fixture({verifyUser:async()=>({ok:true,userId:enId})});assert.equal((await other.handler(request())).status,403);assert.equal(other.calls.length,0);
 for(const time of [now-1,now+1200000]){const e=fixture({now:()=>time});assert.equal((await e.handler(request())).status,410);assert.equal(e.calls.length,0);}assert.equal(f.calls.length,0);
});
test('preflight and stalled body never read preferences or send',async()=>{
 let reads=0;const f=fixture({readPreference:async()=>{reads++;return null;}});assert.equal((await f.handler(request({method:'OPTIONS'}))).status,204);
 assert.equal((await f.handler(request({duplex:'half',body:new ReadableStream({start(){}})}))).status,408);assert.equal(reads,0);assert.equal(f.calls.length,0);
});
