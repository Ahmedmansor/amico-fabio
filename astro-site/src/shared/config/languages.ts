export const languages = {
  it: { label: 'Italiano', direction: 'ltr' },
  en: { label: 'English', direction: 'ltr' },
} as const satisfies Record<string, { label: string; direction: 'ltr' | 'rtl' }>;

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
