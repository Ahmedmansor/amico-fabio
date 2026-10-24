import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountWishlistRepository, WishlistResult } from '../domain/account.ts';
import { favoriteIdentity, favoriteKey, normalizeWishlist, tripId } from '../domain/wishlist.ts';
import { isLocale } from '../../../shared/config/languages.ts';
const ok = <T>(value:T):WishlistResult<T> => ({ok:true,value});
const failed = ():WishlistResult<never> => ({ok:false,reason:'failed'});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sources = [
  { kind: 'trip', table: 'wishlists', column: 'trip_id' },
  { kind: 'package', table: 'package_wishlists', column: 'package_id' },
] as const;

/** Only wishlist/profile tables. Caller gets account identity from the Auth API. */
export function createAccountRepository(client:Pick<SupabaseClient,'from'>|null,timeoutMs=15000):AccountWishlistRepository {
  if(!Number.isSafeInteger(timeoutMs) || timeoutMs<1)throw new Error('[wishlist] Invalid request timeout.');
  async function request<T>(query:{abortSignal(signal:AbortSignal):PromiseLike<T>}):Promise<T>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{return await query.abortSignal(controller.signal);}finally{clearTimeout(timer);}
  }
  return {
    async list(userId) {
      if(!client)return {ok:false,reason:'unavailable'};
      if (!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const ids:string[]=[];
        for(const source of sources){
          let cursor:string|null=null;
          let complete=false;
          for (let page=0;page<1000;page++) {
            let query=client.from(source.table).select(source.column).eq('user_id',userId).order(source.column).limit(200);
            if(cursor!==null)query=query.gt(source.column,cursor);
            const {data,error}=await request(query);
            if(error || !Array.isArray(data)) return failed();
            if(!data.length){complete=true;break;}
            const rows=data as Record<string,unknown>[];
            for(const row of rows) ids.push(favoriteKey(source.kind,row[source.column]));
            const next=tripId(rows[rows.length-1][source.column]);
            if(next===cursor)return failed();
            cursor=next;
          }
          if(!complete)return failed(); // Never report a truncated list as complete.
        }
        return ok(normalizeWishlist(ids));
      } catch { return failed(); }
    },
    async add(userId,ids) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const identities=normalizeWishlist(ids).map(favoriteIdentity);
        for(const source of sources){
          const normalized=identities.filter(item=>item.kind===source.kind).map(item=>item.id);
          for(let start=0;start<normalized.length;start+=100) {
            const rows=normalized.slice(start,start+100).map(id=>({user_id:userId,[source.column]:id}));
            const {error}=await request(client.from(source.table).upsert(rows,{onConflict:`user_id,${source.column}`,ignoreDuplicates:true}));
            if(error) return failed();
          }
        }
        return ok(undefined);
      } catch { return failed(); }
    },
    async remove(userId,id) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const item=favoriteIdentity(id);
        const source=sources.find(source=>source.kind===item.kind)!;
        const {error}=await request(client.from(source.table).delete().eq('user_id',userId).eq(source.column,item.id));
        return error ? failed() : ok(undefined);
      } catch { return failed(); }
    },
    async ensureProfile(userId,locale) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId) || !isLocale(locale)) return {ok:false,reason:'invalid-data'};
      try {
        const {error}=await request(client.from('profiles').upsert({user_id:userId,locale},{onConflict:'user_id',ignoreDuplicates:true}));
        return error ? failed() : ok(undefined);
      } catch { return failed(); }
    },
  };
}
