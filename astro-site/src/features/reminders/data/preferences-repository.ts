import type {SupabaseClient} from '@supabase/supabase-js';
import {isLocale} from '../../../shared/config/languages.ts';
import {isPreferenceRequestId,type EmailPreference,type PreferenceRepository,type PreferenceResult} from '../domain/preferences.ts';

function preference(value:unknown):EmailPreference{
  if(!value||typeof value!=='object')throw new Error('Invalid preference.');
  const row=value as Record<string,unknown>;
  if(typeof row.enabled!=='boolean'||!isLocale(row.locale)||typeof row.wording_version!=='string'
    ||!row.wording_version||typeof row.updated_at!=='string'||!Number.isFinite(Date.parse(row.updated_at)))
    throw new Error('Invalid preference fields.');
  if(row.enabled ? typeof row.enabled_since!=='string'||!Number.isFinite(Date.parse(row.enabled_since)) : row.enabled_since!==null)
    throw new Error('Invalid consent start.');
  return {enabled:row.enabled,locale:row.locale,wordingVersion:row.wording_version,updatedAt:row.updated_at,enabledSince:row.enabled_since as string|null};
}

/** Inject a trusted backend client only. No browser import, env read or secret logging. */
export function createPreferenceRepository(client:Pick<SupabaseClient,'from'|'rpc'>|null,timeoutMs:number):PreferenceRepository{
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new Error('[reminders] Explicit positive request deadline required.');
  async function request<T>(query:(signal:AbortSignal)=>PromiseLike<T>):Promise<T>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{return await query(controller.signal);}finally{clearTimeout(timer);}
  }
  const failure=():PreferenceResult<never>=>({ok:false,reason:'failed'});
  return {
    async read(userId){
      if(!client)return {ok:false,reason:'unavailable'};
      if(!isPreferenceRequestId(userId))return {ok:false,reason:'invalid-input'};
      try{
        const {data,error}=await request(signal=>client.from('wishlist_email_preferences').select('enabled,locale,wording_version,updated_at,enabled_since').eq('user_id',userId).abortSignal(signal).maybeSingle());
        if(error)return failure();
        return {ok:true,value:data===null?null:preference(data)};
      }catch{return failure();}
    },
    async change(userId,input){
      if(!client)return {ok:false,reason:'unavailable'};
      if(!isPreferenceRequestId(userId))return {ok:false,reason:'invalid-input'};
      try{
        // Atomic ledger + current state, restricted to the backend database role.
        const {data,error}=await request(signal=>client.rpc('change_wishlist_email_preference_v2',{
          p_user_id:userId,p_request_id:input.requestId,p_enabled:input.enabled,
          p_locale:input.locale,p_consent_locale:input.consentLocale??input.locale,
          p_wording_version:input.wordingVersion,p_source:'wishlist-page',
        }).abortSignal(signal));
        if(error||!Array.isArray(data)||data.length!==1)return failure();
        return {ok:true,value:preference(data[0])};
      }catch{return failure();}
    },
  };
}
