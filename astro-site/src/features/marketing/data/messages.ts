import it from './content/it.json';
import en from './content/en.json';
import es from './content/es.json';
import pt from './content/pt.json';
import de from './content/de.json';
import {defaultLocale,supportedLocales,type Locale} from '../../../shared/config/languages';
import {validateTranslations} from '../../../shared/i18n/validate';
const dictionaries={ it, en, es, pt, de };
validateTranslations(dictionaries,supportedLocales,defaultLocale);
export function getMarketingMessages(locale:Locale){return dictionaries[locale];}
