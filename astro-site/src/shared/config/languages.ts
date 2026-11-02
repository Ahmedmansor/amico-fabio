export const languages = {
  it: { label: 'Italiano', direction: 'ltr', ogLocale: 'it_IT', languageTag: 'it-IT', blogPublished: true },
  en: { label: 'English', direction: 'ltr', ogLocale: 'en_US', languageTag: 'en-US', blogPublished: true },
  es: { label: 'Español', direction: 'ltr', ogLocale: 'es_ES', languageTag: 'es-ES', blogPublished: false },
  pt: { label: 'Português', direction: 'ltr', ogLocale: 'pt_PT', languageTag: 'pt-PT', blogPublished: false },
} as const satisfies Record<string, { label: string; direction: 'ltr' | 'rtl'; ogLocale: string; languageTag: string; blogPublished: boolean }>;

export type Locale = keyof typeof languages;
export const defaultLocale: Locale = 'it';
export const supportedLocales = Object.keys(languages) as Locale[];
export const blogLocales = supportedLocales.filter(locale => languages[locale].blogPublished);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.hasOwn(languages, value);
}

// Callers supply stored preferences; this module never reads browser storage.
export function resolveLocale(...preferences: unknown[]): Locale {
  return preferences.find(isLocale) ?? defaultLocale;
}
