import { assertLegalAssets } from './assets.mjs';
import it from './content/it.json' with { type: 'json' };
import en from './content/en.json' with { type: 'json' };
import { defaultLocale, supportedLocales, type Locale } from '../../../shared/config/languages.ts';
import { validateTranslations } from '../../../shared/i18n/validate.ts';
import { validateLegalPage, validateSectionIdentity, type LegalPage } from '../domain/legal.ts';

const dictionaries = { it, en } satisfies Record<Locale, LegalPage>;
export const legalIcons: Record<string, string> = Object.fromEntries(
  it.sections.map(section => [section.id, `/assets/images/icons/legal/${section.id === 'motion_data' ? 'intro' : section.id}.svg`]),
);
// motion_data deliberately retains the legacy default intro.svg icon.

export function getLegalPage(locale: Locale): LegalPage {
  validateTranslations(dictionaries, supportedLocales, defaultLocale);
  for (const language of supportedLocales) {
    validateLegalPage(dictionaries[language], language, legalIcons);
    validateSectionIdentity(dictionaries[defaultLocale], dictionaries[language], language);
  }
  assertLegalAssets(legalIcons);
  return dictionaries[locale];
}
