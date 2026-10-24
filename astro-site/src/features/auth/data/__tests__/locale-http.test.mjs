import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocaleClient} from '../locale-client.ts';
import {createLocaleService} from '../locale-service.ts';
import {createLocaleHandler} from '../../presentation/locale-handler.ts';
import {nextLocaleState} from '../../domain/locale-preference.ts';

const userId='00000000-0000-4000-8000-000000000001';
const command={requestId:'00000000-0000-4000-8000-000000000002',expectedRevision:0,kind:'site',locale:'en'};
const initial={siteLocale:'it',revision:0,email:{locale:'it',source:'follow_site'}};
const endpoint='https://locale-test.invalid/functions/v1/account-locale',origin='http://127.0.0.1:4322';
function fixture(){
  let state=structuredClone(initial);
  const calls=[],changes=[],identities=[];
  const options={
    service:createLocaleService({read:async()=>({ok:true,value:state}),change:async(id,cmd)=>{
      changes.push({id,cmd});const result=nextLocaleState(state,cmd);
      if(!result.ok)return result;state=result.value;
      return {ok:true,value:{state,outcome:'applied'}};
    }}),
    verifyUser:async bearer=>{identities.push(bearer);return {ok:true,userId};},
    limiter:{take:async()=>({status:'allowed'})},allowedOrigins:[origin],maxBodyBytes:1024,bodyTimeoutMs:15,
  };
  const fetcher=async(url,init)=>{
    calls.push({url,init});const headers=new Headers(init.headers);headers.set('Origin',origin);
    return createLocaleHandler(options)(new Request(url,{...init,headers}));
  };
  const client=createLocaleClient({endpoint,session:async()=>({userId,bearer:'synthetic-bearer'}),fetcher,timeoutMs:1000,maxResponseBytes:2048});
  const req=(method='PATCH',body=command,headers={})=>new Request(endpoint,{method,
    headers:{Origin:origin,Authorization:'Bearer synthetic-bearer','Content-Type':'application/json',...headers},
    ...(method==='PATCH'?{body:JSON.stringify(body)}:{})});
  return {options,calls,changes,identities,client,req};
}
test('browser-to-handler round trip uses keepalive and never serializes owner/token in JSON',async()=>{
  const f=fixture();assert.equal((await f.client.read(userId)).ok,true);
  const result=await f.client.change(userId,command);
  assert.deepEqual(result,{ok:true,value:{outcome:'applied',state:{siteLocale:'en',revision:1,email:{locale:'en',source:'follow_site'}}}});
  assert.equal(f.calls[1].init.keepalive,true);assert.equal(f.calls[1].init.credentials,'omit');
  assert.equal(f.calls[1].init.redirect,'error');
  assert.deepEqual(JSON.parse(f.calls[1].init.body),command);
  assert.deepEqual(f.changes[0],{id:userId,cmd:command});
  assert.equal(f.identities.length,2);
});
test('preflight is anonymous; denied origins and unsupported methods reach no verification or data',async()=>{
  const f=fixture(),handler=createLocaleHandler(f.options);
  assert.equal((await handler(f.req('OPTIONS'))).status,204);
  assert.equal((await handler(f.req('GET',null,{Origin:'https://unapproved.invalid'}))).status,403);
  assert.equal((await handler(f.req('DELETE'))).status,405);
  assert.equal(f.identities.length,0);assert.equal(f.changes.length,0);
});
test('missing/invalid Auth and Auth outages fail closed',async()=>{
  const f=fixture();
  assert.equal((await createLocaleHandler(f.options)(new Request(endpoint,{headers:{Origin:origin}}))).status,401);
  f.options.verifyUser=async()=>({ok:false,reason:'unauthenticated'});
  assert.equal((await createLocaleHandler(f.options)(f.req())).status,401);
  f.options.verifyUser=async()=>({ok:false,reason:'unavailable'});
  assert.equal((await createLocaleHandler(f.options)(f.req())).status,503);
  assert.equal(f.changes.length,0);
});
test('forged owner/consent/unsupported locale never reaches persistence',async()=>{
  const f=fixture(),handler=createLocaleHandler(f.options);
  for(const extra of [{userId:'other'},{enabled:true},{locale:'pt'}])assert.equal((await handler(f.req('PATCH',{...command,...extra}))).status,400);
  assert.equal(f.changes.length,0);
});
test('rate limiting and unavailable limiter prevent reads/writes',async()=>{
  const f=fixture();f.options.limiter.take=async()=>({status:'limited',retryAfterSeconds:12});
  const limited=await createLocaleHandler(f.options)(f.req());
  assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'12');
  f.options.limiter.take=async()=>({status:'unavailable'});
  assert.equal((await createLocaleHandler(f.options)(f.req())).status,503);
  assert.equal(f.changes.length,0);
});
test('body size, encoding and incoming deadline are enforced',async()=>{
  const f=fixture(),handler=createLocaleHandler(f.options);
  assert.equal((await handler(f.req('PATCH',{padding:'x'.repeat(1500)}))).status,413);
  assert.equal((await handler(f.req('PATCH',command,{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await handler(new Request(endpoint,{method:'PATCH',headers:f.req().headers,body:'{'}))).status,400);
  const stream=new ReadableStream({start(){},cancel(){}});
  assert.equal((await handler(new Request(endpoint,{method:'PATCH',headers:f.req().headers,body:stream,duplex:'half'}))).status,408);
  assert.equal(f.changes.length,0);
});
test('stale revision maps to a validated conflict snapshot, with no automatic client retry',async()=>{
  const f=fixture();await f.client.change(userId,command);
  const result=await f.client.change(userId,{...command,requestId:userId});
  assert.equal(result.reason,'conflict');assert.equal(result.state.revision,1);
  assert.equal(f.calls.length,2);
});
test('client never sends another account session, and bounds session restoration too',async()=>{
  let calls=0;
  const options={endpoint,session:async()=>({userId:'other',bearer:'synthetic'}),fetcher:async()=>{calls++;throw new Error();},timeoutMs:10,maxResponseBytes:100};
  assert.equal((await createLocaleClient(options).change(userId,command)).ok,false);assert.equal(calls,0);
  options.session=()=>new Promise(()=>{});
  assert.equal((await createLocaleClient(options).read(userId)).ok,false);assert.equal(calls,0);
});
test('malformed/oversized responses and success-shaped errors never confirm saving',async()=>{
  for(const reply of [new Response('x'.repeat(300),{headers:{'Content-Type':'application/json'}}),
    new Response(JSON.stringify({outcome:'applied',state:initial}),{headers:{'Content-Type':'application/json'}}),
    new Response(JSON.stringify({outcome:'applied',state:{...initial,siteLocale:'en',revision:1}}),{status:500,headers:{'Content-Type':'application/json'}})]){
    const c=createLocaleClient({endpoint,session:async()=>({userId,bearer:'synthetic'}),fetcher:async()=>reply,timeoutMs:100,maxResponseBytes:200});
    assert.equal((await c.change(userId,command)).ok,false);
  }
});
test('untrusted endpoint and configuration cannot silently become a production fallback',()=>{
  const options={session:async()=>null,fetcher:fetch,timeoutMs:10,maxResponseBytes:100};
  for(const bad of ['http://remote.invalid','https://user:pass@locale-test.invalid','https://locale-test.invalid/?token=fake'])
    assert.throws(()=>createLocaleClient({...options,endpoint:bad}));
  assert.throws(()=>createLocaleHandler({...fixture().options,allowedOrigins:['*']}));
});
test('disabled Edge entry fails closed without reading runtime keys',async()=>{
  const previous=globalThis.Deno;let reads=0,handler;
  globalThis.Deno={env:{get(){reads++;throw new Error('Must not read.');}},serve(value){handler=value;}};
  try{
    await import('../../../../../supabase/functions/account-locale/index.mjs');
    assert.equal(reads,0);
    assert.equal((await handler(new Request(endpoint))).status,503);
  }finally{if(previous===undefined)delete globalThis.Deno;else globalThis.Deno=previous;}
});
