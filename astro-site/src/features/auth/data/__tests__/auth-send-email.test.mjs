import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthSendEmailHandler} from '../auth-send-email-handler.ts';
import {createAuthHookHttpHandler} from '../auth-hook-http.ts';
import {createAuthDeliveryRepository} from '../auth-delivery-repository.ts';
import {parseCallback} from '../../domain/auth.ts';

const origin = 'https://test.example.com';
const attemptId = '10000000-0000-4000-8000-000000000001';
const event = () => ({user: {id: attemptId, email: 'person@libero.it'}, email_data: {
  token_hash: 'synthetic-token-hash', email_action_type: 'magiclink',
  redirect_to: `${origin}/en/auth/callback/?next=%2Fen%2Fwishlist%2F`, site_url: 'https://ignored.example.com',
}});
const signingBytes = new Uint8Array(32).fill(7);
const secret = `v1,whsec_${Buffer.from(signingBytes).toString('base64')}`;
async function signedRequest(body, overrides = {}) {
  const timestamp = String(Math.floor(Date.now()/1000));
  const id = overrides['webhook-id'] ?? 'msg_synthetic';
  const key = await crypto.subtle.importKey('raw', signingBytes, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))).toString('base64');
  return new Request('https://hook.example.com', {method: 'POST', body, headers: {
    'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': `v1,${signature}`, ...overrides,
  }});
}
function setup(overrides = {}) {
  let sends = 0;
  let body;
  const ledger = new Map();
  const deps = {
    apiKey: 'synthetic-key', sender: {name: 'Fabio Egypt', email: 'info@fabioegypt.com'}, allowedOrigins: [origin],
    verifyDns: async () => ({status: 'valid', retryable: false}),
    reserve: async ({deliveryKey}) => {
      const state = ledger.get(deliveryKey);
      if (state) return {outcome: state === 'accepted' ? 'accepted' : 'uncertain'};
      ledger.set(deliveryKey, 'sending'); return {outcome: 'send', attemptId};
    },
    settle: async ({deliveryKey, state}) => { ledger.set(deliveryKey, state); return true; },
    fetcher: async (_, options) => { sends++; body = JSON.parse(options.body); return Response.json({messageId: 'synthetic-message'}, {status: 201}); },
    ...overrides,
  };
  const dispatch = createAuthSendEmailHandler(deps);
  return {dispatch, http: createAuthHookHttpHandler({secrets: [secret], dispatch}), ledger, sends: () => sends, body: () => body};
}

