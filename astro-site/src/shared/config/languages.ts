export const languages = {
  it: { label: 'Italiano', direction: 'ltr', ogLocale: 'it_IT' },
  en: { label: 'English', direction: 'ltr', ogLocale: 'en_US' },
} as const satisfies Record<string, { label: string; direction: 'ltr' | 'rtl'; ogLocale: string }>;

export type Locale = keyof typeof languages;
export const defaultLocale: Locale = 'it';
export const supportedLocales = Object.keys(languages) as Locale[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.hasOwn(languages, value);
}

// Callers supply stored preferences; this module never reads browser storage.
export function resolveLocale(...preferences: unknown[]): Locale {
  return preferences.find(isLocale) ?? defaultLocale;
}
