import type {createReminderTestSender} from './send-reminder-test.ts';
import type {PreferenceUserResult} from './preferences-handler.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {isLocale,resolveLocale,type Locale} from '../../../shared/config/languages.ts';
import type {SummaryTestLedger} from '../data/summary-test-ledger.ts';
import type {ReminderTestPreference} from '../data/reminder-test-preference.ts';

/** Restricted QA only. Legacy jobs stay within provider deduplication lifetime;
 * durable jobs get separate immutable language IDs and private once-only ledger.
 * No timers, automatic retry or customer-facing immediate email feature. */
export function createSummaryTestHandler(options:{
  senderForBearer:(bearer:string)=>ReturnType<typeof createReminderTestSender>;
  readPreference:(userId:string)=>Promise<ReminderTestPreference>;
  verifyUser:(bearer:string)=>Promise<PreferenceUserResult>;
  userId:string;deliveryId:string;locale:Locale;
  allowedOrigin:string;createdAt:number;expiresAt:number;now:()=>number;bodyTimeoutMs:number;
  jobs?:Partial<Record<Locale,string>>|null;ledger?:SummaryTestLedger;
}){
  if(!isPreferenceRequestId(options.userId)||!isPreferenceRequestId(options.deliveryId)
    ||!isLocale(options.locale)
    ||!Number.isFinite(options.createdAt)||!Number.isFinite(options.expiresAt)
    ||options.expiresAt<=options.createdAt||options.expiresAt-options.createdAt>=(options.ledger?7*24*60*60*1000:30*60*1000))
    throw new Error('[wishlist-email] Explicit bounded test job required.');
  const jobs=new Map<Locale,string>([[options.locale,options.deliveryId]]);
  for(const [locale,id]of Object.entries(options.jobs??{})){
    if(!isLocale(locale)||!isPreferenceRequestId(id))throw new Error('[wishlist-email] Invalid language test job.');jobs.set(locale,id);
  }
  if(new Set(jobs.values()).size!==jobs.size)throw new Error('[wishlist-email] Each language needs a distinct immutable job.');
  if(!Number.isSafeInteger(options.bodyTimeoutMs)||options.bodyTimeoutMs<1)throw new Error('[wishlist-email] Body deadline required.');
  if(new URL(options.allowedOrigin).origin!==options.allowedOrigin)throw new Error('[wishlist-email] Explicit test origin required.');
  return async(request:Request):Promise<Response>=>{
    const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'});
    const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
    const origin=request.headers.get('origin');
    if(origin&&origin!==options.allowedOrigin)return reply(403,{error:'origin-denied'});
    if(origin)headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Access-Control-Allow-Methods','POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Authorization, Content-Type, apikey');
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,{error:'method-not-allowed'});
    const time=options.now();
    if(!Number.isFinite(time)||time<options.createdAt||time>=options.expiresAt)return reply(410,{error:'test-expired'});
    const bearer=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if(!bearer)return reply(401,{error:'unauthenticated'});
    try{
      const user=await options.verifyUser(bearer);
      if(!user.ok)return reply(user.reason==='unavailable'?503:401,{error:user.reason});
      if(user.userId!==options.userId)return reply(403,{error:'account-not-allowed'});
      // The browser cannot choose language, identity, recipient or job. The
      // server reads the same saved correspondence used by delayed reminders.
      if(request.body){
        const reader=request.body.getReader();let expired=false,size=0,text='';
        const decoder=new TextDecoder('utf-8',{fatal:true});
        const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},options.bodyTimeoutMs);
        try{while(true){const part=await reader.read();if(expired)return reply(408,{error:'request-timeout'});
          if(part.done)break;size+=part.value.byteLength;
          if(size>256){void reader.cancel().catch(()=>{});return reply(413,{error:'body-too-large'});}
          text+=decoder.decode(part.value,{stream:true});
        }
          text+=decoder.decode();
          if(size){
            if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return reply(415,{error:'json-required'});
            const body=JSON.parse(text);
            if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==0)
              return reply(400,{error:'invalid-input'});
          }
        }catch{return reply(expired?408:400,{error:expired?'request-timeout':'invalid-locale'});}
        finally{clearTimeout(timer);reader.releaseLock();}
      }
      const preference=await options.readPreference(user.userId);
      if(!preference?.enabled)return reply(409,{error:'reminder-disabled'});
      const locale=resolveLocale(preference.locale);
      if(options.now()>=options.expiresAt)return reply(410,{error:'test-expired'});
      // This endpoint represents ONE immutable test job. Its delivery key must
      // never acknowledge a different locale after provider deduplication.
      // A new authorized language test gets a new job configured in that locale.
      const deliveryId=jobs.get(locale);
      if(!deliveryId)return reply(409,{error:'job-locale-mismatch',locale:options.locale});
      // Switching language never creates another job or bypasses its fixed key.
      if(options.ledger){const lease=await options.ledger.claim(deliveryId,user.userId,locale);
        if(lease.outcome==='accepted')return reply(200,{status:'already-sent',locale});
        if(lease.outcome==='unknown')return reply(503,{status:'unknown'});
      }
      let result;
      try{result=await options.senderForBearer(bearer).sendForUser(user.userId,locale,deliveryId);}
      catch{if(options.ledger)await options.ledger.finish(deliveryId,user.userId,locale,'unknown',null);return reply(503,{status:'unknown'});}
      if(options.ledger)await options.ledger.finish(deliveryId,user.userId,locale,result.status==='accepted'?'accepted':['empty','blocked'].includes(result.status)?'retryable':'unknown',result.status==='accepted'?result.messageId:null);
      return reply(result.status==='accepted'?200:result.status==='empty'?409:result.status==='deferred'?429:503,
        result.status==='accepted'?{...result,locale}:result);
    }catch{return reply(503,{status:'unknown'});}
  };
}
