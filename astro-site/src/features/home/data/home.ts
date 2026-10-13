import it from './content/it.json' with { type: 'json' };
import en from './content/en.json' with { type: 'json' };
import { supportedLocales, defaultLocale, type Locale } from '../../../shared/config/languages.ts';
import { validateTranslations } from '../../../shared/i18n/validate.ts';
import { validateHome } from '../domain/home.ts';
const dictionaries = { it, en };
export function getHomeContent(locale: Locale) {
  validateTranslations(dictionaries, supportedLocales, defaultLocale);
  return validateHome(dictionaries[locale]);
}
