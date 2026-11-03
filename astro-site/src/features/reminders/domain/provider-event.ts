import {isPreferenceRequestId} from './preferences.ts';
import {providerMessageId} from './dispatch.ts';
export type ReminderProviderEvent={deliveryId:string;messageId:string;event:'request'|'delivered'|'hard_bounce'|'soft_bounce'|'blocked'|'spam'|'unsubscribed'|'invalid_email'};
/** Called only AFTER webhook authentication. Recipient/user fields are ignored;
 * correlation goes to the immutable job, never to arbitrary supplied email. */
export function parseReminderProviderEvent(value:unknown):ReminderProviderEvent|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const row=value as Record<string,unknown>,messageId=providerMessageId(row['message-id']);
  if(!messageId||!['request','delivered','hard_bounce','soft_bounce','blocked','spam','unsubscribed','invalid_email'].includes(row.event as string)
    ||typeof row['X-Mailin-custom']!=='string'||row['X-Mailin-custom'].length>128)return null;
  try{const correlation=JSON.parse(row['X-Mailin-custom']);
    return correlation&&Object.keys(correlation).length===1&&isPreferenceRequestId(correlation.deliveryId)
      ?{deliveryId:correlation.deliveryId,messageId,event:row.event as ReminderProviderEvent['event']}:null;
  }catch{return null;}
}
