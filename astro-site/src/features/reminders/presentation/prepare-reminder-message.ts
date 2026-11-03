import {resolveLocale} from '../../../shared/config/languages.ts';
import {validateEmailCatalog,type EmailCatalog} from '../domain/catalog.ts';
import {correspondenceManagementUrl} from '../domain/management.ts';
import {prepareWishlistEmail} from '../domain/email.ts';
import {getEmailMessages} from '../data/messages.mjs';
import {renderWishlistEmail} from './wishlist-email.ts';
/** Future verified dispatcher supplies persisted consent/eligibility and an
 * issued capability. This prepares content only; it cannot authorize/send mail. */
export function prepareReminderMessage(input:{catalog:unknown;expectedEnvironment:EmailCatalog['environment'];ids:readonly string[];storedLocale:unknown;managementToken:string}){
  const locale=resolveLocale(input.storedLocale),catalog=validateEmailCatalog(input.catalog);
  const unsubscribeUrl=correspondenceManagementUrl(catalog.origin,locale,input.managementToken);
  const prepared=prepareWishlistEmail({catalog,expectedEnvironment:input.expectedEnvironment,ids:input.ids,locale,kind:'reminder',unsubscribeUrl});
  return {unavailableKeys:prepared.unavailableKeys,message:prepared.model?renderWishlistEmail(prepared.model,getEmailMessages(prepared.model.locale)):null};
}
