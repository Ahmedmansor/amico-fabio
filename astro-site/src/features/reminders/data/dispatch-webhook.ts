import {createPreferenceFetch} from './preference-runtime-config.ts';
/** Domain-separated token stays between server runtime and Brevo, never returned. */
export async function reminderWebhookToken(backendKey:string):Promise<string>{
  if(backendKey.length<32)throw new Error('[reminders] Runtime binding required.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(backendKey),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const value=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('fabio-wishlist-reminder-webhook:v1'));
  return Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,'0')).join('');
}
/** Only called by separately authorized fixed bootstrap, never on normal send.
 * Never modifies unrelated hooks or returns authentication fields. */
export function createReminderWebhookSetup(options:{apiKey:string;url:string;token:string;fetcher:typeof fetch;timeoutMs:number;maxBytes:number}){
  const url=new URL(options.url);if(url.protocol!=='https:'||url.search||url.hash||url.username||url.password||!options.apiKey||!/^[a-f0-9]{64}$/.test(options.token))throw new Error('[reminders] Invalid callback configuration.');
  const request=createPreferenceFetch(options.fetcher,options.timeoutMs,options.maxBytes),description='Fabio Egypt wishlist reminder events';
  const headers={'api-key':options.apiKey,'Content-Type':'application/json',Accept:'application/json'};
  return {async configure(){
    const response=await request('https://api.brevo.com/v3/webhooks?type=transactional',{headers,credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw new Error('[reminders] Callback lookup unavailable.');
    const data=await response.json();if(!Array.isArray(data.webhooks))throw new Error('[reminders] Invalid callback lookup.');
    const matches=data.webhooks.filter((hook:{url?:string})=>hook.url===url.href);
    if(matches.length>1||matches.some((hook:{description?:string})=>hook.description!==description))throw new Error('[reminders] Callback ownership needs review.');
    const existing=matches[0];if(existing&&(!Number.isSafeInteger(existing.id)||existing.id<1))throw new Error('[reminders] Invalid callback identity.');
    const payload={url:url.href,description,batched:false,events:['sent','delivered','hardBounce','softBounce','blocked','spam','invalid','unsubscribed'],auth:{type:'bearer',token:options.token}};
    const saved=await request('https://api.brevo.com/v3/webhooks'+(existing?'/'+existing.id:''),{method:existing?'PUT':'POST',headers,
      body:JSON.stringify(existing?payload:{...payload,type:'transactional'}),credentials:'omit',referrerPolicy:'no-referrer'});
    if(!saved.ok)throw new Error('[reminders] Callback setup unavailable.');
    return true;
  }};
}
