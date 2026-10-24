import {isPreferenceRequestId,reminderConsentVersion,type EmailPreference,type PreferenceChange} from '../domain/preferences.ts';
import type {Locale} from '../../../shared/config/languages.ts';
import type {PreferenceClient,PreferenceClientFailure} from './preferences-client.ts';

export interface PreferenceViewState {
  userId:string|null;
  status:'signed-out'|'loading'|'ready'|'saving'|'error';
  preference:EmailPreference|null;
  error:PreferenceClientFailure|null;
  retryable:boolean;
}

/** Feature-scoped state for the future opt-in control. No DOM, storage or tokens.
 * Only confirmed replies change the displayed preference. Account changes
 * invalidate old replies, including replies to writes already sent. */
export function createPreferenceController(client:PreferenceClient,newRequestId:()=>string){
  let state:PreferenceViewState={userId:null,status:'signed-out',preference:null,error:null,retryable:false};
  let revision=0,pending:PreferenceChange|null=null;
  const listeners=new Set<(state:PreferenceViewState)=>void>();
  const snapshot=():PreferenceViewState=>({...state,preference:state.preference?{...state.preference}:null});
  const publish=()=>{for(const listener of listeners)listener(snapshot());};
  async function perform(command:PreferenceChange|null){
    const userId=state.userId;if(!userId || state.status==='loading' || state.status==='saving')return;
    const operation=++revision;
    state={...state,status:command?'saving':'loading',error:null,retryable:false};publish();
    try {
      const result=command?await client.change(userId,command):await client.read(userId);
      if(operation!==revision || state.userId!==userId)return;
      if(result.ok){pending=null;state={...state,status:'ready',preference:result.value,error:null,retryable:false};}
      else{
        const retryable=['unavailable','failed','rate-limited'].includes(result.reason);
        if(!retryable)pending=null;
        state={...state,status:'error',error:result.reason,retryable};
      }
    }catch{
      if(operation!==revision || state.userId!==userId)return;
      state={...state,status:'error',error:'unavailable',retryable:true};
    }
    publish();
  }
  return {
    getState:snapshot,
    subscribe(listener:(state:PreferenceViewState)=>void){listeners.add(listener);listener(snapshot());return ()=>listeners.delete(listener);},
    async connect(userId:string|null){
      if(userId!==null&&!isPreferenceRequestId(userId))throw new Error('[reminders] Invalid account identity.');
      revision++;pending=null;
      state={userId,status:userId?'ready':'signed-out',preference:null,error:null,retryable:false};publish();
      if(userId)await perform(null);
    },
    async save(enabled:boolean,locale:Locale){
      // Resolve an uncertain write using its original request ID before
      // accepting another command. No automatic background opt-in/retry.
      if(!state.userId || state.status!=='ready' || pending)return;
      const requestId=newRequestId();
      if(!isPreferenceRequestId(requestId))throw new Error('[reminders] Invalid request identity.');
      pending={requestId,enabled,locale,wordingVersion:reminderConsentVersion};
      await perform(pending);
    },
    async retry(){if(state.status==='error'&&state.retryable)await perform(pending);},
    async refresh(){
      if(state.status==='loading'||state.status==='saving'||pending)return;
      await perform(null);
    },
  };
}
