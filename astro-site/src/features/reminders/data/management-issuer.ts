import type {SupabaseClient} from '@supabase/supabase-js';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {correspondenceManagementUrl} from '../domain/management.ts';
import {isLocale,type Locale} from '../../../shared/config/languages.ts';
import {newManagementToken,hashManagementToken} from './management-service.ts';
/** Trusted future dispatcher only. Lifetime is an explicit release setting, no
 * guessed default. Retry the same email job with its same previously issued link. */
export function createManagementIssuer(client:Pick<SupabaseClient,'rpc'>,options:{lifetimeMs:number;timeoutMs:number;now:()=>number}){
  if([options.lifetimeMs,options.timeoutMs].some(value=>!Number.isSafeInteger(value)||value<1))throw new Error('[reminders] Reviewed capability lifetime/deadline required.');
  async function issueWithExpiry(userId:string,origin:string,locale:Locale):Promise<{url:string;expiresAt:string}|null>{
    if(!isPreferenceRequestId(userId)||!isLocale(locale))return null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),options.timeoutMs);
    try{
      const token=newManagementToken(),url=correspondenceManagementUrl(origin,locale,token);
      const expiresAt=new Date(options.now()+options.lifetimeMs).toISOString();
      const {data,error}=await client.rpc('issue_wishlist_correspondence_token',{
        p_user_id:userId,p_token_hash:await hashManagementToken(token),p_expires_at:expiresAt,
      }).abortSignal(controller.signal);
      return error||data!==true?null:{url,expiresAt};
    }catch{return null;}finally{clearTimeout(timer);}
  }
  return {issueWithExpiry,async issue(userId:string,origin:string,locale:Locale){return (await issueWithExpiry(userId,origin,locale))?.url??null;}};
}
