import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createReminderActivityRepository} from '../activity-repository.ts';
const userId='00000000-0000-4000-8000-000000000001';
const row={favorite_count:2,last_addition_at:'2026-10-25T00:00:00Z',revision:4};
function fixture(data=[row],status=200){
  const calls=[];
  const client=createClient('https://activity-qa.invalid','sb_publishable_synthetic',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(url,init)=>{
      calls.push({url:String(url),body:JSON.parse(init.body)});
      return Response.json(data,{status});
    }}});
  return {calls,repository:createReminderActivityRepository(client,1000)};
}
test('private reader requests one account summary, never guesses from surviving wishlist rows',async()=>{
  const f=fixture();assert.deepEqual(await f.repository.read(userId),{ok:true,value:{favoriteCount:2,lastAdditionAt:Date.parse(row.last_addition_at),revision:4}});
  assert.equal(new URL(f.calls[0].url).pathname,'/rest/v1/rpc/read_wishlist_reminder_activity');
  assert.deepEqual(f.calls[0].body,{p_user_id:userId});assert.equal(f.calls.length,1);
});
test('absence is distinct from malformed/incomplete history',async()=>{
  assert.deepEqual(await fixture([]).repository.read(userId),{ok:true,value:null});
  for(const data of [[{...row,last_addition_at:null}],[{...row,favorite_count:0}],[{...row,favorite_count:'2'}],
    [{...row,last_addition_at:'bad'}],[row,row]])assert.deepEqual(await fixture(data).repository.read(userId),{ok:false,reason:'failed'});
});
test('invalid identity and unavailable client never produce a request',async()=>{
  const f=fixture();assert.deepEqual(await f.repository.read('guest'),{ok:false,reason:'invalid-input'});assert.equal(f.calls.length,0);
  assert.deepEqual(await createReminderActivityRepository(null,1000).read(userId),{ok:false,reason:'unavailable'});
});
test('RPC permission failure fails closed without exposing provider responses',async()=>{
  assert.deepEqual(await fixture({message:'synthetic private error'},403).repository.read(userId),{ok:false,reason:'failed'});
});
