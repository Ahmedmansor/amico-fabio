import {validWishlistDelivery,validatedMailAddress,type WishlistDeliveryPort} from '../domain/delivery.ts';
import {createPreferenceFetch} from './preference-runtime-config.ts';

/** Real Brevo REST transport. Backend only; credentials are injected, not read
 * from local files. No SDK dependency, implicit retry, recipient lists or logs. */
export function createBrevoDelivery(options:{
  apiKey:string|null;sender:{email:string;name:string};allowedRecipients:readonly string[];
  isDispatchAllowed:()=>boolean;
  fetcher:typeof fetch;timeoutMs:number;maxResponseBytes:number;maxRequestBytes:number;
  correlateDelivery?:boolean;
}):WishlistDeliveryPort {
  const sender={email:validatedMailAddress(options.sender.email),name:options.sender.name};
  if(!sender.name.trim()||/[\r\n]/.test(sender.name))throw new Error('[wishlist-email] Invalid sender name.');
  const recipients=new Set(options.allowedRecipients.map(validatedMailAddress));
  if(!recipients.size)throw new Error('[wishlist-email] Explicit recipient allowlist required.');
  if(!Number.isSafeInteger(options.maxRequestBytes)||options.maxRequestBytes<1)throw new Error('[wishlist-email] Request size limit required.');
  const fetcher=createPreferenceFetch(options.fetcher,options.timeoutMs,options.maxResponseBytes);
  return {async send(input){
    if(!options.isDispatchAllowed())return {status:'rejected',reason:'unavailable'};
    if(!validWishlistDelivery(input))return {status:'rejected',reason:'invalid-input'};
    if(!recipients.has(input.recipient))return {status:'rejected',reason:'recipient-not-allowed'};
    if(!options.apiKey || /\s/.test(options.apiKey))return {status:'rejected',reason:'unavailable'};
    const body=JSON.stringify({sender,to:[{email:input.recipient,contactPixelTrackingConsent:false}],
      subject:input.content.subject,htmlContent:input.content.htmlContent,textContent:input.content.textContent,
      headers:{idempotencyKey:input.deliveryId,...(options.correlateDelivery?{'X-Mailin-custom':JSON.stringify({deliveryId:input.deliveryId})}:{})}});
    if(new TextEncoder().encode(body).byteLength>options.maxRequestBytes)return {status:'rejected',reason:'invalid-input'};
    try {
      const response=await fetcher('https://api.brevo.com/v3/smtp/email',{
        method:'POST',headers:{'api-key':options.apiKey,'Content-Type':'application/json',Accept:'application/json'},
        body,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',
      });
      if(response.status===429){
        const value=response.headers.get('retry-after');
        return {status:'deferred',retryAfterSeconds:value&&/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null};
      }
      let result:unknown;try{result=await response.json();}catch{return {status:'unknown'};}
      const row=result as Record<string,unknown>|null;
      if(response.status===201 && typeof row?.messageId==='string' && row.messageId.trim() && !/[\r\n]/.test(row.messageId))
        return {status:'accepted',messageId:row.messageId};
      // Brevo duplicate_parameter does not return the original acceptance ID.
      // Reconcile it; never turn it into another automatic send.
      if(row?.code==='duplicate_parameter')return {status:'unknown'};
      if([400,401,403,422].includes(response.status))return {status:'rejected',reason:'provider-rejected'};
      return {status:'unknown'};
    }catch{return {status:'unknown'};}
  }};
}
