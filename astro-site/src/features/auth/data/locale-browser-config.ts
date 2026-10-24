import type {AuthConfig} from './config.ts';
export interface LocaleBrowserConfig {
  endpoint: string; timeoutMs: number; maxResponseBytes: number; cacheMaxAgeMs: number; pendingMaxAgeMs: number;
}
/** Disabled by default; endpoint cannot point a bearer at another host/project. */
export function readLocaleBrowserConfig(env: Record<string, unknown>, auth: AuthConfig | null): LocaleBrowserConfig | null {
  const flag = env.PUBLIC_ACCOUNT_LOCALE_ENABLED;
  if (flag === undefined || flag === '' || flag === '0') return null;
  if (flag !== '1') throw new Error('[auth] PUBLIC_ACCOUNT_LOCALE_ENABLED must be 0 or 1.');
  if (!auth || env.PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED !== '1')
    throw new Error('[auth] Locale persistence requires enabled Auth/account profiles.');
  return {endpoint: `${auth.url}/functions/v1/account-locale`, timeoutMs: 10000, maxResponseBytes: 4096,
    cacheMaxAgeMs: 5 * 60 * 1000, pendingMaxAgeMs: 24 * 60 * 60 * 1000};
}
