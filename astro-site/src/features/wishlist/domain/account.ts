export type WishlistFailure = 'unavailable' | 'failed' | 'invalid-data' | 'stale' | 'storage' | 'confirmation';
export type WishlistResult<T> = {ok:true;value:T} | {ok:false;reason:WishlistFailure};
export interface AccountWishlistRepository {
  list(userId:string):Promise<WishlistResult<string[]>>;
  add(userId:string,ids:readonly string[]):Promise<WishlistResult<void>>;
  remove(userId:string,id:string):Promise<WishlistResult<void>>;
  ensureProfile(userId:string,locale:string):Promise<WishlistResult<void>>;
}
