import type {SupabaseClient} from '@supabase/supabase-js';
import {isPreferenceRequestId} from '../domain/preferences.ts';

/** Auth verifies the token remotely; never decode claims or trust user_metadata.
 * Inject a backend Auth client configured with session persistence disabled. */
export function createPreferenceUserVerifier(client:Pick<SupabaseClient,'auth'>){
  return async(bearer:string):Promise<{ok:true;userId:string}|{ok:false;reason:'unauthenticated'|'unavailable'}>=>{
    try{
      const {data,error}=await client.auth.getUser(bearer);
      if(error)return {ok:false,reason:[400,401,403].includes(error.status??0)?'unauthenticated':'unavailable'};
      if(!isPreferenceRequestId(data.user?.id))return {ok:false,reason:'unauthenticated'};
      return {ok:true,userId:data.user.id};
    }catch{return {ok:false,reason:'unavailable'};}
  };
}
