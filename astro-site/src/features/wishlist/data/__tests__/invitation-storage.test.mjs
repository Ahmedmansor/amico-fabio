import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canOfferSignIn,dismissSignInInvitation,invitationDismissalKey} from '../invitation-storage.ts';
const memory=()=>{const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};};
test('Not now persists independently of favorites, Auth and email consent',()=>{
  const storage=memory();storage.setItem('fabio:wishlist:v1:trip:a','1');
  assert.deepEqual(canOfferSignIn(storage,100),{ok:true,value:true});
  assert.equal(dismissSignInInvitation(storage,100).ok,true);
  assert.deepEqual(canOfferSignIn(storage,101),{ok:true,value:false});
  assert.equal(storage.getItem('fabio:wishlist:v1:trip:a'),'1');
  assert.deepEqual(canOfferSignIn(storage,100+8*24*60*60*1000),{ok:true,value:true});
});
test('denied, discarded or corrupt storage never pretends dismissal was persisted',()=>{
  assert.equal(canOfferSignIn(null,100).ok,false);assert.equal(dismissSignInInvitation(null,100).ok,false);
  const storage=memory();storage.setItem(invitationDismissalKey,'broken');
  assert.equal(canOfferSignIn(storage,100).ok,false);
  storage.setItem=()=>{};assert.equal(dismissSignInInvitation(storage,100).ok,false);
});
