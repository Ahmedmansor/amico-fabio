import it from './dictionaries/it.json';
import en from './dictionaries/en.json';
import { defaultLocale, supportedLocales, type Locale } from '../config/languages.ts';
import { validateTranslations } from './validate.ts';

const dictionaries = { it, en } satisfies Record<Locale, typeof it>;
validateTranslations(dictionaries, supportedLocales, defaultLocale);
export function getSharedMessages(locale: Locale) { return dictionaries[locale]; }
