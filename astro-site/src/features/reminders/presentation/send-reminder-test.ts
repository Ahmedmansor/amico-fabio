import {resolveLocale,type Locale} from '../../../shared/config/languages.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import type {EmailCatalog} from '../domain/catalog.ts';
import type {WishlistDeliveryPort,WishlistDeliveryResult,WishlistDelivery} from '../domain/delivery.ts';
import type {createEmailAccountSource} from '../data/email-account-source.ts';
import type {ReminderTestPreference} from '../data/reminder-test-preference.ts';
import {prepareReminderMessage} from './prepare-reminder-message.ts';
/** Restricted manual QA of the actual reminder content/links and saved language.
 * Separate QA ledger: never consumes or resets the real 24-hour reminder job. */
export function createReminderTestSender(options:{
  account:ReturnType<typeof createEmailAccountSource>;catalog:{load():Promise<EmailCatalog>};
  delivery:WishlistDeliveryPort;environment:EmailCatalog['environment'];
  preference:(userId:string)=>Promise<ReminderTestPreference>;
  management:(userId:string,origin:string,locale:Locale)=>Promise<{url:string;expiresAt:string}|null>;
}){
  return {async sendForUser(userId:string,locale:Locale,deliveryId:string):Promise<WishlistDeliveryResult|{status:'empty'|'blocked'}>{
    if(!isPreferenceRequestId(userId)||!isPreferenceRequestId(deliveryId))return {status:'blocked'};
    let message:WishlistDelivery;
    try{
      const recipient=await options.account.recipient(userId),favorites=await options.account.favorites(userId);
      if(!recipient.ok||!favorites.ok)return {status:'blocked'};
      if(!favorites.value.length)return {status:'empty'};
      const catalog=await options.catalog.load(),link=await options.management(userId,catalog.origin,locale);
      if(!link)return {status:'blocked'};
      const prepared=prepareReminderMessage({catalog,expectedEnvironment:options.environment,ids:favorites.value,storedLocale:locale,
        managementToken:new URLSearchParams(new URL(link.url).hash.slice(1)).get('token')??''});
      if(!prepared.message)return {status:'empty'};
      const current=await options.preference(userId);
      if(!current?.enabled||resolveLocale(current.locale)!==locale)return {status:'blocked'};
      message={deliveryId,recipient:recipient.email,content:prepared.message};
    }catch{return {status:'blocked'};}
    try{return await options.delivery.send(message);}catch{return {status:'unknown'};}
  }};
}
