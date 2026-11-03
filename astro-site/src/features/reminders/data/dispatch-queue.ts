import type {SupabaseClient} from '@supabase/supabase-js';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {isLocale} from '../../../shared/config/languages.ts';
import {validWishlistDelivery} from '../domain/delivery.ts';
import type {DispatchQueue,DispatchLease} from '../domain/dispatch.ts';
export interface DispatchPolicy {batchSize:number;leaseSeconds:number;dailyLimit:number;attemptLimit:number;retrySeconds:number;timeoutMs:number}
export function createDispatchQueue(client:Pick<SupabaseClient,'rpc'>,policy:DispatchPolicy,accountIds:readonly string[]|null):DispatchQueue{
  if(Object.values(policy).some(value=>!Number.isSafeInteger(value)||value<1||value>2147483647)
    ||policy.batchSize>50||policy.leaseSeconds<10||policy.leaseSeconds>3600)throw new Error('[reminders] Explicit dispatch policy required.');
  if(accountIds!==null&&(!accountIds.length||accountIds.some(id=>!isPreferenceRequestId(id))))throw new Error('[reminders] Invalid account scope.');
  async function rpc(name:string,args:Record<string,unknown>){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),policy.timeoutMs);
    try{const {data,error}=await client.rpc(name,args).abortSignal(controller.signal);if(error)throw new Error('[reminders] Queue unavailable.');return data;}
    finally{clearTimeout(timer);}}
  const identity=(job:DispatchLease)=>({p_job_id:job.deliveryId,p_lease_id:job.leaseId});
  return {
    async claim(){const data=await rpc('claim_wishlist_reminders',{p_batch:policy.batchSize,p_lease_seconds:policy.leaseSeconds,p_user_ids:accountIds});
      if(!Array.isArray(data)||data.length>policy.batchSize)throw new Error('[reminders] Invalid queue response.');
      return data.map(row=>{
        if(!isPreferenceRequestId(row.delivery_id)||!isPreferenceRequestId(row.user_id)||!isPreferenceRequestId(row.lease_id)||!isLocale(row.locale)
          ||(row.payload!==null&&(!validWishlistDelivery(row.payload)||row.payload.deliveryId!==row.delivery_id)))throw new Error('[reminders] Invalid queue lease.');
        return {deliveryId:row.delivery_id,userId:row.user_id,leaseId:row.lease_id,locale:row.locale,payload:row.payload};});},
    async seal(job,message,expiresAt){if(!validWishlistDelivery(message)||message.deliveryId!==job.deliveryId||!Number.isFinite(Date.parse(expiresAt)))return false;
      return await rpc('seal_wishlist_reminder',{...identity(job),p_payload:message,p_expires_at:expiresAt})===true;},
    async begin(job){return await rpc('begin_wishlist_reminder',{...identity(job),p_daily_limit:policy.dailyLimit,p_attempt_limit:policy.attemptLimit})===true;},
    async finish(job,result){return await rpc('finish_wishlist_reminder',{...identity(job),p_status:result.status,
      p_message_id:result.status==='accepted'?result.messageId:null,p_retry_seconds:result.status==='retry'?result.seconds:null,p_attempt_limit:policy.attemptLimit})===true;},
    async release(job){await rpc('release_wishlist_reminder',{...identity(job),p_retry_seconds:policy.retrySeconds});},
  };
}
