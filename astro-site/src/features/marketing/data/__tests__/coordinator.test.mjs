import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMarketingCoordinator} from '../coordinator.ts';
import {createMarketingRepository} from '../repository.ts';
import {marketingConsentEnabled} from '../config.ts';
const none={enabled:false,revision:0,verified:true,pendingSignup:false};
test('disabled by default; flag is explicit and depends on Auth',()=>{
  assert.equal(marketingConsentEnabled({}),false);assert.throws(()=>marketingConsentEnabled({PUBLIC_MARKETING_CONSENT_ENABLED:'1'}));
});
test('only a durable verified pending signup is activated; metadata never enters the coordinator',async()=>{
  const calls=[];
  const c=createMarketingCoordinator({read:async id=>{calls.push(id);return {...none,pendingSignup:true};},activateSignup:async id=>{calls.push(['activate',id]);return {...none,enabled:true,revision:1};}},()=>{});
  await c.setAccount('a');assert.equal(c.snapshot().value.enabled,true);assert.deepEqual(calls,['a',['activate','a']]);
});
test('late account A reads cannot activate signup intent or replace account B',async()=>{
  let finish;const activated=[];
  const c=createMarketingCoordinator({read:async id=>id==='a'?new Promise(resolve=>{finish=resolve;}):none,activateSignup:async id=>{activated.push(id);return none;}},()=>{});
  const old=c.setAccount('a');await c.setAccount('b');finish({...none,pendingSignup:true});await old;
  assert.equal(c.snapshot().userId,'b');assert.deepEqual(activated,[]);
});
test('late consent writes cannot report success to another account; failed saves remain unconfirmed',async()=>{
  let finish;const c=createMarketingCoordinator({read:async()=>none,save:()=>new Promise(resolve=>{finish=resolve;})},()=>{});
  await c.setAccount('a');const old=c.save(true,'it');await c.setAccount('b');finish({...none,enabled:true,revision:1});assert.equal(await old,false);assert.equal(c.snapshot().value.enabled,false);
  const bad=createMarketingCoordinator({read:async()=>none,save:async()=>{throw new Error('offline');}},()=>{});
  await bad.setAccount('a');assert.equal(await bad.save(true,'en'),false);assert.equal(bad.snapshot().status,'failed');
});
test('unverified accounts cannot save and repository binds expected identity/revision',async()=>{
  let writes=0;const c=createMarketingCoordinator({read:async()=>({...none,verified:false}),save:async()=>{writes++;return none;}},()=>{});
  await c.setAccount('a');assert.equal(await c.save(true,'it'),false);assert.equal(writes,0);
  let received;const r=createMarketingRepository(async(name,input)=>{received={name,input};return {data:[{marketing_consent:true,revision:2,verified:true,pending_signup:false}],error:null};});
  await r.save('a',{...none,revision:1},true,'en');assert.equal(received.input.p_expected_user_id,'a');assert.equal(received.input.p_expected_revision,1);assert.equal(received.input.p_notice_version,'favorites-offers-v1');
});
