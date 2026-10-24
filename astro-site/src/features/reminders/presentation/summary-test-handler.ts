import type {createWishlistSummarySender} from './send-wishlist-summary.ts';
import type {PreferenceUserResult} from './preferences-handler.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import type {Locale} from '../../../shared/config/languages.ts';

/** One explicitly authorized test job, never a general public email endpoint.
 * The same fixed Brevo key is reused throughout a window shorter than its
 * documented 30-minute deduplication TTL. No timers, automatic retry or Cron. */
export function createSummaryTestHandler(options:{
  sender:ReturnType<typeof createWishlistSummarySender>;
  verifyUser:(bearer:string)=>Promise<PreferenceUserResult>;
  userId:string;deliveryId:string;locale:Locale;
  allowedOrigin:string;createdAt:number;expiresAt:number;now:()=>number;bodyTimeoutMs:number;
}){
  if(!isPreferenceRequestId(options.userId)||!isPreferenceRequestId(options.deliveryId)
    ||!Number.isFinite(options.createdAt)||!Number.isFinite(options.expiresAt)
    ||options.expiresAt<=options.createdAt||options.expiresAt-options.createdAt>=30*60*1000)
    throw new Error('[wishlist-email] Explicit bounded test job required.');
  if(!Number.isSafeInteger(options.bodyTimeoutMs)||options.bodyTimeoutMs<1)throw new Error('[wishlist-email] Body deadline required.');
  if(new URL(options.allowedOrigin).origin!==options.allowedOrigin)throw new Error('[wishlist-email] Explicit test origin required.');
  return async(request:Request):Promise<Response>=>{
    const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'});
    const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
    const origin=request.headers.get('origin');
    if(origin&&origin!==options.allowedOrigin)return reply(403,{error:'origin-denied'});
    if(origin)headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Access-Control-Allow-Methods','POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Authorization, apikey');
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
      // Some runtimes expose an empty POST as a readable stream. Accept only
      // zero bytes, with a deadline; never accept a browser-selected recipient.
      if(request.body){
        const reader=request.body.getReader();let expired=false;
        const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},options.bodyTimeoutMs);
        try{while(true){const part=await reader.read();if(expired)return reply(408,{error:'request-timeout'});
          if(part.done)break;if(part.value.byteLength){void reader.cancel().catch(()=>{});return reply(400,{error:'body-not-allowed'});}
        }}finally{clearTimeout(timer);reader.releaseLock();}
      }
      if(options.now()>=options.expiresAt)return reply(410,{error:'test-expired'});
      const result=await options.sender.sendForUser(user.userId,options.locale,options.deliveryId);
      return reply(result.status==='accepted'?200:result.status==='empty'?409:result.status==='deferred'?429:503,result);
    }catch{return reply(503,{status:'unknown'});}
  };
}
