import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createManagementService,hashManagementToken,newManagementToken} from '../management-service.ts';
import {createManagementClient} from '../management-client.ts';
import {createManagementRepository} from '../management-repository.ts';
import {createManagementIssuer} from '../management-issuer.ts';
import {readManagementBrowserConfig} from '../management-config.ts';
import {createManagementHandler} from '../../presentation/management-handler.ts';
const origin='http://127.0.0.1:4337',endpoint=origin+'/functions/v1/wishlist-email-management',token='a'.repeat(64);
const id='00000000-0000-4000-8000-000000000001';
async function fixture(){
  const digest=await hashManagementToken(token),calls=[],wire=[];let state={enabled:true,locale:'en',revision:0};
  const service=createManagementService({async run(hash,command){calls.push({hash,command});if(hash!==digest)return {ok:false,reason:'invalid-link'};
    if(command.operation==='unsubscribe')state={...state,enabled:false};
    if(command.operation==='language'){
      if(command.expectedRevision!==state.revision)return {ok:true,state:{...state},conflict:true};
      state={...state,locale:command.locale,revision:state.revision+1};
    }return {ok:true,state:{...state},conflict:false};}},hashManagementToken);
  const handle=createManagementHandler({service,origins:[origin],allowRequest:async()=>true,maxBodyBytes:1024,bodyTimeoutMs:20});
  const client=createManagementClient({endpoint,timeoutMs:1000,maxResponseBytes:4096},async(url,init)=>{wire.push({url,init});return handle(new Request(url,{...init,headers:{...init.headers,Origin:origin}}));});
  return {calls,wire,client,handle};
}
test('token-only transport reads without Auth; only explicit actions mutate, language never re-enables',async()=>{
  const f=await fixture();assert.equal((await f.client.execute(token,{operation:'read'})).state.enabled,true);
  const stopped=await f.client.execute(token,{operation:'unsubscribe',requestId:id,consentLocale:'en'});assert.equal(stopped.state.enabled,false);
  const changed=await f.client.execute(token,{operation:'language',requestId:id,locale:'it',expectedRevision:0});
  assert.equal(changed.state.locale,'it');assert.equal(changed.state.enabled,false);
  const conflict=await f.client.execute(token,{operation:'language',requestId:id,locale:'en',expectedRevision:0});assert.equal(conflict.conflict,true);
  for(const call of f.wire){assert.equal(call.url,endpoint);assert.equal(call.init.credentials,'omit');assert.equal(call.init.referrerPolicy,'no-referrer');assert.equal(call.init.headers.Authorization,undefined);}
  for(const call of f.calls){assert.notEqual(call.hash,token);assert.equal(call.hash.length,64);}
});
test('wrong/expired/revoked capability response has no state, and forged scope never reaches repository',async()=>{
  const f=await fixture();assert.deepEqual(await f.client.execute('b'.repeat(64),{operation:'read'}),{ok:false,reason:'invalid-link'});
  for(const command of [{operation:'read',userId:id},{operation:'subscribe',requestId:id},{operation:'unsubscribe',requestId:id,enabled:true}])
    assert.equal((await f.client.execute(token,command)).ok,false);
  assert.equal(f.calls.length,1);
});
test('handler rejects GET, wrong origin, oversized JSON and ingress limiter outages without capability lookup',async()=>{
  const f=await fixture();assert.equal((await f.handle(new Request(endpoint,{headers:{Origin:origin}}))).status,405);
  assert.equal((await f.handle(new Request(endpoint,{method:'POST',headers:{Origin:'https://other.invalid'}}))).status,403);
  assert.equal((await f.handle(new Request(endpoint,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token:'x'.repeat(1500)})}))).status,413);
  const limited=createManagementHandler({service:{execute:async()=>{throw new Error('must not run');}},origins:[origin],allowRequest:async()=>false,maxBodyBytes:1024,bodyTimeoutMs:10});
  assert.equal((await limited(new Request(endpoint,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'}))).status,429);
  assert.equal(f.calls.length,0);
});
test('missing runtime config stays off, arbitrary destinations do not receive tokens',()=>{
  assert.equal(readManagementBrowserConfig({}),null);
  assert.throws(()=>readManagementBrowserConfig({PUBLIC_WISHLIST_EMAIL_MANAGEMENT_ENABLED:'1',PUBLIC_AUTH_SUPABASE_URL:'http://evil.invalid'}));
  assert.throws(()=>createManagementClient({endpoint:'https://user:pass@evil.invalid',timeoutMs:100,maxResponseBytes:1000},fetch));
});
test('issuer uses secure random tokens and sends only their hash through the private backend RPC',async()=>{
  const generated=newManagementToken();assert.match(generated,/^[a-f0-9]{64}$/);assert.notEqual(generated,newManagementToken());
  let sent;const client=createClient('https://management-qa.invalid','sb_secret_synthetic',{auth:{persistSession:false},global:{fetch:async(url,init)=>{
    assert.equal(new URL(url).pathname,'/rest/v1/rpc/issue_wishlist_correspondence_token');sent=JSON.parse(init.body);return Response.json(true);}}});
  const issuer=createManagementIssuer(client,{lifetimeMs:60000,timeoutMs:1000,now:()=>Date.parse('2026-10-25T00:00:00Z')}); // synthetic lifetime only
  const link=await issuer.issue(id,'https://preview.example.test','it');assert.ok(link);
  const raw=new URLSearchParams(new URL(link).hash.slice(1)).get('token');assert.equal(sent.p_token_hash,await hashManagementToken(raw));assert.equal(JSON.stringify(sent).includes(raw),false);
});
test('repository maps one private result and rejects provider errors/invalid rows without leaking details',async()=>{
  const client=data=>({rpc(name,args){assert.equal(name,'manage_wishlist_correspondence');assert.equal(args.p_token_hash,token);return {abortSignal:async()=>data};}});
  assert.deepEqual(await createManagementRepository(client({data:[],error:null}),100).run(token,{operation:'read'}),{ok:false,reason:'invalid-link'});
  assert.deepEqual(await createManagementRepository(client({data:[{enabled:true,locale:'de',revision:0,conflict:false}],error:null}),100).run(token,{operation:'read'}),{ok:false,reason:'unavailable'});
});
