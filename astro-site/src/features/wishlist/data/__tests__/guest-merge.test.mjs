import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGuestMergePort} from '../guest-merge.ts';
import {saveGuestFavorite,readGuestSnapshot,removeGuestRevision} from '../guest-storage.ts';
function storage(){const values=new Map();return {get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
const lock=async action=>action();
test('successful merge acknowledges only confirmed guest revisions and leaves unrelated data',async()=>{
  const data=storage();data.setItem('unrelated','safe');saveGuestFavorite(data,'a',true);saveGuestFavorite(data,'b',true);
  const guest=createGuestMergePort(data,lock,()=>100);
  const captured=await guest.capture('user-a',false);
  assert.equal(captured.ok,true);
  assert.equal((await guest.acknowledge('user-a',captured.value.entries,['a'],()=>true)).ok,true);
  assert.deepEqual(guest.read(),{ok:true,value:['b']});assert.equal(data.getItem('unrelated'),'safe');
});
test('interrupted merge cannot silently move the same guest revision into another account',async()=>{
  const data=storage();saveGuestFavorite(data,'a',true);const guest=createGuestMergePort(data,lock,()=>100);
  const first=await guest.capture('user-a',false);
  const blocked=await guest.capture('user-b',false);assert.equal(blocked.value.blocked,1);assert.deepEqual(blocked.value.entries,[]);
  const explicit=await guest.capture('user-b',true);assert.equal(explicit.value.entries.length,1);
  await guest.acknowledge('user-a',first.value.entries,['a'],()=>true);
  assert.deepEqual(guest.read(),{ok:true,value:['a']});
  await guest.acknowledge('user-b',explicit.value.entries,['a'],()=>true);
  assert.deepEqual(guest.read(),{ok:true,value:[]});
});
test('expired attempts require a new explicit action, and stale-account responses cannot clear guests',async()=>{
  let now=100;const data=storage();saveGuestFavorite(data,'a',true);const guest=createGuestMergePort(data,lock,()=>now);
  const captured=await guest.capture('user-a',false);now+=11*60*1000;
  assert.equal((await guest.capture('user-a',false)).value.blocked,1);
  assert.equal((await guest.acknowledge('user-a',captured.value.entries,['a'],()=>false)).reason,'stale');
  assert.deepEqual(guest.read(),{ok:true,value:['a']});
  assert.equal((await guest.capture('user-a',true)).value.entries.length,1);
});
test('revision acknowledgement does not delete a newer save even from an uncooperative writer',()=>{
  const data=storage();saveGuestFavorite(data,'a',true);const old=readGuestSnapshot(data).value[0];
  const write=data.setItem;
  data.setItem=(key,value)=>{
    if(key.startsWith('fabio:wishlist:ack:')){saveGuestFavorite(data,'a',false);saveGuestFavorite(data,'a',true);}
    write(key,value);
  };
  assert.equal(removeGuestRevision(data,old).ok,true);
  assert.deepEqual(createGuestMergePort(data,lock).read(),{ok:true,value:['a']});
});
test('no lock or denied claims retain guest data rather than pretending to sync',async()=>{
  const data=storage();saveGuestFavorite(data,'a',true);
  assert.equal((await createGuestMergePort(data,null).capture('user-a',false)).reason,'storage');
  const write=data.setItem;data.setItem=(key,value)=>{if(!key.startsWith('fabio:wishlist:merge:'))write(key,value);};
  assert.equal((await createGuestMergePort(data,lock).capture('user-a',false)).reason,'storage');
  assert.deepEqual(createGuestMergePort(data,lock).read(),{ok:true,value:['a']});
});
