import {resolveThemePreference, type ThemePreference} from '../domain/theme';
export const themeStorageKey = 'fabio_theme';
export function readThemePreference(): ThemePreference {
  try { return resolveThemePreference(localStorage.getItem(themeStorageKey)); } catch { return 'system'; }
}
export function saveThemePreference(preference: ThemePreference) {
  try { localStorage.setItem(themeStorageKey, preference); } catch { /* The current page still works. */ }
}
