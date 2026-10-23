export const invitationDismissalMilliseconds=7*24*60*60*1000;
export function invitationSuppressed(dismissedAt:number|null,now:number):boolean {
  if(!Number.isSafeInteger(now) || now<0)throw new Error('[wishlist] A valid current timestamp is required.');
  if(dismissedAt===null)return false;
  if(!Number.isSafeInteger(dismissedAt) || dismissedAt<0)throw new Error('[wishlist] Invalid invitation dismissal timestamp.');
  return now-dismissedAt<invitationDismissalMilliseconds;
}
