import type {SupabaseClient} from '@supabase/supabase-js';
import {isManagementToken,parseManagementState,type ManagementRepository} from '../domain/management.ts';
/** Inject backend-only client. No raw token reaches Postgres or provider errors reach UI. */
export function createManagementRepository(client:Pick<SupabaseClient,'rpc'>,timeoutMs:number):ManagementRepository{
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new Error('[reminders] Management deadline required.');
  return {async run(hash,command){
    if(!isManagementToken(hash))return {ok:false,reason:'invalid-link'};
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const {data,error}=await client.rpc('manage_wishlist_correspondence',{
        p_token_hash:hash,p_operation:command.operation,p_request_id:command.operation==='read'?null:command.requestId,
        p_locale:command.operation==='language'?command.locale:null,
        p_expected_revision:command.operation==='language'?command.expectedRevision:null,
        p_consent_locale:command.operation==='unsubscribe'?command.consentLocale:null,
      }).abortSignal(controller.signal);
      if(error||!Array.isArray(data)||data.length>1)return {ok:false,reason:'unavailable'};
      if(!data.length)return {ok:false,reason:'invalid-link'};
      const row=data[0],state=parseManagementState({enabled:row.enabled,locale:row.locale,revision:row.revision});
      return state&&typeof row.conflict==='boolean'?{ok:true,state,conflict:row.conflict}:{ok:false,reason:'unavailable'};
    }catch{return {ok:false,reason:'unavailable'};}finally{clearTimeout(timer);}
  }};
}
