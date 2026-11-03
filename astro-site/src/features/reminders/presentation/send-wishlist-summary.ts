import {isLocale,type Locale} from '../../../shared/config/languages.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {prepareWishlistEmail} from '../domain/email.ts';
import type {EmailCatalog} from '../domain/catalog.ts';
import type {WishlistDelivery,WishlistDeliveryPort,WishlistDeliveryResult} from '../domain/delivery.ts';
import type {createEmailAccountSource} from '../data/email-account-source.ts';
import {getEmailMessages} from '../data/messages.mjs';
import {renderWishlistEmail} from './wishlist-email.ts';

/** Requested summary only. No reminder opt-in, queue/Cron or browser recipient.
 * All saved items are loaded for the verified account before calling Brevo. */
export function createWishlistSummarySender(options:{
  account:ReturnType<typeof createEmailAccountSource>;
  catalog:{load():Promise<EmailCatalog>};environment:EmailCatalog['environment'];
  delivery:WishlistDeliveryPort;
}){
  return {async sendForUser(verifiedUserId:string,locale:Locale,deliveryId:string):Promise<WishlistDeliveryResult|{status:'empty'|'blocked'}>{
    if(!isPreferenceRequestId(verifiedUserId)||!isPreferenceRequestId(deliveryId)||!isLocale(locale))return {status:'blocked'};
    let message:WishlistDelivery;
    try{
      const recipient=await options.account.recipient(verifiedUserId);if(!recipient.ok)return {status:'blocked'};
      const favorites=await options.account.favorites(verifiedUserId);if(!favorites.ok)return {status:'blocked'};
      if(!favorites.value.length)return {status:'empty'};
      const catalog=await options.catalog.load();
      const {model}=prepareWishlistEmail({catalog,expectedEnvironment:options.environment,ids:favorites.value,locale,kind:'summary'});
      if(!model)return {status:'empty'};
      message={deliveryId,recipient:recipient.email,content:renderWishlistEmail(model,getEmailMessages(locale))};
    }catch{return {status:'blocked'};}
    try{return await options.delivery.send(message);}catch{return {status:'unknown'};}
  }};
}
