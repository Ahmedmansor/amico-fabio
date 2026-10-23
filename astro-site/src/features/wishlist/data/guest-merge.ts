import { confirmedGuestCleanup, type GuestEntry } from '../domain/merge.ts';
import type { WishlistResult } from '../domain/account.ts';
import { promoteGuestSnapshot, readGuestSnapshot, removeGuestRevision, saveGuestFavorite, readGuestWishlist, type GuestStorage } from './guest-storage.ts';
export type GuestLock = <T>(action:()=>T|Promise<T>)=>Promise<T>;
export interface ClaimedEntry extends GuestEntry { claim:string }
export interface GuestMergePort {
  capture(userId:string,explicit:boolean):Promise<WishlistResult<{entries:ClaimedEntry[];blocked:number}>>;
  acknowledge(userId:string,entries:readonly ClaimedEntry[],confirmed:readonly string[],current:()=>boolean):Promise<WishlistResult<void>>;
  read():ReturnType<typeof readGuestWishlist>;
  save(id:string,saved:boolean):Promise<ReturnType<typeof saveGuestFavorite>>;
}
const claimPrefix='fabio:wishlist:merge:v1:';
interface Claim {revision:string;userId:string;expiresAt:number;claim:string}
function claimKey(id:string){return claimPrefix+encodeURIComponent(id);}
function readClaim(storage:GuestStorage,key:string):Claim|null {
  const text=storage.getItem(key);if(text===null)return null;
  const value=JSON.parse(text) as Claim;
  if(!value || typeof value.revision!=='string' || typeof value.userId!=='string' || typeof value.claim!=='string'
    || !Number.isFinite(value.expiresAt))throw new Error('Invalid merge claim');
  return value;
}

/** Pending ownership is service state, not email consent or an authentication proof. */
export function createGuestMergePort(storage:GuestStorage|null,lock:GuestLock|null,now=Date.now):GuestMergePort {
  return {
    read:()=>readGuestWishlist(storage),
    async save(id,saved){return lock ? lock(()=>saveGuestFavorite(storage,id,saved)) : saveGuestFavorite(storage,id,saved);},
    async capture(userId,explicit){
      const current=readGuestWishlist(storage);
      if(current.ok && !current.value.length)return {ok:true,value:{entries:[],blocked:0}};
      if(!storage || !lock)return {ok:false,reason:'storage'};
      try{return await lock(()=>{
        const snapshot=promoteGuestSnapshot(storage);
        if(!snapshot.ok)return {ok:false as const,reason:'storage' as const};
        const entries:ClaimedEntry[]=[];let blocked=0;
        for(const entry of snapshot.value){
          const key=claimKey(entry.id),old=readClaim(storage,key);
          if(old?.revision===entry.revision && (old.userId!==userId || old.expiresAt<=now()) && !explicit){blocked++;continue;}
          const claim={revision:entry.revision,userId,expiresAt:now()+10*60*1000,claim:crypto.randomUUID()};
          const encoded=JSON.stringify(claim);storage.setItem(key,encoded);
          if(storage.getItem(key)!==encoded)return {ok:false as const,reason:'storage' as const};
          entries.push({...entry,claim:claim.claim});
        }
        return {ok:true as const,value:{entries,blocked}};
      });}catch{return {ok:false,reason:'storage'};}
    },
    async acknowledge(userId,entries,confirmed,current){
      if(!entries.length)return {ok:true,value:undefined};
      if(!storage || !lock)return {ok:false,reason:'storage'};
      try{return await lock(()=>{
        if(!current())return {ok:false as const,reason:'stale' as const};
        const latest=readGuestSnapshot(storage);if(!latest.ok)return {ok:false as const,reason:'storage' as const};
        const identity={userId,generation:0};
        const removable=confirmedGuestCleanup(entries,latest.value,confirmed,identity,current()?identity:null);
        for(const entry of removable){
          if(!current())return {ok:false as const,reason:'stale' as const};
          const expected=entries.find(value=>value.id===entry.id);
          const claim=readClaim(storage,claimKey(entry.id));
          if(!claim || claim.userId!==userId || claim.claim!==expected?.claim || claim.expiresAt<=now())continue;
          const result=removeGuestRevision(storage,entry);
          if(!result.ok)return {ok:false as const,reason:'storage' as const};
          if(result.value)storage.removeItem(claimKey(entry.id));
        }
        return {ok:true as const,value:undefined};
      });}catch{return {ok:false,reason:'storage'};}
    },
  };
}

export function browserGuestLock():GuestLock|null {
  if(typeof navigator==='undefined' || !navigator.locks)return null;
  return action=>navigator.locks.request('fabio:wishlist:guest:v1',{mode:'exclusive'},()=>action());
}
