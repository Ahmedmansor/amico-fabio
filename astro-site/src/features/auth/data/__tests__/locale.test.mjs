import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createLocaleRepository} from '../locale-repository.ts';
import {createLocaleService} from '../locale-service.ts';

const userId='00000000-0000-4000-8000-000000000001';
const command={requestId:'00000000-0000-4000-8000-000000000002',expectedRevision:0,kind:'site',locale:'en'};
const row={outcome:'applied',site_locale:'en',revision:1,email_locale:'it',locale_source:'explicit'};
function fixture(replies=[{body:[row],status:200}]){
  const calls=[];
  const client=createClient('https://locale-test.invalid','sb_publishable_synthetic',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async(url,options)=>{
      calls.push({url:String(url),body:JSON.parse(options.body),signal:options.signal});
      const reply=replies.shift();
      if(reply instanceof Error)throw reply;
      return new Response(JSON.stringify(reply.body),{status:reply.status,headers:{'content-type':'application/json'}});
    }},
  });
  const repository=createLocaleRepository(client,1000);
  return {calls,repository,service:createLocaleService(repository)};
}
test('one change calls the atomic RPC with verified ownership, revision and request identity',async()=>{
  const f=fixture();
  assert.deepEqual(await f.service.change(userId,command),{ok:true,value:{outcome:'applied',state:{
    siteLocale:'en',revision:1,email:{locale:'it',source:'explicit'}}}});
  assert.equal(f.calls.length,1);
  assert.equal(new URL(f.calls[0].url).pathname,'/rest/v1/rpc/change_account_locale');
  assert.deepEqual(f.calls[0].body,{p_user_id:userId,p_request_id:command.requestId,p_expected_revision:0,p_kind:'site',p_locale:'en'});
});
test('read does not mutate preferences or create a profile/subscription',async()=>{
  const f=fixture([{body:[{...row,outcome:'read',email_locale:null,locale_source:null}],status:200}]);
  assert.deepEqual(await f.service.read(userId),{ok:true,value:{siteLocale:'en',revision:1,email:null}});
  assert.equal(new URL(f.calls[0].url).pathname,'/rest/v1/rpc/read_account_locale');
  assert.deepEqual(f.calls[0].body,{p_user_id:userId});
});
test('forged ownership, consent and unsupported locale fail before any network access',async()=>{
  const f=fixture();
  for(const body of [{...command,userId:'other'},{...command,enabled:true},{...command,locale:'ar'},
    {...command,expectedRevision:'0'},{...command,expectedRevision:-1}])
    assert.deepEqual(await f.service.change(userId,body),{ok:false,reason:'invalid-input'});
  assert.equal((await f.service.change('invalid',command)).ok,false);
  assert.equal((await f.service.read('invalid')).ok,false);
  assert.equal(f.calls.length,0);
});
test('conflict carries confirmed state for reconciliation, never claims the requested locale saved',async()=>{
  const f=fixture([{body:[{...row,outcome:'conflict',site_locale:'it'}],status:200}]);
  assert.deepEqual(await f.service.change(userId,command),{ok:false,reason:'conflict',state:{
    siteLocale:'it',revision:1,email:{locale:'it',source:'explicit'}}});
});
test('an idempotent old retry returns current explicit preference without replaying it',async()=>{
  const f=fixture([{body:[{...row,outcome:'duplicate',revision:4}],status:200}]);
  const result=await f.service.change(userId,command);
  assert.equal(result.value.outcome,'duplicate');
  assert.equal(result.value.state.revision,4);
  assert.equal(result.value.state.email.source,'explicit');
});
test('account-scoped calls never reuse ownership across accounts',async()=>{
  const f=fixture([{body:[row],status:200},{body:[row],status:200}]);
  const second='00000000-0000-4000-8000-000000000003';
  await Promise.all([f.service.change(userId,command),f.service.change(second,command)]);
  assert.deepEqual(f.calls.map(call=>call.body.p_user_id),[userId,second]);
});
test('missing records, invalid responses and transport errors are never confirmations',async()=>{
  for(const outcome of ['missing-profile','missing-preference','invalid-input']){
    const f=fixture([{body:[{outcome}],status:200}]);
    assert.deepEqual(await f.service.change(userId,command),{ok:false,reason:outcome});
  }
  for(const reply of [{body:[],status:200},{body:[{...row,revision:'1'}],status:200},
    {body:[{...row,locale_source:'follow_site'}],status:200},{body:{message:'denied'},status:403}]){
    assert.deepEqual(await fixture([reply]).service.change(userId,command),{ok:false,reason:'failed'});
  }
  assert.deepEqual(await createLocaleRepository(null,100).change(userId,command),{ok:false,reason:'unavailable'});
});
test('returning to follow-site sends no caller-selected locale',async()=>{
  const f=fixture([{body:[{...row,email_locale:'en',locale_source:'follow_site'}],status:200}]);
  await f.service.change(userId,{requestId:command.requestId,expectedRevision:0,kind:'email_follow_site'});
  assert.equal(f.calls[0].body.p_locale,null);
});
test('a contradictory applied/replayed revision or language is not a saved confirmation',async()=>{
  for(const bad of [{...row,revision:0},{...row,site_locale:'it'},
    {...row,outcome:'duplicate',revision:0},{...row,outcome:'conflict',revision:0}])
    assert.deepEqual(await fixture([{body:[bad],status:200}]).service.change(userId,command),{ok:false,reason:'failed'});
});
test('deadline aborts an uncertain write and never reports success or retries it blindly',async()=>{
  let calls=0;
  const client={rpc(){calls++;return {abortSignal(signal){return new Promise(resolve=>
    signal.addEventListener('abort',()=>resolve({data:null,error:{message:'timeout'}}),{once:true}));}};}};
  assert.deepEqual(await createLocaleRepository(client,5).change(userId,command),{ok:false,reason:'failed'});
  assert.equal(calls,1);
});
