import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserPreferenceController} from '../preferences-browser-controller.ts';
import {readPreferenceBrowserConfig} from '../preferences-browser-config.ts';
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const config={endpoint:'https://auth-qa.invalid/functions/v1/wishlist-email-preferences',timeoutMs:1000,maxResponseBytes:4096};
const row={enabled:true,locale:'it',wordingVersion:'wishlist-reminders-v1',updatedAt:'2026-10-25T00:00:00Z',enabledSince:'2026-10-25T00:00:00Z'};
function fixture(){
  const calls=[],bearers=[];let reply=null;
  const bridge=createBrowserPreferenceController({config,requestId:()=>b,
    service:{bearerFor:async userId=>{bearers.push(userId);return {ok:true,value:'synthetic'};}},
    fetcher:async(url,init)=>{calls.push({url,init});return Response.json({preference:init.method==='PATCH'?row:reply});}});
  return {bridge,calls,bearers,setReply:value=>reply=value};
}
test('guest and repeated same-account Auth events do not request preferences or opt in',async()=>{
  const f=fixture();await f.bridge.connect(null);assert.equal(f.calls.length,0);
  await f.bridge.connect(a);await f.bridge.connect(a);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].init.method,'GET');
  assert.equal(f.bridge.controller.getState().preference,null);
});
test('only explicit save writes consent; caller identity and timestamps never enter the body',async()=>{
  const f=fixture();await f.bridge.connect(a);await f.bridge.controller.save(true,'it');
  assert.deepEqual(JSON.parse(f.calls[1].init.body),{requestId:b,enabled:true,locale:'it',wordingVersion:'wishlist-reminders-v1'});
  assert.deepEqual(f.bearers,[a,a]);assert.equal(f.bridge.controller.getState().preference.enabled,true);
  await f.bridge.connect(null);assert.equal(f.bridge.controller.getState().status,'signed-out');
});
test('an account switch during bearer retrieval stops the old request before fetch',async()=>{
  let release,calls=0;
  const gate=new Promise(resolve=>release=resolve);
  const bridge=createBrowserPreferenceController({config,requestId:()=>b,
    service:{bearerFor:async userId=>{if(userId===a)await gate;return {ok:true,value:'synthetic'};}},
    fetcher:async()=>{calls++;return Response.json({preference:null});}});
  const first=bridge.connect(a);await bridge.connect(b);release();await first;
  assert.equal(calls,1);assert.equal(bridge.controller.getState().userId,b);
});
test('restoring existing consent is read-only and preserves the server preference',async()=>{
  const f=fixture();f.setReply(row);await f.bridge.connect(a);
  assert.deepEqual(f.bridge.controller.getState().preference,row);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].init.method,'GET');
});
test('opt-in config stays off and cannot be enabled with incomplete Auth/locale integration',()=>{
  const auth={url:'https://auth-qa.invalid'};
  assert.equal(readPreferenceBrowserConfig({},null),null);
  for(const env of [{PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED:'yes'},
    {PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED:'1'},
    {PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED:'1',PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED:'1'}])
    assert.throws(()=>readPreferenceBrowserConfig(env,auth));
  const result=readPreferenceBrowserConfig({PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED:'1',PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED:'1',PUBLIC_ACCOUNT_LOCALE_ENABLED:'1'},auth);
  assert.equal(result.endpoint,config.endpoint);
});
