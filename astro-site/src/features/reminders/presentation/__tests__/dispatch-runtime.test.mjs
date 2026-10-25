import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createDispatchRuntime} from '../dispatch-runtime.ts';
import {readDispatchConfig} from '../../data/dispatch-config.ts';
import {buildEmailCatalog} from '../../domain/catalog.ts';
import {hashManagementToken} from '../../data/management-service.ts';
import {reminderWebhookToken} from '../../data/dispatch-webhook.ts';
const userId='00000000-0000-4000-8000-000000000001',deliveryId='00000000-0000-4000-8000-000000000002',leaseId='00000000-0000-4000-8000-000000000003';
const origin='https://dispatch-qa.invalid',supabaseUrl='https://backend-qa.invalid',cronToken='a'.repeat(64),backendKey='sb_secret_'+'b'.repeat(48);
async function fixture(locale='en',mode='accepted'){
  const calls=[],sent=[];let state='queued',sealed=null,eligible=true,failFinish=mode==='lost-settlement',throttled=mode==='throttled',webhookReady=false;
  const config=readDispatchConfig({batchSize:1,leaseSeconds:120,dailyLimit:2,attemptLimit:3,retrySeconds:60,timeoutMs:1000,
    managementLifetimeMs:60000,allowedRecipients:['allowed@example.test'],accountIds:[userId],senderEmail:'sender@example.test',senderName:'Fabio Egypt',
    catalogOrigin:origin,catalogMaxAgeMs:60000,environment:'test',maxResponseBytes:65536,maxRequestBytes:2097152}); // synthetic policy only
  const catalog=buildEmailCatalog(['trip','package'].map(kind=>({kind,id:'saved',slug:'saved',adult_price:25,
    localized:Object.fromEntries(['it','en'].map(code=>[code,{title:`${kind} ${code}`,url:`${origin}/${code}/${kind==='trip'?'tours':'packages'}/saved/`}])),
    image:{url:origin+'/poster.jpg',width:640,height:400}})),origin,new Date().toISOString(),'test');
  const fetcher=async(url,init={})=>{
    const path=new URL(url).pathname,body=init.body?JSON.parse(init.body):null;calls.push({path,body});
    if(path.endsWith('/verify_wishlist_reminder_cron'))return Response.json(body.p_token_hash===await hashManagementToken(cronToken));
    if(path.endsWith('/claim_wishlist_reminders')){if(!['queued'].includes(state))return Response.json([]);state='leased';return Response.json([{delivery_id:deliveryId,user_id:userId,lease_id:leaseId,locale,payload:sealed}]);}
    if(path.includes('/admin/users/'))return Response.json({id:userId,email:'allowed@example.test',email_confirmed_at:new Date().toISOString()});
    if(path.endsWith('/read_reminder_wishlist_items'))return Response.json([{kind:'trip',id:'saved'},{kind:'package',id:'saved'}]);
    if(path==='/tours-manifest.json')return Response.json(catalog);
    if(path.endsWith('/issue_wishlist_correspondence_token'))return Response.json(true);
    if(path.endsWith('/seal_wishlist_reminder')){sealed=body.p_payload;return Response.json(true);}
    if(path.endsWith('/begin_wishlist_reminder')){if(!eligible)return Response.json(false);state='sending';return Response.json(true);}
    if(path==='/v3/smtp/email'){
      sent.push(body);if(mode==='unknown')throw new Error('Synthetic lost provider response');
      if(throttled){throttled=false;return Response.json({code:'rate_limit'},{status:429,headers:{'Retry-After':'120'}});}
      return Response.json({messageId:'<accepted@example.test>'},{status:201});
    }
    if(path.endsWith('/finish_wishlist_reminder')){if(failFinish){failFinish=false;return Response.json({message:'synthetic outage'},{status:503});}
      state=body.p_status==='retry'?'queued':body.p_status;return Response.json(true);}
    if(path.endsWith('/release_wishlist_reminder')){state='queued';return Response.json(true);}
    if(path.endsWith('/record_wishlist_reminder_event')){state='accepted';return Response.json(true);}
    if(path==='/v3/webhooks'&&!init.method)return Response.json({webhooks:[]});
    if(path==='/v3/webhooks'&&init.method==='POST')return Response.json({id:123},{status:201});
    if(path.endsWith('/confirm_wishlist_reminder_webhook')){webhookReady=true;return Response.json(true);}
    throw new Error('Unexpected synthetic network path: '+path);
  };
  const client=createClient(supabaseUrl,backendKey,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:fetcher}});
  const handle=await createDispatchRuntime({client,config,apiKey:'synthetic-brevo',backendKey,supabaseUrl,fetcher});
  const run=()=>handle(new Request(supabaseUrl+'/functions/v1/wishlist-reminder-dispatch',{method:'POST',headers:{'x-fabio-reminder-token':cronToken}}));
  return {run,handle,calls,sent,config,block:()=>{eligible=false;},state:()=>state,ready:()=>webhookReady};
}
test('complete IT/EN claimed-account flow sends all groups with localized management link and consumes one reminder',async()=>{
  for(const locale of ['it','en']){const f=await fixture(locale);assert.equal((await f.run()).status,200);assert.equal(f.sent.length,1);
    const mail=f.sent[0];assert.deepEqual(mail.to,[{email:'allowed@example.test',contactPixelTrackingConsent:false}]);
    assert.ok(mail.htmlContent.includes(`lang="${locale}"`));assert.ok(mail.textContent.includes(`trip ${locale}`));assert.ok(mail.textContent.includes(`package ${locale}`));
    assert.ok(mail.textContent.includes(`/${locale}/email-preferences/#token=`));assert.equal(JSON.parse(mail.headers['X-Mailin-custom']).deliveryId,deliveryId);
    assert.deepEqual(f.calls.find(call=>call.path.endsWith('/claim_wishlist_reminders')).body.p_user_ids,[userId]);
    await f.run();assert.equal(f.sent.length,1);assert.equal(f.state(),'accepted');}
});
test('withdrawal detected by the final DB gate prevents provider HTTP even after message preparation',async()=>{
  const f=await fixture();f.block();await f.run();assert.equal(f.sent.length,0);
});
test('unknown provider outcome is never automatically retried; failed settlement does not produce another send',async()=>{
  for(const mode of ['unknown','lost-settlement']){const f=await fixture('en',mode);await f.run();await f.run();assert.equal(f.sent.length,1);assert.ok(['unknown','sending'].includes(f.state()));}
});
test('429 keeps the identical sealed message, recipient and idempotency key',async()=>{
  const f=await fixture('it','throttled');await f.run();await f.run();assert.equal(f.sent.length,2);assert.deepEqual(f.sent[0],f.sent[1]);
  assert.equal(f.calls.filter(call=>call.path.endsWith('/issue_wishlist_correspondence_token')).length,1);
});
test('authenticated provider event reconciles a lost acceptance without trusting its claimed recipient',async()=>{
  const f=await fixture('en','lost-settlement');await f.run();
  const url=supabaseUrl+'/functions/v1/wishlist-reminder-dispatch/webhook';
  const body=JSON.stringify({event:'request','message-id':'<accepted@example.test>','X-Mailin-custom':JSON.stringify({deliveryId}),email:'forged@example.test'});
  assert.equal((await f.handle(new Request(url,{method:'POST',headers:{'Content-Type':'application/json'},body}))).status,401);
  assert.equal((await f.handle(new Request(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await reminderWebhookToken(backendKey)},body}))).status,204);
  assert.equal(f.state(),'accepted');const event=f.calls.find(call=>call.path.endsWith('/record_wishlist_reminder_event')).body;
  assert.equal('email' in event,false);await f.run();assert.equal(f.sent.length,1);
});
test('fixed webhook bootstrap is authenticated and marks readiness only after provider confirmation',async()=>{
  const f=await fixture(),url=supabaseUrl+'/functions/v1/wishlist-reminder-dispatch/configure-webhook';
  assert.equal((await f.handle(new Request(url,{method:'POST'}))).status,401);
  assert.equal((await f.handle(new Request(url,{method:'POST',headers:{'x-fabio-reminder-token':cronToken}}))).status,200);
  assert.equal(f.ready(),true);assert.equal(f.sent.length,0);
});
