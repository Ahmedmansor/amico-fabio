import type { AccountWishlistRepository, WishlistFailure, WishlistResult } from '../domain/account.ts';
import { planGuestMerge } from '../domain/merge.ts';
import type { GuestMergePort } from './guest-merge.ts';
import { normalizeWishlist } from '../domain/wishlist.ts';
import { readAccountWishlistCache, saveAccountWishlistCache } from './wishlist-cache.ts';
export interface WishlistState {
  status:'guest'|'loading'|'account'|'error'; userId:string|null; ids:string[]|null;
  pendingGuest:number; unavailableGuest:number; busy:boolean; error:WishlistFailure|null;
}
const good=<T>(value:T):WishlistResult<T>=>({ok:true,value});
const stale=():WishlistResult<never>=>({ok:false,reason:'stale'});

/** Account-bound async orchestration. No DOM, analytics or direct Auth SDK access. */
export function createWishlistCoordinator(repository:AccountWishlistRepository,guest:GuestMergePort,published:readonly string[],locale:string) {
  let generation=0;
  let state:WishlistState={status:'guest',userId:null,ids:null,pendingGuest:0,unavailableGuest:0,busy:false,error:null};
  const publishedIds=new Set(published);
  const unavailable=(ids:readonly string[])=>ids.filter(id=>!publishedIds.has(id)).length;
  let tail:Promise<unknown>=Promise.resolve();
  const listeners=new Set<(state:WishlistState)=>void>();
  function emit(){for(const listener of listeners)listener({...state,ids:state.ids?[...state.ids]:null});}
  function guestCounts(){const result=guest.read();return {pendingGuest:result.ok?result.value.length:0,unavailableGuest:result.ok?unavailable(result.value):0};}
  function isCurrent(userId:string,revision:number){return state.userId===userId && generation===revision;}
  function error(reason:WishlistFailure){state={...state,status:'error',busy:false,error:reason,...guestCounts()};emit();}
  function enqueue<T>(action:()=>Promise<T>):Promise<T>{const result=tail.then(action,action);tail=result.catch(()=>{});return result;}
  async function load(userId:string,revision:number,merge:boolean,explicit:boolean):Promise<WishlistResult<void>> {
    const current=()=>isCurrent(userId,revision);
    if(!current())return stale();
    state={...state,status:state.ids?'account':'loading',busy:!state.ids || explicit,error:null};emit();
    const profile=await repository.ensureProfile(userId,locale);
    if(!current())return stale();
    if(!profile.ok){error(profile.reason);return profile;}
    let account=await repository.list(userId);
    if(!current())return stale();
    if(!account.ok){error(account.reason);return account;}
    let failure:WishlistFailure|null=null;
    if(merge){
      const snapshot=await guest.capture(userId,explicit);
      if(!current())return stale();
      if(!snapshot.ok){failure=snapshot.reason;}
      else {
        const plan=planGuestMerge(snapshot.value.entries,account.value,published);
        if(plan.insert.length){
          const added=await repository.add(userId,plan.insert);
          if(!current())return stale();
          if(!added.ok)failure=added.reason;
          // A failed batch may have committed earlier inserts. Read back before any cleanup.
          account=await repository.list(userId);
          if(!current())return stale();
        }
        if(!account.ok){error(account.reason);return account;}
        const cleaned=await guest.acknowledge(userId,snapshot.value.entries,account.value,current);
        if(!current())return stale();
        if(!cleaned.ok)failure=cleaned.reason;
        if(snapshot.value.blocked){
          const local=guest.read();
          const confirmed=account.value;
          if(!local.ok)failure='storage';
          else if(local.value.some(id=>!snapshot.value.entries.some(entry=>entry.id===id)
            && (publishedIds.has(id) || confirmed.includes(id))))failure='confirmation';
        }
      }
    }
    if(!current())return stale();
    saveAccountWishlistCache(userId, account.value);
    state={status:failure?'error':'account',userId,ids:account.value,...guestCounts(),busy:false,error:failure};emit();
    return failure?{ok:false,reason:failure}:good(undefined);
  }
  return {
    getState:()=>({...state,ids:state.ids?[...state.ids]:null}),
    subscribe(listener:(value:WishlistState)=>void){listeners.add(listener);listener({...state,ids:state.ids?[...state.ids]:null});return()=>listeners.delete(listener);},
    async connect(userId:string|null){
      generation++;const revision=generation;tail=Promise.resolve();
      const local=guest.read();
      const cachedAccount = userId ? readAccountWishlistCache(userId) : null;
      const initialIds = userId ? cachedAccount : (local.ok ? local.value : null);
      state={status:userId?(cachedAccount?'account':'loading'):'guest',userId,ids:initialIds,pendingGuest:0,unavailableGuest:initialIds?unavailable(initialIds):0,busy:userId?!cachedAccount:false,error:local.ok?null:'storage'};emit();
      return userId?enqueue(()=>load(userId,revision,true,false)):good(undefined);
    },
    async refresh(){
      const userId=state.userId,revision=generation;
      if(!userId){const local=guest.read();state={...state,ids:local.ok?local.value:null,unavailableGuest:local.ok?unavailable(local.value):0,error:local.ok?null:'storage'};emit();return good(undefined);}
      return enqueue(()=>load(userId,revision,false,false));
    },
    async merge(){
      const userId=state.userId,revision=generation;if(!userId)return stale();
      return enqueue(()=>load(userId,revision,true,true));
    },
    async save(id:string,saved:boolean):Promise<WishlistResult<void>>{
      const userId=state.userId,revision=generation;
      return enqueue(async()=>{
        if(!userId){
          if(generation!==revision)return stale();
          const result=await guest.save(id,saved);
          if(generation!==revision)return stale();
          const local=guest.read();state={...state,ids:local.ok?local.value:null,unavailableGuest:local.ok?unavailable(local.value):0,error:result.ok?null:'storage'};emit();
          return result.ok?good(undefined):{ok:false,reason:'storage'};
        }
        if(!isCurrent(userId,revision))return stale();
        state={...state,busy:true};emit();
        const result=saved?await repository.add(userId,[id]):await repository.remove(userId,id);
        if(!isCurrent(userId,revision))return stale();
        if(!result.ok){error(result.reason);return result;}
        const fresh=await repository.list(userId);
        if(!isCurrent(userId,revision))return stale();
        if(!fresh.ok){error(fresh.reason);return fresh;}
        if(fresh.value.includes(id)!==saved){error('failed');return {ok:false,reason:'failed'};}
        saveAccountWishlistCache(userId, fresh.value);
        state={...state,status:'account',ids:normalizeWishlist(fresh.value),busy:false,error:null,...guestCounts()};emit();
        return good(undefined);
      });
    },
  };
}
