import it from './content/it.json';
import en from './content/en.json';
import {defaultLocale,supportedLocales,type Locale} from '../../../shared/config/languages';
import {validateTranslations} from '../../../shared/i18n/validate';
const dictionaries={it,en};
validateTranslations(dictionaries,supportedLocales,defaultLocale);
export function getMarketingMessages(locale:Locale){return dictionaries[locale];}
