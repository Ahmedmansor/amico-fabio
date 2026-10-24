import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreferenceService} from '../preferences-service.ts';
import {createPreferenceRepository} from '../preferences-repository.ts';
import {reminderConsentVersion} from '../../domain/preferences.ts';
const userId='00000000-0000-4000-8000-000000000001';
const change={requestId:'00000000-0000-4000-8000-000000000002',enabled:true,locale:'it',wordingVersion:reminderConsentVersion};
const row={enabled:true,locale:'it',wording_version:reminderConsentVersion,updated_at:'2026-10-24T00:00:00Z',enabled_since:'2026-10-24T00:00:00Z'};
function fixture(results=[]){
  const calls=[];
  function query(call){return {select(value){call.select=value;return this;},eq(key,value){call.filter=[key,value];return this;},maybeSingle(){return this;},abortSignal(signal){call.signal=signal;return this;},then(resolve,reject){return Promise.resolve(results.shift()??{data:[row],error:null}).then(resolve,reject);}};}
  const client={from(table){const call={table};calls.push(call);return query(call);},rpc(name,args){const call={name,args};calls.push(call);return query(call);}};
  const repository=createPreferenceRepository(client,1000);
  return {calls,repository,service:createPreferenceService(repository)};
}
test('reading an absent preference does not create a subscription or consent event',async()=>{
  const f=fixture([{data:null,error:null}]);
  assert.deepEqual(await f.service.read(userId),{ok:true,value:null});
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].table,'wishlist_email_preferences');
  assert.deepEqual(f.calls[0].filter,['user_id',userId]);
});
test('explicit changes use only the verified caller identity and the atomic backend RPC',async()=>{
  const f=fixture();const result=await f.service.change(userId,change);
  assert.equal(result.ok,true);assert.equal(result.value.enabled,true);
  assert.equal(f.calls[0].name,'change_wishlist_email_preference_v2');
  assert.deepEqual(f.calls[0].args,{p_user_id:userId,p_request_id:change.requestId,p_enabled:true,p_locale:'it',p_consent_locale:'it',p_wording_version:reminderConsentVersion,p_source:'wishlist-page'});
  assert.equal(f.calls[0].signal.aborted,false);
});
test('invalid or forged commands never reach persistence',async()=>{
  const f=fixture();
  assert.equal((await f.service.change(userId,{...change,userId:'other'})).ok,false);
  assert.equal((await f.service.change('not-authenticated',change)).ok,false);
  assert.equal((await f.service.change(userId,{...change,wordingVersion:'stale'})).reason,'outdated-consent');
  assert.equal(f.calls.length,0);
});
test('network/provider failures and malformed records never report successful subscription',async()=>{
  for(const result of [{data:null,error:{message:'not exposed'}},{data:[{...row,enabled:'true'}],error:null},{data:[],error:null}]){
    const f=fixture([result]);assert.deepEqual(await f.service.change(userId,change),{ok:false,reason:'failed'});
  }
  assert.deepEqual(await createPreferenceRepository(null,1000).read(userId),{ok:false,reason:'unavailable'});
});
test('an aborted request produces a retryable neutral failure instead of success',async()=>{
  const client={rpc(){return {abortSignal(signal){return new Promise(resolve=>signal.addEventListener('abort',()=>resolve({data:null,error:{message:'aborted'}}),{once:true}));}};}};
  assert.deepEqual(await createPreferenceRepository(client,5).change(userId,change),{ok:false,reason:'failed'});
});
