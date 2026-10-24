import type {AuthConfig} from '../../auth/data/config.ts';
export interface PreferenceBrowserConfig {endpoint: string; timeoutMs: number; maxResponseBytes: number}
/** Consent UI only; this flag is not scheduler/sender activation. */
export function readPreferenceBrowserConfig(env: Record<string, unknown>, auth: AuthConfig | null): PreferenceBrowserConfig | null {
  const flag = env.PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED;
  if (flag === undefined || flag === '' || flag === '0') return null;
  if (flag !== '1') throw new Error('[reminders] Opt-in flag must be 0 or 1.');
  if (!auth || env.PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED !== '1' || env.PUBLIC_ACCOUNT_LOCALE_ENABLED !== '1')
    throw new Error('[reminders] Opt-in requires configured Auth, account profiles and locale persistence.');
  return {endpoint: `${auth.url}/functions/v1/wishlist-email-preferences`, timeoutMs: 20000, maxResponseBytes: 4096};
}
