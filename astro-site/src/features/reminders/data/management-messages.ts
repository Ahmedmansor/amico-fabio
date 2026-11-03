import it from './content/management-it.json' with {type:'json'};
import en from './content/management-en.json' with {type:'json'};
import es from './content/management-es.json' with {type:'json'};
import pt from './content/management-pt.json' with {type:'json'};
import de from './content/management-de.json' with {type:'json'};
import {supportedLocales,defaultLocale,type Locale} from '../../../shared/config/languages.ts';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
const messages={ it, en, es, pt, de };validateTranslations(messages,supportedLocales,defaultLocale);
export function getManagementMessages(locale:Locale){return messages[locale];}
