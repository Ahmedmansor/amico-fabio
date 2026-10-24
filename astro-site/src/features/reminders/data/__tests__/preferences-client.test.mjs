import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreferenceClient} from '../preferences-client.ts';
import {createPreferenceController} from '../preferences-controller.ts';
import {createPreferenceHandler} from '../../presentation/preferences-handler.ts';
import {createPreferenceService} from '../preferences-service.ts';
import {reminderConsentVersion} from '../../domain/preferences.ts';

const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const requestId='00000000-0000-4000-8000-000000000003';
const endpoint='http://127.0.0.1:4330/preferences';
const command={requestId,enabled:true,locale:'en',consentLocale:'en',wordingVersion:reminderConsentVersion};
const preference={enabled:true,locale:'en',wordingVersion:reminderConsentVersion,updatedAt:'2026-10-24T00:00:00Z',enabledSince:'2026-10-24T00:00:00Z'};
const ok=value=>({ok:true,value});
const reply=value=>Response.json({preference:value});
function fixture(overrides={}){
  const calls=[];
  const options={endpoint,session:async()=>({userId:a,bearer:'synthetic-test-token'}),timeoutMs:1000,maxResponseBytes:2048,
    fetcher:async(url,init)=>{calls.push([url,init]);return reply(preference);},...overrides};
  return {client:createPreferenceClient(options),calls,options};
}
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

test('transport sends only explicit command to fixed endpoint and keeps identity out of body and URL',async()=>{
  const f=fixture();assert.deepEqual(await f.client.change(a,command),ok(preference));
  const [url,init]=f.calls[0];assert.equal(url,endpoint);assert.equal(init.method,'PATCH');
  assert.deepEqual(JSON.parse(init.body),command);assert.equal(init.headers.Authorization,'Bearer synthetic-test-token');
  assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');
  assert.equal(init.referrerPolicy,'no-referrer');
});

test('no session or switched account prevents network writes; invalid commands do not request a token',async()=>{
  const absent=fixture({session:async()=>null});assert.deepEqual(await absent.client.change(a,command),{ok:false,reason:'unauthenticated'});assert.equal(absent.calls.length,0);
  const switched=fixture({session:async()=>({userId:b,bearer:'synthetic-other-token'})});
  assert.deepEqual(await switched.client.change(a,command),{ok:false,reason:'account-changed'});assert.equal(switched.calls.length,0);
  let sessions=0;const invalid=fixture({session:async()=>{sessions++;return null;}});
  assert.deepEqual(await invalid.client.change(a,{...command,userId:b}),{ok:false,reason:'invalid-input'});assert.equal(sessions,0);
});

test('missing preference stays absent and never creates consent; a null write reply is not success',async()=>{
  const f=fixture({fetcher:async()=>reply(null)});
  assert.deepEqual(await f.client.read(a),ok(null));assert.deepEqual(await f.client.change(a,command),{ok:false,reason:'failed'});
});

test('rejects malformed and oversized confirmation without optimistic success',async()=>{
  for(const value of [{...preference,enabledSince:null},{...preference,locale:'unknown'},{...preference,userId:b}]){
    const f=fixture({fetcher:async()=>reply(value)});assert.equal((await f.client.change(a,command)).ok,false);
  }
  const large=fixture({maxResponseBytes:10});assert.equal((await large.client.read(a)).ok,false);
  const html=fixture({fetcher:async()=>new Response('<html>error</html>')});assert.equal((await html.client.read(a)).ok,false);
  assert.throws(()=>fixture({endpoint:'https://example.test/preferences?token=bad'}),/endpoint/);
  assert.throws(()=>fixture({endpoint:'http://example.test/preferences'}),/endpoint/);
});

test('old grant retry displays current withdrawal from another tab without replay or retry loops',async()=>{
  const withdrawn={...preference,enabled:false,enabledSince:null};
  const f=fixture({fetcher:async()=>reply(withdrawn)});
  const controller=createPreferenceController(f.client,()=>requestId);
  await controller.connect(a);await controller.save(true,'en');
  assert.equal(controller.getState().status,'ready');
  assert.equal(controller.getState().preference.enabled,false);
  assert.equal(controller.getState().retryable,false);
});

