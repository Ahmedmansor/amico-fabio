import type {SupabaseClient} from '@supabase/supabase-js';
import {favoriteKey,normalizeWishlist} from '../domain/wishlist.ts';
/** Trusted claimed account only; narrow service-only RPC, never a browser API. */
export function createReminderWishlistReader(client:Pick<SupabaseClient,'rpc'>,timeoutMs:number){
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new Error('[wishlist] Reminder read deadline required.');
  return {async list(userId:string):Promise<string[]|null>{
    if(!/^[0-9a-f-]{36}$/i.test(userId))return null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{const {data,error}=await client.rpc('read_reminder_wishlist_items',{p_user_id:userId}).abortSignal(controller.signal);
      if(error||!Array.isArray(data)||data.some(row=>!['trip','package'].includes(row.kind)||typeof row.id!=='string'))return null;
      return normalizeWishlist(data.map(row=>favoriteKey(row.kind,row.id)));
    }catch{return null;}finally{clearTimeout(timer);}
  }};
}