describe('signed Auth hook and durable delivery contract', () => {
  it('verifies the real HTTP boundary and emits the static cross-device email callback', async () => {
    const app = setup();
    assert.equal((await app.http(await signedRequest(JSON.stringify(event())))).status, 200);
    const mail = app.body();
    assert.equal(mail.subject, 'Your sign-in link - Fabio Egypt');
    const url = new URL(mail.textContent.match(/https:\/\/[^\s]+/)[0]);
    assert.equal(url.pathname, '/en/auth/callback/');
    assert.equal(url.origin, origin);
    assert.equal(url.searchParams.get('next'), '/en/wishlist/');
    assert.deepEqual(parseCallback(url.search, url.hash), {kind: 'email', tokenHash: 'synthetic-token-hash'});
    assert.ok(!url.search.includes('token'));
    assert.ok(mail.htmlContent.includes('&amp;type=email'));
  });
  it('uses Italian callback language for a signup despite old English metadata', async () => {
    const app = setup(); const input = event();
    input.user.user_metadata = {site_locale: 'en'};
    input.email_data.email_action_type = 'signup'; input.email_data.redirect_to = `${origin}/it/auth/callback/`;
    assert.equal((await app.dispatch(input)).status, 200);
    assert.equal(app.body().subject, 'Il tuo link di accesso - Fabio Egypt');
  });
  it('rejects missing, wrong, expired, future and tampered signatures before dispatch', async () => {
    const app = setup(); const raw = JSON.stringify(event());
    for (const headers of [
      {'webhook-signature': ''}, {'webhook-signature': 'v1,' + Buffer.alloc(32).toString('base64')},
      {'webhook-timestamp': '1'}, {'webhook-timestamp': String(Math.floor(Date.now()/1000)+600)},
    ]) assert.equal((await app.http(await signedRequest(raw, headers))).status, 401);
    const request = await signedRequest(raw);
    assert.equal((await app.http(new Request(request.url, {method: 'POST', headers: request.headers, body: raw+' '}))).status, 401);
    assert.equal((await app.http(new Request(request.url, {method: 'POST', headers: request.headers, body: '\uFEFF'+raw}))).status, 401);
    assert.equal(app.sends(), 0);
  });
  it('supports signing key rotation and rejects invalid configuration', async () => {
    const app = setup();
    const http = createAuthHookHttpHandler({secrets: ['v1,whsec_'+Buffer.alloc(32).toString('base64'), secret], dispatch: app.dispatch});
    assert.equal((await http(await signedRequest(JSON.stringify(event())))).status, 200);
    assert.throws(() => createAuthHookHttpHandler({secrets: [], dispatch: app.dispatch}));
  });
  it('returns authenticated business errors inside a 200 envelope for Supabase Auth', async () => {
    for (const [overrides,status] of [
      [{verifyDns:async()=>({status:'nonexistent-domain'})},400],
      [{reserve:async()=>({outcome:'blocked'})},429],
      [{reserve:async()=>({outcome:'uncertain'})},503],
    ]) {
      const app=setup(overrides);
      const response=await app.http(await signedRequest(JSON.stringify(event())));
      assert.equal(response.status,200);
      assert.equal((await response.json()).error.http_code,status);
      assert.equal(app.sends(),0);
    }
  });
  it('bounds bodies, rejects invalid JSON and methods without sending', async () => {
    const app = setup();
    assert.equal((await app.http(new Request('https://hook.example.com'))).status, 405);
    assert.equal((await app.http(await signedRequest('x'.repeat(40000)))).status, 503);
    assert.equal((await app.http(await signedRequest('{'))).status, 503);
    assert.equal(app.sends(), 0);
  });
  it('blocks unsupported actions, missing fields and unapproved callbacks before quota or DNS', async () => {
    let checks = 0;
    const app = setup({verifyDns: async () => { checks++; throw Error(); }});
    const invalid = [
      {...event(), user: {email: 'person@libero.it'}},
      {...event(), email_data: {...event().email_data, token_hash: ''}},
      ...['recovery','invite','email_change'].map(email_action_type => ({...event(), email_data: {...event().email_data,email_action_type}})),
      ...['https://evil.example.com/en/auth/callback/', `${origin}/auth/v1/verify`, `${origin}/en/auth/callback/?next=https://evil.example.com`, `${origin}/en/auth/callback/#token=x`, `${origin}/en/auth/callback/?next=/en/&next=/it/`].map(redirect_to => ({...event(), email_data: {...event().email_data,redirect_to}})),
    ];
    for (const input of invalid) assert.equal((await app.dispatch(input)).status, 400);
    assert.equal(checks, 0); assert.equal(app.sends(), 0);
  });
  it('replay returns success without a second send, including a new signed webhook id', async () => {
    const app = setup(); const raw = JSON.stringify(event());
    assert.equal((await app.http(await signedRequest(raw))).status, 200);
    assert.equal((await app.http(await signedRequest(raw, {'webhook-id':'msg_different'}))).status, 200);
    assert.equal(app.sends(), 1);
    assert.ok([...app.ledger.keys()].every(key => /^[a-f0-9]{64}$/.test(key)));
  });
  it('concurrent requests cannot send twice while the first provider request waits', async () => {
    let release; let sends = 0;
    const app = setup({fetcher: async () => { sends++; await new Promise(resolve => {release=resolve;}); return Response.json({messageId:'ok'},{status:201}); }});
    const pending = app.dispatch(event());
    while (!release) await new Promise(resolve => setTimeout(resolve, 1));
    assert.equal((await app.dispatch(event())).status, 503);
    release(); assert.equal((await pending).status, 200); assert.equal(sends, 1);
  });
  it('quarantines network failures, 5xx, malformed acceptance and timeout without blind replay', async () => {
    for (const fetcher of [async () => {throw Error('private-provider-diagnostic');}, async () => new Response('',{status:500}), async () => Response.json({}, {status:201}), async () => new Response(new ReadableStream({start(){}}),{status:201}), async () => new Promise(() => {})]) {
      let sends = 0;
      const app = setup({timeoutMs: 10, fetcher: (...args) => {sends++; return fetcher(...args);}});
      const result = await app.dispatch(event());
      assert.equal(result.status, 503); assert.ok(!JSON.stringify(result).includes('private-provider'));
      assert.equal((await app.dispatch(event())).status, 503); assert.equal(sends, 1);
      assert.deepEqual([...app.ledger.values()], ['unknown']);
    }
  });
  it('keeps accepted-but-unsettled delivery quarantined if the database write failed', async () => {
    const app = setup({settle: async () => false});
    assert.equal((await app.dispatch(event())).status,503);
    assert.equal((await app.dispatch(event())).status,503); assert.equal(app.sends(),1);
  });
  it('records explicit provider 429 as retryable, permanent 4xx as rejected', async () => {
    for (const [code,state] of [[429,'retryable'],[400,'rejected']]) {
      const app=setup({fetcher:async()=>new Response('',{status:code})});
      assert.equal((await app.dispatch(event())).status,code===429?429:503);
      assert.deepEqual([...app.ledger.values()],[state]);
    }
  });
  it('fails closed on quota rejection, unavailable DB, disposable or temporary DNS', async () => {
    for (const [overrides,status] of [
      [{reserve:async()=>({outcome:'blocked'})},429], [{reserve:async()=>{throw Error();}},503],
      [{verifyDns:async()=>({status:'temporary-dns-failure'})},503], [{verifyDns:async()=>({status:'nonexistent-domain'})},400],
    ]) { const app=setup(overrides); assert.equal((await app.dispatch(event())).status,status); assert.equal(app.sends(),0); }
    const app=setup(); assert.equal((await app.dispatch({...event(),user:{...event().user,email:'x@mailinator.com'}})).status,403);
  });
});

