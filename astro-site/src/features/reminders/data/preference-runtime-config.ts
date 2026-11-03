import {assertPreferenceRatePolicy,type PreferenceRatePolicy} from '../domain/preference-limits.ts';
export interface PreferenceRuntimeConfig {
  allowedOrigins:string[];maxBodyBytes:number;networkTimeoutMs:number;bodyTimeoutMs:number;
  maxUpstreamBytes:number;
  ratePolicy:PreferenceRatePolicy;
}
/** Nonsecret runtime settings only. No implicit production origin or quotas. */
export function readPreferenceRuntimeConfig(read:(name:string)=>string|undefined):PreferenceRuntimeConfig {
  function integer(name:string){
    const value=read(name);
    if(!value||!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1||Number(value)>2147483647)
      throw new Error(`[reminders] Missing or invalid ${name}.`);
    return Number(value);
  }
  const origins=read('REMINDER_PREFERENCE_ALLOWED_ORIGINS');
  if(!origins)throw new Error('[reminders] Explicit allowed origins required.');
  const allowedOrigins=[...new Set(origins.split(',').map(value=>value.trim()))];
  for(const origin of allowedOrigins){
    const url=new URL(origin),local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if(url.origin!==origin||(url.protocol!=='https:'&&!(local&&url.protocol==='http:')))
      throw new Error('[reminders] Invalid allowed origin.');
  }
  const ratePolicy={
    read:{limit:integer('REMINDER_PREFERENCE_READ_LIMIT'),windowSeconds:integer('REMINDER_PREFERENCE_READ_WINDOW_SECONDS')},
    write:{limit:integer('REMINDER_PREFERENCE_WRITE_LIMIT'),windowSeconds:integer('REMINDER_PREFERENCE_WRITE_WINDOW_SECONDS')},
  };
  assertPreferenceRatePolicy(ratePolicy);
  return {allowedOrigins,ratePolicy,maxBodyBytes:integer('REMINDER_PREFERENCE_MAX_BODY_BYTES'),
    networkTimeoutMs:integer('REMINDER_PREFERENCE_NETWORK_TIMEOUT_MS'),bodyTimeoutMs:integer('REMINDER_PREFERENCE_BODY_TIMEOUT_MS'),
    maxUpstreamBytes:integer('REMINDER_PREFERENCE_MAX_UPSTREAM_BYTES')};
}

/** Per-network-call abort, including Auth. Redirects cannot carry credentials away. */
export function createPreferenceFetch(fetcher:typeof fetch,timeoutMs:number,maxBytes:number):typeof fetch {
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||!Number.isSafeInteger(maxBytes)||maxBytes<1)throw new Error('[reminders] Request limits required.');
  return async(input,init)=>{
    const controller=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
    let timer:ReturnType<typeof setTimeout>;
    const timeout=new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>{
      controller.abort();void reader?.cancel().catch(()=>{});reject(new DOMException('Request timed out.','TimeoutError'));
    },timeoutMs);});
    const signals=[controller.signal];
    if(input instanceof Request)signals.push(input.signal);
    if(init?.signal)signals.push(init.signal);
    async function execute(){
      const response=await fetcher(input,{...init,redirect:'error',signal:AbortSignal.any(signals)});
      if(controller.signal.aborted)throw new DOMException('Request timed out.','TimeoutError');
      if(!response.body)return response;
      reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
      try{
        while(true){const chunk=await reader.read();if(controller.signal.aborted)throw new DOMException('Request timed out.','TimeoutError');if(chunk.done)break;
          size+=chunk.value.byteLength;if(size>maxBytes){void reader.cancel().catch(()=>{});throw new Error('[reminders] Upstream response too large.');}
          chunks.push(chunk.value);
        }
      }finally{reader.releaseLock();}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');
      return new Response(bytes,{status:response.status,statusText:response.statusText,headers});
    }
    try{return await Promise.race([execute(),timeout]);}finally{clearTimeout(timer!);}
  };
}
