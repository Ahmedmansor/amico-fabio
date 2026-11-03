export const themePreferences = ['system', 'light', 'dark'] as const;
export type ThemePreference = typeof themePreferences[number];
export function resolveThemePreference(value: unknown): ThemePreference {
  return themePreferences.some(preference => preference === value) ? value as ThemePreference : 'system';
}
export function effectiveTheme(value: unknown, systemDark: boolean): 'light' | 'dark' {
  const preference = resolveThemePreference(value);
  return preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
}
