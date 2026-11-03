export const marketingNoticeVersion='favorites-offers-v1';
export interface MarketingConsent {enabled:boolean;revision:number;verified:boolean;pendingSignup:boolean}
export function parseMarketingConsent(value:unknown):MarketingConsent|null{
  if(!value||typeof value!=='object')return null;
  const row=value as Record<string,unknown>;
  if(typeof row.marketing_consent!=='boolean'||!Number.isSafeInteger(row.revision)||Number(row.revision)<0||typeof row.verified!=='boolean'||typeof row.pending_signup!=='boolean')return null;
  return {enabled:row.marketing_consent,revision:Number(row.revision),verified:row.verified,pendingSignup:row.pending_signup};
}
export function canSaveMarketingConsent(value:MarketingConsent|null):boolean{return !!value?.verified;}
