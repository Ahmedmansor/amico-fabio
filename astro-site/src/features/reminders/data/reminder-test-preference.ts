import type {SupabaseClient} from '@supabase/supabase-js';
import {isPreferenceRequestId} from '../domain/preferences.ts';
export type ReminderTestPreference={enabled:boolean;locale:unknown}|null;
/** Server-only snapshot. Invalid saved locales use the real reminder fallback;
 * database failures must never be mistaken for a default preference. */
export function createReminderTestPreference(client:Pick<SupabaseClient,'from'>,timeoutMs:number){
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new Error('Explicit deadline required.');
  return async(userId:string):Promise<ReminderTestPreference>=>{
    if(!isPreferenceRequestId(userId))throw new Error('Verified account required.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const {data,error}=await client.from('wishlist_email_preferences').select('enabled,locale').eq('user_id',userId).abortSignal(controller.signal).maybeSingle();
      if(error||data&&typeof data.enabled!=='boolean')throw new Error('Preference unavailable.');
      return data?{enabled:data.enabled,locale:data.locale}:null;
    }finally{clearTimeout(timer);}
  };
}
