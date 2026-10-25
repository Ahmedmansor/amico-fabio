import type {DispatchPolicy} from './dispatch-queue.ts';
import {validatedMailAddress} from '../domain/delivery.ts';
import {emailOrigin,type EmailCatalog} from '../domain/catalog.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
export interface DispatchConfig {policy:DispatchPolicy;catalogOrigin:string;catalogMaxAgeMs:number;managementLifetimeMs:number;
  allowedRecipients:string[];accountIds:string[]|null;sender:{email:string;name:string};environment:EmailCatalog['environment'];maxResponseBytes:number;maxRequestBytes:number}
export function readDispatchConfig(value:unknown):DispatchConfig{
  if(!value||typeof value!=='object')throw new Error('[reminders] Dispatch configuration required.');
  const row=value as Record<string,unknown>;
  if(row.accountIds!==null&&(!Array.isArray(row.accountIds)||!row.accountIds.length||row.accountIds.some(id=>!isPreferenceRequestId(id))))throw new Error('[reminders] Explicit account scope required.');
  if(row.environment==='test'&&row.accountIds===null)throw new Error('[reminders] Test dispatch must be account-scoped.');
  const integer=(key:string)=>{const n=row[key];if(typeof n!=='number'||!Number.isSafeInteger(n)||n<1||n>2147483647)throw new Error('[reminders] Explicit dispatch settings required.');return n;};
  if(!Array.isArray(row.allowedRecipients)||!row.allowedRecipients.length||typeof row.senderEmail!=='string'||typeof row.senderName!=='string'
    ||!row.senderName.trim()||/[\r\n]/.test(row.senderName)||typeof row.catalogOrigin!=='string'||!['test','production'].includes(row.environment as string))throw new Error('[reminders] Invalid dispatch settings.');
  const policy={batchSize:integer('batchSize'),leaseSeconds:integer('leaseSeconds'),dailyLimit:integer('dailyLimit'),attemptLimit:integer('attemptLimit'),retrySeconds:integer('retrySeconds'),timeoutMs:integer('timeoutMs')};
  if(policy.batchSize>50||policy.leaseSeconds>3600||policy.leaseSeconds*1000<policy.timeoutMs*3)throw new Error('[reminders] Lease must outlast bounded network work.');
  // Lifetime may exceed PostgreSQL int milliseconds; explicit safe integers only.
  const managementLifetimeMs=row.managementLifetimeMs;
  if(!Number.isSafeInteger(managementLifetimeMs)||(managementLifetimeMs as number)<1)throw new Error('[reminders] Management lifetime required.');
  return {policy,catalogOrigin:emailOrigin(row.catalogOrigin),catalogMaxAgeMs:integer('catalogMaxAgeMs'),managementLifetimeMs:managementLifetimeMs as number,
    allowedRecipients:row.allowedRecipients.map(address=>validatedMailAddress(address)),accountIds:row.accountIds as string[]|null,sender:{email:validatedMailAddress(row.senderEmail),name:row.senderName},
    environment:row.environment as EmailCatalog['environment'],maxResponseBytes:integer('maxResponseBytes'),maxRequestBytes:integer('maxRequestBytes')};
}
