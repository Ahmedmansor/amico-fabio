import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWishlistCoordinator} from '../coordinator.ts';
const good=value=>({ok:true,value});
function fixture(){
  let local=['guest'];let remote=['remote'];let account='a';const calls=[];
  const repository={ensureProfile:async()=>good(),list:async()=>good([...remote]),add:async(user,ids)=>{calls.push({user,ids});remote=[...new Set([...remote,...ids])];return good();},remove:async(_user,id)=>{remote=remote.filter(value=>value!==id);return good();}};
  const guest={read:()=>good([...local]),capture:async()=>good({entries:local.map(id=>({id,revision:'r',claim:'c'})),blocked:0}),acknowledge:async(_user,_entries,ids,current)=>{if(!current())return {ok:false,reason:'stale'};local=local.filter(id=>!ids.includes(id));return good();},save:async(id,saved)=>{local=saved?[...new Set([...local,id])]:local.filter(value=>value!==id);return good();}};
  const coordinator=createWishlistCoordinator(repository,guest,['guest','remote','new'],'it');
  return {coordinator,repository,guest,calls,get local(){return local;},set local(value){local=value;},set remote(value){remote=value;},set account(value){account=value;},get account(){return account;}};
}
test('initial account load merges by insertion, confirms read-back and preserves existing account favorites',async()=>{
  const f=fixture();assert.equal((await f.coordinator.connect('a')).ok,true);
  assert.deepEqual(f.coordinator.getState().ids,['remote','guest']);assert.deepEqual(f.local,[]);
  assert.deepEqual(f.calls,[{user:'a',ids:['guest']}]);
  await f.coordinator.connect(null);assert.deepEqual(f.coordinator.getState().ids,[]);
});
test('failed and partial writes never wipe guests or report full sync success',async()=>{
  const f=fixture();f.repository.add=async()=>({ok:false,reason:'failed'});
  assert.equal((await f.coordinator.connect('a')).ok,false);
  assert.deepEqual(f.local,['guest']);assert.equal(f.coordinator.getState().status,'error');
});
test('account switch discards stale in-flight responses and never cleans that snapshot',async()=>{
  const f=fixture();let release;const gate=new Promise(resolve=>release=resolve);
  f.repository.add=async()=>{await gate;return good();};
  const original=f.coordinator.connect('a');
  await new Promise(resolve=>setTimeout(resolve,0));
  f.local=[];f.remote=['b-only'];await f.coordinator.connect('b');
  release();assert.equal((await original).reason,'stale');
  assert.deepEqual(f.coordinator.getState().ids,['b-only']);assert.equal(f.coordinator.getState().userId,'b');
});
test('serialized account edits require read-back confirmation and leave local guest data alone on signout',async()=>{
  const f=fixture();await f.coordinator.connect('a');
  await Promise.all([f.coordinator.save('new',true),f.coordinator.save('new',false)]);
  assert.equal(f.coordinator.getState().ids.includes('new'),false);
  f.local=['unsynced'];await f.coordinator.connect(null);
  assert.deepEqual(f.coordinator.getState().ids,['unsynced']);
});
test('silent RLS denial is not a successful save; unknown tours stay local',async()=>{
  const f=fixture();f.local=['unpublished'];await f.coordinator.connect('a');
  assert.deepEqual(f.local,['unpublished']);assert.equal(f.coordinator.getState().pendingGuest,1);
  f.repository.add=async()=>good();
  assert.equal((await f.coordinator.save('new',true)).reason,'failed');
});
test('missing schema/profile or read failure exposes error without account-to-guest fallback success',async()=>{
  const f=fixture();f.repository.ensureProfile=async()=>({ok:false,reason:'failed'});
  assert.equal((await f.coordinator.connect('a')).ok,false);
  assert.deepEqual(f.local,['guest']);assert.equal(f.coordinator.getState().ids,null);
});
