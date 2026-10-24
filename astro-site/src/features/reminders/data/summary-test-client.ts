import type {AuthService} from '../../auth/data/service.ts';
import type {AuthConfig} from '../../auth/data/config.ts';
import {createPreferenceFetch} from './preference-runtime-config.ts';
export function readSummaryTestEndpoint(env:Record<string,unknown>,auth:AuthConfig|null):string|null {
  if(env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED===undefined||env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED===''||env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED==='0')return null;
  if(env.PUBLIC_WISHLIST_EMAIL_TEST_ENABLED!=='1'||!auth)throw new Error('[wishlist-email] Explicit Auth-enabled test configuration required.');
  const value=env.PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT;
  if(typeof value!=='string')throw new Error('[wishlist-email] Test endpoint required.');
  const url=new URL(value);
  if(url.href!==`${auth.url}/functions/v1/wishlist-email-test`)throw new Error('[wishlist-email] Test endpoint must use the configured Supabase project.');
  return url.href;
}
export function createSummaryTestClient(options:{service:Pick<AuthService,'bearerFor'>;endpoint:string;fetcher:typeof fetch;timeoutMs:number;maxResponseBytes:number}){
  const fetcher=createPreferenceFetch(options.fetcher,options.timeoutMs,options.maxResponseBytes);
  return {async send(userId:string):Promise<'accepted'|'unknown'|'failed'|'expired'>{
    const token=await options.service.bearerFor(userId);if(!token.ok)return 'failed';
    try{
      const response=await fetcher(options.endpoint,{method:'POST',headers:{Authorization:`Bearer ${token.value}`},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
      if(response.status===410)return 'expired';
      if(!response.ok)return response.status===503?'unknown':'failed';
      const result=await response.json();return result?.status==='accepted'&&typeof result.messageId==='string'?'accepted':'unknown';
    }catch{return 'unknown';}
  }};
}