test('HTTP failures become neutral typed failures without echoing remote messages',async()=>{
  for(const [status,reason] of [[401,'unauthenticated'],[409,'outdated-consent'],[429,'rate-limited'],[503,'unavailable'],[403,'failed']]){
    const f=fixture({fetcher:async()=>new Response('sensitive provider details',{status})});
    assert.deepEqual(await f.client.read(a),{ok:false,reason});
  }
});

test('deadline includes session lookup, aborts request and never sends after late token resolution',async()=>{
  const session=deferred();const f=fixture({session:()=>session.promise,timeoutMs:10});
  assert.deepEqual(await f.client.read(a),{ok:false,reason:'unavailable'});
  session.resolve({userId:a,bearer:'late-test-token'});await Promise.resolve();await Promise.resolve();assert.equal(f.calls.length,0);
  let signal;const hung=fixture({timeoutMs:10,fetcher:async(_url,init)=>{signal=init.signal;return new Promise(()=>{});}});
  assert.deepEqual(await hung.client.read(a),{ok:false,reason:'unavailable'});assert.equal(signal.aborted,true);
});

test('browser transport and HTTP boundary round-trip only the server-verified identity',async()=>{
  const calls=[];
  const service=createPreferenceService({read:async id=>{calls.push(['read',id]);return ok(null);},change:async(id,input)=>{calls.push(['write',id,input]);return ok(preference);}});
  const handler=createPreferenceHandler({service,verifyUser:async()=>({ok:true,userId:a}),allowedOrigins:['http://127.0.0.1:4330'],maxBodyBytes:1024});
  const f=fixture({fetcher:async(url,init)=>handler(new Request(url,init))});
  assert.deepEqual(await f.client.read(a),ok(null));assert.deepEqual(await f.client.change(a,command),ok(preference));
  assert.deepEqual(calls,[['read',a],['write',a,command]]);
});

test('account switch invalidates late reads and writes and clears previous account display',async()=>{
  const read=deferred(),write=deferred();
  const client={read:id=>id===a?read.promise:Promise.resolve(ok(null)),change:()=>write.promise};
  const controller=createPreferenceController(client,()=>requestId);
  const first=controller.connect(a);await controller.connect(b);read.resolve(ok(preference));await first;
  assert.equal(controller.getState().userId,b);assert.equal(controller.getState().preference,null);
  await controller.connect(a);const save=controller.save(true,'en');await controller.connect(null);
  write.resolve(ok(preference));await save;assert.equal(controller.getState().status,'signed-out');assert.equal(controller.getState().preference,null);
});

test('uncertain saves retry exact request identity, block concurrent changes and never claim success early',async()=>{
  const calls=[];let attempt=0;const wait=deferred();
  const controller=createPreferenceController({read:async()=>ok(null),change:async(_id,input)=>{
    calls.push({...input});return ++attempt===1?wait.promise:ok(preference);
  }},()=>requestId);
  await controller.connect(a);const save=controller.save(true,'en');
  assert.equal(controller.getState().status,'saving');assert.equal(controller.getState().preference,null);
  await controller.save(false,'en');assert.equal(calls.length,1);
  wait.resolve({ok:false,reason:'unavailable'});await save;
  assert.equal(controller.getState().retryable,true);await controller.save(false,'en');assert.equal(calls.length,1);
  await controller.retry();assert.deepEqual(calls,[command,command]);assert.equal(controller.getState().status,'ready');
  const view=controller.getState();view.preference.enabled=false;assert.equal(controller.getState().preference.enabled,true);
});

test('read failures retain no assumed consent and require explicit retry; terminal errors reread instead of replay',async()=>{
  let reads=0,writes=0;
  const controller=createPreferenceController({read:async()=>++reads===1?{ok:false,reason:'unavailable'}:ok(null),change:async()=>{writes++;return {ok:false,reason:'outdated-consent'};}},()=>requestId);
  await controller.connect(a);assert.equal(controller.getState().status,'error');assert.equal(writes,0);
  await controller.retry();assert.equal(controller.getState().status,'ready');
  await controller.save(true,'en');assert.equal(controller.getState().retryable,false);
  await controller.retry();assert.equal(writes,1);await controller.refresh();assert.equal(controller.getState().status,'ready');
});
