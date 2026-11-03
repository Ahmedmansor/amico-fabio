import type {SupabaseClient} from '@supabase/supabase-js';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {assertPreferenceRatePolicy,type PreferenceLimiter,type PreferenceRatePolicy} from '../domain/preference-limits.ts';

/** Database-backed across Edge instances. No process-local fallback. */
export function createPreferenceLimiter(client:Pick<SupabaseClient,'rpc'>,policy:PreferenceRatePolicy):PreferenceLimiter {
  assertPreferenceRatePolicy(policy);
  return {async take(userId,operation){
    if(!isPreferenceRequestId(userId)||!['read','write'].includes(operation))return {status:'unavailable'};
    try {
      const {data,error}=await client.rpc('consume_wishlist_preference_limit',{
        p_user_id:userId,p_operation:operation,p_limit:policy[operation].limit,p_window_seconds:policy[operation].windowSeconds,
      });
      if(error||!Array.isArray(data)||data.length!==1)return {status:'unavailable'};
      const row=data[0];
      if(row?.allowed===true && row.retry_after_seconds===0)return {status:'allowed'};
      if(row?.allowed===false && Number.isSafeInteger(row.retry_after_seconds)
        && row.retry_after_seconds>0 && row.retry_after_seconds<=policy[operation].windowSeconds)
        return {status:'limited',retryAfterSeconds:row.retry_after_seconds};
      return {status:'unavailable'};
    }catch{return {status:'unavailable'};}
  }};
}
