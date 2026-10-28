import {browserSupabase} from '../../../shared/data/browser-client';
import {createMarketingRepository} from './repository';
interface PublicConnection {url:string;publishableKey:string;siteOrigin:string}
export async function browserMarketing(config:PublicConnection){
  const client=await browserSupabase(config);
  return client?createMarketingRepository((name,input)=>client.rpc(name,input).abortSignal(AbortSignal.timeout(10000))):null;
}
