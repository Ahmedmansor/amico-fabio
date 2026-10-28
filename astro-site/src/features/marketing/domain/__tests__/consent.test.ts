import {describe,it,expect} from 'vitest';
import {parseMarketingConsent,canSaveMarketingConsent} from '../consent';
describe('separate promotional consent',()=>{
  it('does not infer consent or verification from truthy values',()=>{
    expect(parseMarketingConsent({marketing_consent:'true',revision:1,verified:true,pending_signup:false})).toBeNull();
    expect(parseMarketingConsent({marketing_consent:false,revision:-1,verified:true,pending_signup:false})).toBeNull();
    expect(canSaveMarketingConsent(null)).toBe(false);
    expect(canSaveMarketingConsent({enabled:false,revision:0,verified:false,pendingSignup:true})).toBe(false);
  });
  it('missing preference is a verified default-false revision, not a subscription',()=>{
    const value=parseMarketingConsent({marketing_consent:false,revision:0,verified:true,pending_signup:false});
    expect(value?.enabled).toBe(false);expect(canSaveMarketingConsent(value)).toBe(true);
  });
});
