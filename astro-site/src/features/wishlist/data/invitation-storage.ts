import {invitationSuppressed} from '../domain/invitation.ts';
import type {GuestStorage,StorageResult} from './guest-storage.ts';
export const invitationDismissalKey='fabio:wishlist:invite-dismissed:v1';
export function canOfferSignIn(storage:GuestStorage|null,now:number):StorageResult<boolean>{
  if(!storage)return {ok:false,reason:'unavailable'};
  try{
    const raw=storage.getItem(invitationDismissalKey);
    if(raw!==null && !/^\d+$/.test(raw))return {ok:false,reason:'invalid-data'};
    return {ok:true,value:!invitationSuppressed(raw===null?null:Number(raw),now)};
  }catch{return {ok:false,reason:'read-failed'};}
}
export function dismissSignInInvitation(storage:GuestStorage|null,now:number):StorageResult<void>{
  if(!storage)return {ok:false,reason:'unavailable'};
  try{
    invitationSuppressed(now,now);
    storage.setItem(invitationDismissalKey,String(now));
    if(storage.getItem(invitationDismissalKey)!==String(now))return {ok:false,reason:'write-failed'};
    return {ok:true,value:undefined};
  }catch{return {ok:false,reason:'write-failed'};}
}