describe('delivery RPC adapter fails closed', () => {
  const limits={hourly:30,daily:100,perEmail:5,cooldownSeconds:60};
  const input={email:'synthetic@libero.it',deliveryKey:'a'.repeat(64)};
  function repo(result) {return createAuthDeliveryRepository({rpc:()=>({abortSignal:async()=>result})},limits);}
  it('requires explicit daily capacity and validates admission response', async () => {
    assert.throws(()=>createAuthDeliveryRepository({}, {...limits,daily:null}));
    for (const data of [null,{}, {outcome:'send'}, {outcome:'send',attemptId:'invalid'}, {allowed:true}]) await assert.rejects(repo({data,error:null}).reserve(input));
    assert.deepEqual(await repo({data:{outcome:'send',attemptId},error:null}).reserve(input),{outcome:'send',attemptId});
  });
  it('rejects DB errors and does not interpret truthy settlement objects as success', async () => {
    await assert.rejects(repo({data:{outcome:'accepted'},error:{message:'error'}}).reserve(input));
    assert.equal(await repo({data:{ok:true},error:null}).settle({...input,attemptId,state:'accepted'}),false);
  });
});

it('actual Edge entry diagnoses missing secrets without disclosing values and authenticates when ready',async()=>{
  const previous=globalThis.Deno, previousError=console.error, previousFetch=globalThis.fetch;
  const complete={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_synthetic'}),BREVO_API_KEY:'synthetic-brevo-key',SEND_EMAIL_HOOK_SECRET:secret};
  try {
    for (const [env,expectedCode,expectedStatus] of [
      [{...complete,SEND_EMAIL_HOOK_SECRET:''},'HOOK_SIGNING_SECRET_MISSING',503],
      [{...complete,BREVO_API_KEY:''},'BREVO_KEY_MISSING',503],
      [{...complete,SUPABASE_SECRET_KEYS:'malformed-private-value'},'BACKEND_ENV_INVALID',503],
      [{...complete,SEND_EMAIL_HOOK_SECRET:'private-invalid-signature'},'HOOK_CONFIGURATION_INVALID',503],
      [complete,null,401],
    ]) {
      let handler; const logs=[];
      console.error=(...args)=>logs.push(args.join(' '));
      globalThis.fetch=()=>{throw Error('No network allowed');};
      globalThis.Deno={env:{get(name){return env[name];}},serve(value){handler=value;}};
      await import(`../../../../../supabase/functions/auth-send-email/index.mjs?bootstrap=${Math.random()}`);
      assert.equal((await handler(new Request('https://hook.example.com',{method:'POST',body:'{}'}))).status,expectedStatus);
      assert.deepEqual(logs,expectedCode?[`[auth-send-email] startup:${expectedCode}`]:[]);
      assert.ok(!JSON.stringify(logs).includes('private-'));
    }
  } finally {console.error=previousError;globalThis.fetch=previousFetch;if(previous===undefined)delete globalThis.Deno;else globalThis.Deno=previous;}
});

it('RPC deadline aborts the request and cannot turn an uncertain reservation into a send', async()=>{
  let signal;
  const repo=createAuthDeliveryRepository({rpc:()=>({abortSignal(value){signal=value;return new Promise(()=>{});}})}, {hourly:30,daily:100,perEmail:5,cooldownSeconds:60});
  await assert.rejects(repo.reserve({email:'synthetic@libero.it',deliveryKey:'a'.repeat(64)}));
  assert.equal(signal.aborted,true);
});
