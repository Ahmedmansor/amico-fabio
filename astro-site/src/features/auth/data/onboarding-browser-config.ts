import type {AuthConfig} from './config.ts';

export interface OnboardingBrowserConfig {
  enabled: boolean;
  rolloutVersion: string;
}

export function readOnboardingBrowserConfig(
  env: Record<string, unknown>,
  auth: AuthConfig | null
): OnboardingBrowserConfig | null {
  const flag = env.PUBLIC_ACCOUNT_ONBOARDING_ENABLED;
  if (flag === undefined || flag === '' || flag === '0') return null;
  if (flag !== '1') throw new Error('[auth] PUBLIC_ACCOUNT_ONBOARDING_ENABLED must be 0 or 1.');
  if (!auth) throw new Error('[auth] Onboarding requires enabled Auth configuration.');
  return {
    enabled: true,
    rolloutVersion: 'welcome-v1',
  };
}
