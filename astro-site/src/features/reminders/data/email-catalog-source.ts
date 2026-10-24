import {validateEmailCatalog,type EmailCatalog} from '../domain/catalog.ts';
import {createPreferenceFetch} from './preference-runtime-config.ts';
export function createEmailCatalogSource(options:{
  url:string;origin:string;environment:EmailCatalog['environment'];maxAgeMs:number;
  now:()=>number;fetcher:typeof fetch;timeoutMs:number;maxResponseBytes:number;
}){
  const url=new URL(options.url);
  if(url.origin!==options.origin||url.pathname!=='/tours-manifest.json'||url.search||url.hash||url.username||url.password
    ||url.protocol!=='https:')throw new Error('[wishlist-email] Explicit public HTTPS catalog required.');
  if(!Number.isSafeInteger(options.maxAgeMs)||options.maxAgeMs<1)throw new Error('[wishlist-email] Catalog age policy required.');
  const fetcher=createPreferenceFetch(options.fetcher,options.timeoutMs,options.maxResponseBytes);
  return {async load():Promise<EmailCatalog>{
    const response=await fetcher(url.href,{cache:'no-store',headers:{Accept:'application/json'}});
    if(!response.ok||response.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new Error('[wishlist-email] Catalog unavailable.');
    const catalog=validateEmailCatalog(await response.json());
    const age=options.now()-Date.parse(catalog.generated_at);
    if(catalog.origin!==options.origin||catalog.environment!==options.environment||!Number.isFinite(age)||age<0||age>options.maxAgeMs)
      throw new Error('[wishlist-email] Catalog origin, environment or freshness mismatch.');
    return catalog;
  }};
}
