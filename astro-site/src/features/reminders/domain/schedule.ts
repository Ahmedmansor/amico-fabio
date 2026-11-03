import {favoriteIdentity,favoriteKey} from '../../wishlist/domain/wishlist.ts';

export const reminderDelayMs=24*60*60*1000;
export interface ReminderState {
  enabled:boolean;
  consentGrantedAt:number|null;
  ids:string[];
  lastAdditionAt:number|null;
  firstAcceptedAt:number|null;
}
export type ReminderEvent=
  |{type:'consent';enabled:boolean;at:number}
  |{type:'added'|'removed';key:string;at:number}
  |{type:'provider-accepted';at:number};
export function initialReminderState():ReminderState{
  return {enabled:false,consentGrantedAt:null,ids:[],lastAdditionAt:null,firstAcceptedAt:null};
}
function time(value:number){if(!Number.isSafeInteger(value)||value<0)throw new Error('[reminders] Invalid trusted timestamp.');}

/** Feed only committed server events; never browser clocks or analytics events. */
export function updateReminderState(state:ReminderState,event:ReminderEvent):ReminderState{
  time(event.at);
  const next={...state,ids:[...state.ids]};
  if(event.type==='consent'){
    if(event.enabled&&!state.enabled)next.consentGrantedAt=event.at;
    if(!event.enabled)next.consentGrantedAt=null;
    next.enabled=event.enabled;
  }else if(event.type==='provider-accepted'){
    // Persist late acceptance even if withdrawal happened while sending.
    next.firstAcceptedAt=state.firstAcceptedAt??event.at;
  }else{
    const identity=favoriteIdentity(event.key),key=favoriteKey(identity.kind,identity.id);
    if(event.type==='added'&&!state.ids.includes(key)){
      next.ids.push(key);next.lastAdditionAt=Math.max(state.lastAdditionAt??0,event.at);
    }else if(event.type==='removed'){
      next.ids=state.ids.filter(id=>id!==key);
      // Removing the newest item must not move the timer to an older addition.
      if(!next.ids.length)next.lastAdditionAt=null;
    }
  }
  return next;
}
export function reminderSchedule(state:ReminderState,now:number){
  return reminderActivitySchedule({...state,favoriteCount:state.ids.length},now);
}
/** Worker can decide eligibility from one joined activity/consent row before
 * loading actual item content. This does not claim a job or authorize sending. */
export function reminderActivitySchedule(state:Omit<ReminderState,'ids'> & {favoriteCount:number},now:number):{
  status:'disabled'|'empty'|'consumed'|'waiting'|'due';dueAt:number|null;
}{
  time(now);
  if(!Number.isSafeInteger(state.favoriteCount)||state.favoriteCount<0)throw new Error('[reminders] Invalid committed favorite count.');
  if(state.firstAcceptedAt!==null)return {status:'consumed',dueAt:null};
  if(!state.enabled)return {status:'disabled',dueAt:null};
  if(!state.favoriteCount)return {status:'empty',dueAt:null};
  if(state.consentGrantedAt===null||state.lastAdditionAt===null)throw new Error('[reminders] Missing server eligibility history.');
  time(state.consentGrantedAt);time(state.lastAdditionAt);
  const dueAt=Math.max(state.consentGrantedAt,state.lastAdditionAt)+reminderDelayMs;
  if(!Number.isSafeInteger(dueAt))throw new Error('[reminders] Invalid due timestamp.');
  return {status:now>=dueAt?'due':'waiting',dueAt};
}
