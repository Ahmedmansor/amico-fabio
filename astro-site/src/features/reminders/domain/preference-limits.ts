export type PreferenceOperation='read'|'write';
export interface PreferenceRatePolicy {read:{limit:number;windowSeconds:number};write:{limit:number;windowSeconds:number}}
export type PreferenceLimitResult={status:'allowed'}|{status:'limited';retryAfterSeconds:number}|{status:'unavailable'};
export interface PreferenceLimiter {take(userId:string,operation:PreferenceOperation):Promise<PreferenceLimitResult>}

/** No quota defaults: operational limits must be explicitly configured. */
export function assertPreferenceRatePolicy(policy:PreferenceRatePolicy):void {
  for(const operation of ['read','write'] as const)for(const field of ['limit','windowSeconds'] as const){
    const value=policy?.[operation]?.[field];
    if(!Number.isSafeInteger(value)||value<1||value>2147483647)
      throw new Error('[reminders] Explicit positive PostgreSQL integer rate policy required.');
  }
}
