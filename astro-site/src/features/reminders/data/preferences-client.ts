import {isPreferenceRequestId,parseEmailPreference,parsePreferenceChange,type EmailPreference,type PreferenceChange} from '../domain/preferences.ts';

export type PreferenceClientFailure='unauthenticated'|'account-changed'|'outdated-consent'|'invalid-input'|'rate-limited'|'unavailable'|'failed';
export type PreferenceClientResult<T>={ok:true;value:T}|{ok:false;reason:PreferenceClientFailure};
export interface PreferenceClient {
  read(userId:string):Promise<PreferenceClientResult<EmailPreference|null>>;
  change(userId:string,input:PreferenceChange):Promise<PreferenceClientResult<EmailPreference>>;
}

/** Browser transport to the authenticated backend, never a direct table/RPC write.
 * Session access is supplied by Auth. Tokens live only in this request's headers. */
export function createPreferenceClient(options:{
  endpoint:string;
  session:()=>Promise<{userId:string;bearer:string}|null>;
  fetcher:typeof fetch;
  timeoutMs:number;
  maxResponseBytes:number;
}):PreferenceClient {
  const endpoint=new URL(options.endpoint);
  const local=['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname);
  if((endpoint.protocol!=='https:' && !(endpoint.protocol==='http:' && local))
    || endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
    throw new Error('[reminders] Invalid preference endpoint.');
  for(const value of [options.timeoutMs,options.maxResponseBytes])
    if(!Number.isSafeInteger(value)||value<1)throw new Error('[reminders] Explicit request limits required.');
  const failure=(reason:PreferenceClientFailure):PreferenceClientResult<never>=>({ok:false,reason});

  async function request(userId:string,input?:PreferenceChange):Promise<PreferenceClientResult<EmailPreference|null>> {
    if(!isPreferenceRequestId(userId))return failure('invalid-input');
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>;
    const timeout=new Promise<PreferenceClientResult<never>>(resolve=>{
      timer=setTimeout(()=>{controller.abort();resolve(failure('unavailable'));},options.timeoutMs);
    });
    const execute=async():Promise<PreferenceClientResult<EmailPreference|null>>=>{
      try {
        const session=await options.session();
        if(controller.signal.aborted)return failure('unavailable');
        if(!session)return failure('unauthenticated');
        if(session.userId!==userId)return failure('account-changed');
        if(!session.bearer || /\s/.test(session.bearer))return failure('unauthenticated');
        const response=await options.fetcher(endpoint.href,{
          method:input?'PATCH':'GET',signal:controller.signal,credentials:'omit',
          cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',
          headers:{Authorization:`Bearer ${session.bearer}`,Accept:'application/json',...(input?{'Content-Type':'application/json'}:{})},
          ...(input?{body:JSON.stringify(input)}:{}),
        });
        if(!response.ok){
          await response.body?.cancel();
          return failure(response.status===401?'unauthenticated':response.status===409?'outdated-consent':response.status===429?'rate-limited':response.status===400?'invalid-input':response.status>=500?'unavailable':'failed');
        }
        if(response.headers.get('content-type')?.split(';')[0].trim()!=='application/json'){
          await response.body?.cancel();return failure('failed');
        }
        const reader=response.body?.getReader();if(!reader)return failure('failed');
        let size=0,body='';const decoder=new TextDecoder('utf-8',{fatal:true});
        try {
          while(true){const chunk=await reader.read();if(chunk.done)break;
            size+=chunk.value.byteLength;
            if(size>options.maxResponseBytes){await reader.cancel();return failure('failed');}
            body+=decoder.decode(chunk.value,{stream:true});
          }
          body+=decoder.decode();
        }finally{reader.releaseLock();}
        const result=JSON.parse(body);
        if(!result || typeof result!=='object' || Object.keys(result).length!==1 || !('preference' in result))return failure('failed');
        if(result.preference===null)return input?failure('failed'):{ok:true,value:null};
        const preference=parseEmailPreference(result.preference);
        // An idempotent old retry returns CURRENT server state. Another tab
        // may already have withdrawn; show that state rather than replaying it.
        if(!preference)return failure('failed');
        return {ok:true,value:preference};
      }catch{return failure('unavailable');}
    };
    try{return await Promise.race([execute(),timeout]);}finally{clearTimeout(timer!);}
  }
  return {
    read:userId=>request(userId),
    async change(userId,input){
      const parsed=parsePreferenceChange(input);if(!parsed.ok)return parsed;
      const result=await request(userId,parsed.value);
      return result.ok ? result.value===null?failure('failed'):{ok:true,value:result.value} : result;
    },
  };
}
