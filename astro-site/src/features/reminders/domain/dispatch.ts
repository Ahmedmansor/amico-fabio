import type {WishlistDelivery,WishlistDeliveryResult} from './delivery.ts';
import type {Locale} from '../../../shared/config/languages.ts';
export interface DispatchLease {deliveryId:string;userId:string;leaseId:string;locale:Locale;payload:WishlistDelivery|null}
export type DispatchSettlement={status:'accepted';messageId:string}|{status:'retry';seconds:number}|{status:'unknown'|'failed'};
export interface DispatchQueue {
  claim():Promise<DispatchLease[]>;
  seal(job:DispatchLease,message:WishlistDelivery,expiresAt:string):Promise<boolean>;
  begin(job:DispatchLease):Promise<boolean>;
  finish(job:DispatchLease,result:DispatchSettlement):Promise<boolean>;
  release(job:DispatchLease):Promise<void>;
}
export function providerMessageId(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const normalized=value.startsWith('<')&&value.endsWith('>')?value.slice(1,-1):value;
  return normalized.length>0&&normalized.length<=512&&!/[\s<>\x00-\x1f]/.test(normalized)?normalized:null;
}
/** Only a definitive 429 is retried automatically. Timeout, malformed success,
 * duplicate acknowledgement and provider 5xx remain quarantined for reconciliation. */
export function settleDispatch(result:WishlistDeliveryResult,retrySeconds:number):DispatchSettlement{
  if(!Number.isSafeInteger(retrySeconds)||retrySeconds<1)throw new Error('[reminders] Retry policy required.');
  if(result.status==='accepted'){const messageId=providerMessageId(result.messageId);return messageId?{status:'accepted',messageId}:{status:'unknown'};}
  if(result.status==='deferred'){
    const seconds=result.retryAfterSeconds===null?retrySeconds:Math.max(retrySeconds,result.retryAfterSeconds);
    return Number.isSafeInteger(seconds)&&seconds>0&&seconds<=2147483647?{status:'retry',seconds}:{status:'unknown'};
  }
  return {status:result.status==='rejected'?'failed':'unknown'};
}
