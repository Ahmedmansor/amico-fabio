import it from './content/preferences-it.json' with {type:'json'};
import en from './content/preferences-en.json' with {type:'json'};
import es from './content/preferences-es.json' with {type:'json'};
import pt from './content/preferences-pt.json' with {type:'json'};
import {supportedLocales,defaultLocale,type Locale} from '../../../shared/config/languages.ts';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
const dictionaries={ it, en, es, pt };
validateTranslations(dictionaries,supportedLocales,defaultLocale);
for(const [locale,messages] of Object.entries(dictionaries))for(const [key,value] of Object.entries(messages))
  if(!value.trim())throw new Error(`[reminder-preference:${locale}] Missing ${key}.`);
export function getPreferenceMessages(locale:Locale){return dictionaries[locale];}
