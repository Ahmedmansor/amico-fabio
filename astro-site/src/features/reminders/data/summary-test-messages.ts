import it from './content/test-it.json' with {type:'json'};
import en from './content/test-en.json' with {type:'json'};
import {supportedLocales,defaultLocale,type Locale} from '../../../shared/config/languages.ts';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
const dictionaries={it,en};validateTranslations(dictionaries,supportedLocales,defaultLocale);
export function getSummaryTestMessages(locale:Locale){return dictionaries[locale];}
