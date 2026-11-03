export function marketingConsentEnabled(env:Record<string,unknown>):boolean{
  const value=env.PUBLIC_MARKETING_CONSENT_ENABLED;
  if(value===undefined||value===''||value==='0')return false;
  if(value!=='1')throw new Error('[marketing] PUBLIC_MARKETING_CONSENT_ENABLED must be 0 or 1.');
  if(env.PUBLIC_AUTH_ENABLED!=='1')throw new Error('[marketing] Consent requires Auth.');
  return true;
}
