import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getAccountState} from '../account-state.ts';
const session={userId:'first',profile:{displayName:'QA',email:'qa@example.test',avatarUrl:null}};
function fixture(){
  let notify,resolve;const calls={read:0,subscribe:0};
  const service={subscribe(listener){calls.subscribe++;notify=listener;return ()=>{};},currentSession(){calls.read++;return new Promise(done=>resolve=done);}};
  const source=getAccountState(service);
  return {service,source,calls,notify:value=>notify(value),resolve:value=>resolve(value)};
}
test('all consumers share one verified restoration and one SDK subscription',async()=>{
  const f=fixture(),second=getAccountState(f.service),seen=[];
  assert.equal(second,f.source);f.source.subscribe(value=>seen.push(value));
  const pending=second.refresh();assert.equal(f.calls.read,1);assert.equal(f.calls.subscribe,1);
  f.resolve({ok:true,value:session});await pending;
  assert.deepEqual(f.source.snapshot(),{status:'ready',session});
  getAccountState(f.service).subscribe(()=>{});assert.equal(f.calls.read,1);
});
test('a late initial read cannot overwrite logout or a newer account event',async()=>{
  const f=fixture(),pending=f.source.refresh();f.notify(null);
  f.resolve({ok:true,value:session});await pending;
  assert.deepEqual(f.source.snapshot(),{status:'ready',session:null});
  f.notify({...session,userId:'second'});assert.equal(f.source.snapshot().session.userId,'second');
});
test('snapshot isolation strips unexpected credentials and prevents listener mutations',async()=>{
  const f=fixture(),pending=f.source.refresh();
  f.resolve({ok:true,value:{...session,access_token:'synthetic-secret',profile:{...session.profile,role:'admin'}}});await pending;
  f.source.subscribe(value=>{if(value.session)value.session.profile.displayName='changed';});
  assert.deepEqual(f.source.snapshot(),{status:'ready',session});
  assert.equal(JSON.stringify(f.source.snapshot()).includes('synthetic-secret'),false);
});
test('failed restoration stays distinct from a confirmed guest, and explicit refresh can recover',async()=>{
  const f=fixture(),first=f.source.refresh();f.resolve({ok:false,reason:'failed'});await first;
  assert.deepEqual(f.source.snapshot(),{status:'failed',session:null});
  const retry=f.source.refresh();assert.equal(f.calls.read,2);f.resolve({ok:true,value:null});await retry;
  assert.deepEqual(f.source.snapshot(),{status:'ready',session:null});
});
test('separate services do not share identities, and unsubscribe stops callbacks',async()=>{
  const a=fixture(),b=fixture(),seen=[];
  const stop=a.source.subscribe(value=>seen.push(value));const before=seen.length;stop();
  a.notify(session);assert.equal(seen.length,before);
  assert.equal(b.source.snapshot().session,null);
});
test('one broken view does not prevent other views from observing account changes',()=>{
  const f=fixture(),seen=[];
  let first=true;f.source.subscribe(()=>{if(!first)throw new Error('synthetic view failure');first=false;});
  f.source.subscribe(value=>seen.push(value));f.notify(session);
  assert.equal(seen.at(-1).session.userId,'first');
});
