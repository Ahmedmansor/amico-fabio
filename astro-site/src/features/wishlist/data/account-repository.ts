import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountWishlistRepository, WishlistResult } from '../domain/account.ts';
import { normalizeWishlist, tripId } from '../domain/wishlist.ts';
import { isLocale } from '../../../shared/config/languages.ts';
const ok = <T>(value:T):WishlistResult<T> => ({ok:true,value});
const failed = ():WishlistResult<never> => ({ok:false,reason:'failed'});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Only wishlist/profile tables. Caller gets account identity from the Auth API. */
export function createAccountRepository(client:Pick<SupabaseClient,'from'>|null):AccountWishlistRepository {
  return {
    async list(userId) {
      if(!client)return {ok:false,reason:'unavailable'};
      if (!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const ids:string[]=[];
        const size=200;
        for (let start=0;start<100000;start+=size) {
          const {data,error}=await client.from('wishlists').select('trip_id').eq('user_id',userId)
            .order('trip_id').range(start,start+size-1);
          if(error || !Array.isArray(data)) return failed();
          for(const row of data) ids.push(tripId(row.trip_id));
          if(data.length<size) return ok(normalizeWishlist(ids));
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
          const {error}=await client.from('wishlists').upsert(rows,{onConflict:'user_id,trip_id',ignoreDuplicates:true});
          if(error) return failed();
        }
        return ok(undefined);
      } catch { return failed(); }
    },
    async remove(userId,id) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId)) return {ok:false,reason:'invalid-data'};
      try {
        const {error}=await client.from('wishlists').delete().eq('user_id',userId).eq('trip_id',tripId(id));
        return error ? failed() : ok(undefined);
      } catch { return failed(); }
    },
    async ensureProfile(userId,locale) {
      if(!client)return {ok:false,reason:'unavailable'};
      if(!uuid.test(userId) || !isLocale(locale)) return {ok:false,reason:'invalid-data'};
      try {
        const {error}=await client.from('profiles').upsert({user_id:userId,locale},{onConflict:'user_id',ignoreDuplicates:true});
        return error ? failed() : ok(undefined);
      } catch { return failed(); }
    },
  };
}
