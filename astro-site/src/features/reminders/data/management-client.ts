import {isManagementToken,parseManagementCommand,parseManagementState,type ManagementCommand,type ManagementResult} from '../domain/management.ts';
import type {ManagementBrowserConfig} from './management-config.ts';
import {createPreferenceFetch} from './preference-runtime-config.ts';
export function createManagementClient(config:ManagementBrowserConfig,fetcher:typeof fetch){
  const url=new URL(config.endpoint),local=['127.0.0.1','localhost'].includes(url.hostname);
  if((url.protocol!=='https:'&&!(local&&url.protocol==='http:'))||url.username||url.password||url.search||url.hash)
    throw new Error('[reminders] Invalid management endpoint.');
  const bounded=createPreferenceFetch(fetcher,config.timeoutMs,config.maxResponseBytes);
  return {async execute(token:string,command:ManagementCommand):Promise<ManagementResult>{
    if(!isManagementToken(token)||!parseManagementCommand(command))return {ok:false,reason:'invalid-link'};
    try{
      const response=await bounded(url.href,{method:'POST',headers:{'Content-Type':'application/json'},
        credentials:'omit',referrerPolicy:'no-referrer',body:JSON.stringify({token,command})});
      if(response.status===400)return {ok:false,reason:'invalid-link'};
      if(![200,409].includes(response.status))return {ok:false,reason:'unavailable'};
      const body=await response.json(),state=parseManagementState(body.state);
      return state&&Object.keys(body).every(key=>['state','conflict'].includes(key))&&body.conflict===(response.status===409)
        ?{ok:true,state,conflict:body.conflict}:{ok:false,reason:'unavailable'};
    }catch{return {ok:false,reason:'unavailable'};}
  }};
}
