export function readAccountSyncFlag(value:unknown,hasAuth:boolean):boolean {
  if(value===undefined || value==='' || value==='0')return false;
  if(value!=='1')throw new Error('[wishlist] PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED must be 0 or 1.');
  if(!hasAuth)throw new Error('[wishlist] Account sync requires explicitly configured Auth.');
  return true;
}
