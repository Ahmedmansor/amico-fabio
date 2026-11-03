import type {SupabaseClient} from '@supabase/supabase-js';
import {validatedMailAddress} from '../domain/delivery.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {createReminderWishlistReader} from '../../wishlist/data/reminder-reader.ts';
/** Trusted claimed IDs only. Neither destination nor wishlist is accepted from HTTP. */
export function createDispatchAccount(client:Pick<SupabaseClient,'rpc'|'auth'>,allowedRecipients:readonly string[],timeoutMs:number){
  const allowed=new Set(allowedRecipients.map(validatedMailAddress));
  if(!allowed.size)throw new Error('[reminders] Explicit dispatch recipient allowlist required.');
  const wishlist=createReminderWishlistReader(client,timeoutMs);
  return {favorites:(id:string)=>wishlist.list(id),async recipient(userId:string):Promise<string|null>{
    if(!isPreferenceRequestId(userId))return null;
    try{const {data,error}=await client.auth.admin.getUserById(userId),user=data.user;
      return !error&&user?.id===userId&&user.email&&allowed.has(user.email)&&user.email_confirmed_at&&Number.isFinite(Date.parse(user.email_confirmed_at))
        ?validatedMailAddress(user.email):null;
    }catch{return null;}
  }};
}
