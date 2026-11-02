/** One self-contained pure parser shared by normal storage and first-paint count.
 * Keep dependencies inside this function: the early inline bootstrap serializes
 * its compiled JS body at build time, without shipping a second parser. */
export function parseGuestWishlistRecord(key: string, value: string | null, acknowledged: boolean, prefixes: {trip: string; package: string}): {id: string; revision: string} | null {
  const kind=key.startsWith(prefixes.trip)?'trip':key.startsWith(prefixes.package)?'package':null;
  if(!kind || value===null)return null;
  if(value!=='1'&&!/^v2:[0-9a-f-]{36}$/.test(value))throw new Error('[wishlist] Invalid guest revision.');
  const prefix=prefixes[kind],suffix=key.slice(prefix.length);
  const id=decodeURIComponent(suffix);
  if(!id.trim()||id!==id.trim()||encodeURIComponent(id)!==suffix||(kind==='trip'&&id.startsWith('package:')))throw new Error('[wishlist] Invalid guest identity.');
  if(value!=='1'&&acknowledged)return null;
  return {id:kind==='package'?`package:${encodeURIComponent(id)}`:id,revision:value};
}
