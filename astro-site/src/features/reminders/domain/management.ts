import {isLocale,type Locale} from '../../../shared/config/languages.ts';
import {isPreferenceRequestId} from './preferences.ts';
export interface ManagementState {enabled:boolean;locale:Locale;revision:number}
export type ManagementCommand={operation:'read'}|{operation:'unsubscribe';requestId:string;consentLocale:Locale}
  |{operation:'language';requestId:string;locale:Locale;expectedRevision:number};
export type ManagementResult={ok:true;state:ManagementState;conflict:boolean}
  |{ok:false;reason:'invalid-link'|'unavailable'};
export interface ManagementRepository {run(hash:string,command:ManagementCommand):Promise<ManagementResult>}
export const isManagementToken=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function parseManagementCommand(value:unknown):ManagementCommand|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const row=value as Record<string,unknown>;
  const keys=row.operation==='read'?['operation']:row.operation==='unsubscribe'?['operation','requestId','consentLocale']:['operation','requestId','locale','expectedRevision'];
  if(Object.keys(row).some(key=>!keys.includes(key)))return null;
  if(row.operation==='read')return {operation:'read'};
  if(!isPreferenceRequestId(row.requestId))return null;
  if(row.operation==='unsubscribe')return isLocale(row.consentLocale)?{operation:'unsubscribe',requestId:row.requestId,consentLocale:row.consentLocale}:null;
  if(row.operation!=='language'||!isLocale(row.locale)||!Number.isSafeInteger(row.expectedRevision)||(row.expectedRevision as number)<0)return null;
  return {operation:'language',requestId:row.requestId,locale:row.locale,expectedRevision:row.expectedRevision as number};
}
export function parseManagementState(value:unknown):ManagementState|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const row=value as Record<string,unknown>;
  return Object.keys(row).every(key=>['enabled','locale','revision'].includes(key))&&typeof row.enabled==='boolean'
    &&isLocale(row.locale)&&Number.isSafeInteger(row.revision)&&(row.revision as number)>=0
    ?{enabled:row.enabled,locale:row.locale,revision:row.revision as number}:null;
}
/** The capability stays in the fragment, never a request URL or Auth session. */
export function correspondenceManagementUrl(origin:string,locale:Locale,token:string):string{
  const base=new URL(origin),local=['127.0.0.1','localhost'].includes(base.hostname);
  if(base.origin!==origin||base.username||base.password||(!local&&base.protocol!=='https:')
    ||(local&&!['https:','http:'].includes(base.protocol))||!isLocale(locale)||!isManagementToken(token))throw new Error('[reminders] Invalid management link.');
  return `${origin}/${locale}/email-preferences/#token=${token}`;
}
