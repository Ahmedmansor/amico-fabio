import type {SupabaseClient} from '@supabase/supabase-js';
import type {Locale} from '../../../shared/config/languages.ts';
export interface SummaryTestLedger {
  claim(jobId:string,userId:string,locale:Locale):Promise<{outcome:'new'|'unknown'}|{outcome:'accepted';messageId:string}>;
  finish(jobId:string,userId:string,locale:Locale,status:'accepted'|'retryable'|'unknown',messageId:string|null):Promise<void>;
}
/** Private QA deduplication, separate from real reminder eligibility/allowance. */
export function createSummaryTestLedger(client:Pick<SupabaseClient,'rpc'>,timeoutMs:number):SummaryTestLedger{
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new Error('[wishlist-email] QA deadline required.');
  const rpc=async(name:string,args:Record<string,unknown>)=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeoutMs);
    try{const {data,error}=await client.rpc(name,args).abortSignal(c.signal);if(error)throw new Error('[wishlist-email] QA ledger unavailable.');return data;}finally{clearTimeout(timer);}};
  return {async claim(jobId,userId,locale){const data=await rpc('claim_wishlist_summary_test',{p_job_id:jobId,p_user_id:userId,p_locale:locale});
    if(!Array.isArray(data)||data.length!==1)throw new Error('[wishlist-email] Invalid QA lease.');const row=data[0];
    if(row.outcome==='accepted'&&typeof row.message_id==='string'&&row.message_id.length&& !/[\r\n]/.test(row.message_id))return {outcome:'accepted',messageId:row.message_id};
    if(['new','unknown'].includes(row.outcome))return {outcome:row.outcome};throw new Error('[wishlist-email] Invalid QA lease.');
  },async finish(jobId,userId,locale,status,messageId){if(await rpc('finish_wishlist_summary_test',{p_job_id:jobId,p_user_id:userId,p_locale:locale,p_status:status,p_message_id:messageId})!==true)throw new Error('[wishlist-email] QA result not confirmed.');}};
}
