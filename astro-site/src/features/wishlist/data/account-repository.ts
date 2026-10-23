import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountWishlistRepository, WishlistResult } from '../domain/account.ts';
import { normalizeWishlist, tripId } from '../domain/wishlist.ts';
import { isLocale } from '../../../shared/config/languages.ts';
const ok = <T>(value:T):WishlistResult<T> => ({ok:true,value});
const failed = ():WishlistResult<never> => ({ok:false,reason:'failed'});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        let cursor:string|null=null;
        for (let page=0;page<1000;page++) {
          let query=client.from('wishlists').select('trip_id').eq('user_id',userId).order('trip_id').limit(200);
          if(cursor!==null)query=query.gt('trip_id',cursor);
          const {data,error}=await request(query);
          if(error || !Array.isArray(data)) return failed();
          if(!data.length)return ok(normalizeWishlist(ids));
          for(const row of data) ids.push(tripId(row.trip_id));
          const next=tripId(data[data.length-1].trip_id);
          if(next===cursor)return failed();
          cursor=next;
        }
        return failed(); // Never report a truncated list as complete.
      } catch { return failed(); }
    },
    async add(userId,ids) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const normalized=normalizeWishlist(ids);
        for(let start=0;start<normalized.length;start+=100) {
          const rows=normalized.slice(start,start+100).map(trip_id=>({user_id:userId,trip_id}));
          const {error}=await request(client.from('wishlists').upsert(rows,{onConflict:'user_id,trip_id',ignoreDuplicates:true}));
          if(error) return failed();
        }
        return ok(undefined);
      } catch { return failed(); }
    },
    async remove(userId,id) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const {error}=await request(client.from('wishlists').delete().eq('user_id',userId).eq('trip_id',tripId(id)));
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
