import {parseMarketingConsent,marketingNoticeVersion,type MarketingConsent} from '../domain/consent.ts';
import type {Locale} from '../../../shared/config/languages.ts';
type Rpc=(name:string,input:Record<string,unknown>)=>PromiseLike<{data:unknown;error:unknown}>;
export function createMarketingRepository(rpc:Rpc){
  async function call(name:string,input:Record<string,unknown>):Promise<MarketingConsent>{
    const {data,error}=await rpc(name,input);
    const value=!error&&Array.isArray(data)&&data.length===1?parseMarketingConsent(data[0]):null;
    if(!value)throw new Error('Marketing preference unavailable');
    return value;
  }
  return {
    read:(userId:string)=>call('read_account_marketing_consent',{p_expected_user_id:userId}),
    activateSignup:(userId:string)=>call('activate_signup_marketing_intent',{p_expected_user_id:userId}),
    save:(userId:string,current:MarketingConsent,enabled:boolean,locale:Locale)=>call('set_account_marketing_consent',{
      p_expected_user_id:userId,p_expected_revision:current.revision,p_enabled:enabled,p_locale:locale,p_notice_version:marketingNoticeVersion,
    }),
  };
}
export type MarketingRepository=ReturnType<typeof createMarketingRepository>;
