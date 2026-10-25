import type {SupabaseClient} from '@supabase/supabase-js';
export interface ManagementRuntimeConfig {
  origins:string[];ingressLimit:number;ingressWindowSeconds:number;
  maxBodyBytes:number;bodyTimeoutMs:number;networkTimeoutMs:number;maxUpstreamBytes:number;
}
/** Explicit operational settings; no quota, identity-header or production defaults. */
export function readManagementRuntimeConfig(read:(name:string)=>string|undefined):ManagementRuntimeConfig{
  const integer=(suffix:string)=>{const value=read('WISHLIST_MANAGEMENT_'+suffix);
    if(!value||!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1||Number(value)>2147483647)
      throw new Error('[reminders] Explicit management limits required.');return Number(value);};
  const origins=[...new Set((read('WISHLIST_MANAGEMENT_ALLOWED_ORIGINS')??'').split(',').map(value=>value.trim()))];
  for(const origin of origins){const url=new URL(origin),local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
    if(url.origin!==origin||(url.protocol!=='https:'&&!(local&&url.protocol==='http:')))throw new Error('[reminders] Invalid management origin.');}
  return {origins,ingressLimit:integer('INGRESS_LIMIT'),ingressWindowSeconds:integer('INGRESS_WINDOW_SECONDS'),
    maxBodyBytes:integer('MAX_BODY_BYTES'),bodyTimeoutMs:integer('BODY_TIMEOUT_MS'),
    networkTimeoutMs:integer('NETWORK_TIMEOUT_MS'),maxUpstreamBytes:integer('MAX_UPSTREAM_BYTES')};
}
/** One fixed private bucket across instances, including invalid capabilities.
 * No IP/header, caller key or per-token bucket can grow/reset its budget. */
export function createManagementIngress(client:Pick<SupabaseClient,'rpc'>,config:ManagementRuntimeConfig){
  if([config.ingressLimit,config.ingressWindowSeconds,config.networkTimeoutMs].some(value=>!Number.isSafeInteger(value)||value<1||value>2147483647))
    throw new Error('[reminders] Invalid management ingress configuration.');
  return {async take():Promise<boolean>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.networkTimeoutMs);
    try{
      const {data,error}=await client.rpc('consume_wishlist_management_limit',{
        p_limit:config.ingressLimit,p_window_seconds:config.ingressWindowSeconds,
      }).abortSignal(controller.signal);
      if(!error&&Array.isArray(data)&&data.length===1){const row=data[0];
        if(row?.allowed===true&&row.retry_after_seconds===0)return true;
        if(row?.allowed===false&&Number.isSafeInteger(row.retry_after_seconds)&&row.retry_after_seconds>0&&row.retry_after_seconds<=config.ingressWindowSeconds)return false;}
      throw new Error('[reminders] Management ingress unavailable.');
    }finally{clearTimeout(timer);}
  }};
}
