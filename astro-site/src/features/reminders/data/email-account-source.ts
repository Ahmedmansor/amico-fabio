import type {SupabaseClient} from '@supabase/supabase-js';
import {createAccountRepository} from '../../wishlist/data/account-repository.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {validatedMailAddress} from '../domain/delivery.ts';

/** Backend-only recipient lookup; email comes from verified Auth, never request
 * JSON/user_metadata. Wishlist reads reuse the owning feature's repository. */
export function createEmailAccountSource(identityClient:Pick<SupabaseClient,'auth'>,wishlistClient:Pick<SupabaseClient,'from'>,allowedRecipients:readonly string[],timeoutMs:number){
  const recipients=new Set(allowedRecipients.map(validatedMailAddress));
  if(!recipients.size)throw new Error('[wishlist-email] Explicit recipient allowlist required.');
  // The admin client verifies only the destination. Favorites must use the
  // current request's authenticated client so the existing ownership RLS runs.
  const wishlist=createAccountRepository(wishlistClient,timeoutMs);
  return {
    async recipient(userId:string):Promise<{ok:true;email:string}|{ok:false}>{
      if(!isPreferenceRequestId(userId))return {ok:false};
      try{
        const {data,error}=await identityClient.auth.admin.getUserById(userId);
        const user=data.user;
        if(error || !user || user.id!==userId || !user.email_confirmed_at || !user.email || !recipients.has(user.email))return {ok:false};
        return {ok:true,email:validatedMailAddress(user.email)};
      }catch{return {ok:false};}
    },
    favorites:(userId:string)=>wishlist.list(userId),
  };
}
