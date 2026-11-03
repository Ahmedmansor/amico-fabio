import type {SupabaseClient} from '@supabase/supabase-js';
import type {DispatchConfig} from '../data/dispatch-config.ts';
import {createDispatchQueue} from '../data/dispatch-queue.ts';
import {createDispatchAccount} from '../data/dispatch-account.ts';
import {createManagementIssuer} from '../data/management-issuer.ts';
import {hashManagementToken} from '../data/management-service.ts';
import {createBrevoDelivery} from '../data/brevo-delivery.ts';
import {createEmailCatalogSource} from '../data/email-catalog-source.ts';
import {createReminderWebhookSetup,reminderWebhookToken,WebhookSetupError} from '../data/dispatch-webhook.ts';
import {createReminderDispatcher} from './dispatch-reminders.ts';
import {createDispatchHandler,createReminderWebhook} from './dispatch-handler.ts';
/** One backend composition; all HTTP dispatch inputs are fixed configuration.
 * Browser sessions and model-side tools never receive runtime credentials. */
export async function createDispatchRuntime(options:{client:SupabaseClient;config:DispatchConfig;apiKey:string;backendKey:string;supabaseUrl:string;fetcher:typeof fetch}){
  const {client,config}=options;
  const rpc=async(name:string,args:Record<string,unknown>)=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.policy.timeoutMs);
    try{const {data,error}=await client.rpc(name,args).abortSignal(controller.signal);if(error)throw new Error('[reminders] Backend unavailable.');return data;}
    finally{clearTimeout(timer);}
  };
  const authorize=async(request:Request)=>{const token=request.headers.get('x-fabio-reminder-token');
    return !!token&&/^[a-f0-9]{64}$/.test(token)&&await rpc('verify_wishlist_reminder_cron',{p_token_hash:await hashManagementToken(token)})===true;};
  const account=createDispatchAccount(client,config.allowedRecipients,config.policy.timeoutMs);
  const issuer=createManagementIssuer(client,{lifetimeMs:config.managementLifetimeMs,timeoutMs:config.policy.timeoutMs,now:Date.now});
  const catalog=createEmailCatalogSource({url:config.catalogOrigin+'/tours-manifest.json',origin:config.catalogOrigin,environment:config.environment,
    maxAgeMs:config.catalogMaxAgeMs,now:Date.now,fetcher:options.fetcher,timeoutMs:config.policy.timeoutMs,maxResponseBytes:config.maxResponseBytes});
  const delivery=createBrevoDelivery({apiKey:options.apiKey,sender:config.sender,allowedRecipients:config.allowedRecipients,correlateDelivery:true,
    isDispatchAllowed:()=>true,fetcher:options.fetcher,timeoutMs:config.policy.timeoutMs,maxResponseBytes:config.maxResponseBytes,maxRequestBytes:config.maxRequestBytes});
  const dispatcher=createReminderDispatcher({queue:createDispatchQueue(client,config.policy,config.accountIds),catalog,recipient:account.recipient,favorites:account.favorites,
    management:issuer.issueWithExpiry,delivery,environment:config.environment,retrySeconds:config.policy.retrySeconds});
  const handleDispatch=createDispatchHandler(dispatcher,authorize),webhookToken=await reminderWebhookToken(options.backendKey);
  const webhook=createReminderWebhook({secret:webhookToken,maxBytes:config.maxRequestBytes,timeoutMs:config.policy.timeoutMs,
    record:async event=>await rpc('record_wishlist_reminder_event',{p_job_id:event.deliveryId,p_message_id:event.messageId,p_event:event.event})===true});
  const setup=createReminderWebhookSetup({apiKey:options.apiKey,url:options.supabaseUrl+'/functions/v1/wishlist-reminder-dispatch/webhook',
    token:webhookToken,fetcher:options.fetcher,timeoutMs:config.policy.timeoutMs,maxBytes:config.maxResponseBytes});
  return async(request:Request)=>{
    const path=new URL(request.url).pathname;
    if(path.endsWith('/webhook'))return webhook(request);
    if(path.endsWith('/configure-webhook')){
      if(request.method!=='POST')return new Response(null,{status:405});
      try{if(!await authorize(request))return new Response(null,{status:401});
        await setup.configure();if(await rpc('confirm_wishlist_reminder_webhook',{})!==true)throw new Error('Not ready.');
        return Response.json({status:'configured'},{headers:{'Cache-Control':'no-store'}});
      }catch(error){return Response.json({error:'unavailable',...(error instanceof WebhookSetupError?{stage:error.stage,status:error.status,reason:error.reason}:{})},{status:503});}
    }
    if(!path.endsWith('/wishlist-reminder-dispatch'))return new Response(null,{status:404});
    return handleDispatch(request);
  };
}
