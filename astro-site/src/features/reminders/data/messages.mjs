import it from './content/it.json' with {type:'json'};
import en from './content/en.json' with {type:'json'};
import {supportedLocales,defaultLocale,isLocale} from '../../../shared/config/languages.ts';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
const dictionaries={it,en};
validateTranslations(dictionaries,supportedLocales,defaultLocale);
/** @param {import('../../../shared/config/languages.ts').Locale} locale
 * @returns {import('../domain/email.ts').EmailCopy} */
export function getEmailMessages(locale){
  if(!isLocale(locale))throw new Error('[wishlist-email] Unsupported language.');
  const messages=dictionaries[locale];
  for(const [key,value] of Object.entries(messages))if(!value.trim())throw new Error(`[wishlist-email:${locale}] Missing ${key}.`);
  return messages;
}
