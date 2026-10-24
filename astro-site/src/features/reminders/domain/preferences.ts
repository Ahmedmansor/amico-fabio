import {isLocale,type Locale} from '../../../shared/config/languages.ts';

export const reminderConsentVersion='wishlist-reminders-v1';
export interface EmailPreference {enabled:boolean;locale:Locale;wordingVersion:string;updatedAt:string;enabledSince:string|null}
export interface PreferenceChange {requestId:string;enabled:boolean;locale:Locale;wordingVersion:string;consentLocale?:Locale}
export type PreferenceResult<T>={ok:true;value:T}|{ok:false;reason:'invalid-input'|'outdated-consent'|'unavailable'|'failed'};
export interface PreferenceRepository {
  read(userId:string):Promise<PreferenceResult<EmailPreference|null>>;
  change(userId:string,input:PreferenceChange):Promise<PreferenceResult<EmailPreference>>;
}

/** Shared wire model validation; never treat a malformed response as consent. */
export function parseEmailPreference(value:unknown):EmailPreference|null {
  if(!value || typeof value!=='object' || Array.isArray(value))return null;
  const row=value as Record<string,unknown>;
  if(Object.keys(row).some(key=>!['enabled','locale','wordingVersion','updatedAt','enabledSince'].includes(key))
    || typeof row.enabled!=='boolean' || !isLocale(row.locale)
    || typeof row.wordingVersion!=='string' || !row.wordingVersion
    || typeof row.updatedAt!=='string' || !Number.isFinite(Date.parse(row.updatedAt)))return null;
  if(row.enabled ? typeof row.enabledSince!=='string' || !Number.isFinite(Date.parse(row.enabledSince)) : row.enabledSince!==null)return null;
  return {enabled:row.enabled,locale:row.locale,wordingVersion:row.wordingVersion,updatedAt:row.updatedAt,enabledSince:row.enabledSince as string|null};
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isPreferenceRequestId(value:unknown):value is string {return typeof value==='string'&&uuid.test(value);}

/** Browser may choose its preference, never ownership, recipients or audit times. */
export function parsePreferenceChange(value:unknown):PreferenceResult<PreferenceChange>{
  if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,reason:'invalid-input'};
  const input=value as Record<string,unknown>;
  if(Object.keys(input).some(key=>!['requestId','enabled','locale','wordingVersion','consentLocale'].includes(key))
    ||!isPreferenceRequestId(input.requestId)||typeof input.enabled!=='boolean'||!isLocale(input.locale)
    ||(input.consentLocale!==undefined&&!isLocale(input.consentLocale)))
    return {ok:false,reason:'invalid-input'};
  // A stale displayed consent version cannot authorize a new subscription.
  if(input.enabled && input.wordingVersion!==reminderConsentVersion)return {ok:false,reason:'outdated-consent'};
  return {ok:true,value:{requestId:input.requestId,enabled:input.enabled,locale:input.locale,wordingVersion:reminderConsentVersion,
    consentLocale:input.consentLocale??input.locale}};
}
