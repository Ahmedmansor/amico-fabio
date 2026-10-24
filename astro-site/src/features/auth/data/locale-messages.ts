import it from './content/locale-it.json';
import en from './content/locale-en.json';
import {defaultLocale, supportedLocales, type Locale} from '../../../shared/config/languages';
import {validateTranslations} from '../../../shared/i18n/validate';
const dictionaries = {it, en} satisfies Record<Locale, typeof it>;
validateTranslations(dictionaries, supportedLocales, defaultLocale);
for (const [locale, messages] of Object.entries(dictionaries)) for (const [key, value] of Object.entries(messages))
  if (!value.trim()) throw new Error(`[auth-locale:${locale}] Missing ${key}.`);
export function getLocaleMessages(locale: Locale) {return dictionaries[locale];}
