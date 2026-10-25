import it from './content/management-it.json' with {type:'json'};
import en from './content/management-en.json' with {type:'json'};
import {supportedLocales,defaultLocale,type Locale} from '../../../shared/config/languages.ts';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
const messages={it,en};validateTranslations(messages,supportedLocales,defaultLocale);
export function getManagementMessages(locale:Locale){return messages[locale];}
