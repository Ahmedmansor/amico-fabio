import type {AuthService} from '../../auth/data/service.ts';
import type {AuthConfig} from '../../auth/data/config.ts';
import {createPreferenceFetch} from './preference-runtime-config.ts';
import {isLocale,type Locale} from '../../../shared/config/languages.ts';
export function readSummaryTestEndpoint(env:Record<string,unknown>,auth:AuthConfig|null):string|null {
  if(env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED===undefined||env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED===''||env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED==='0')return null;
  if(env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED!=='1'||!auth)throw new Error('[wishlist-email] Explicit Auth-enabled test configuration required.');
  const value=env.PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT;
  if(typeof value!=='string')throw new Error('[wishlist-email] Test endpoint required.');
  const url=new URL(value);
  if(url.href!==`${auth.url}/functions/v1/wishlist-email-test`)throw new Error('[wishlist-email] Test endpoint must use the configured Supabase project.');
  return url.href;
}
export type ReminderTestResult={status:'accepted'|'alreadySent';locale:Locale}|{status:'unknown'|'failed'|'expired'|'localeUnavailable'|'reminderDisabled'};
export function createSummaryTestClient(options:{service:Pick<AuthService,'bearerFor'>;endpoint:string;fetcher:typeof fetch;timeoutMs:number;maxResponseBytes:number}){
  const fetcher=createPreferenceFetch(options.fetcher,options.timeoutMs,options.maxResponseBytes);
  return {async send(userId:string):Promise<ReminderTestResult>{
    const token=await options.service.bearerFor(userId);if(!token.ok)return {status:'failed'};
    try{
      const response=await fetcher(options.endpoint,{method:'POST',headers:{Authorization:`Bearer ${token.value}`},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      if(response.status===410)return {status:'expired'};
      if(response.status===409){const result=await response.json();return {status:result?.error==='job-locale-mismatch'?'localeUnavailable':result?.error==='reminder-disabled'?'reminderDisabled':'failed'};}
      if(!response.ok){
        if(response.status!==503)return {status:'failed'};
        const result=await response.json();
        // A known pre-send block or explicit provider rejection is not an
        // uncertain acceptance. Preserve unknown for transport/ambiguous cases.
        return {status:result?.status==='blocked'||result?.status==='rejected'?'failed':'unknown'};
      }
      const result=await response.json();
      if(result?.status==='already-sent'&&isLocale(result.locale))return {status:'alreadySent',locale:result.locale};
      return result?.status==='accepted'&&typeof result.messageId==='string'&&isLocale(result.locale)?{status:'accepted',locale:result.locale}:{status:'unknown'};
    }catch{return {status:'unknown'};}
  }};
}
