import { readAuthConfig } from './config';
import { readLocaleBrowserConfig } from './locale-browser-config';
import { readOnboardingBrowserConfig } from './onboarding-browser-config';
// Explicit browser Auth settings only. No catalog env loading or key reuse.
export const authConfig = readAuthConfig(import.meta.env);
// Local visual review must not depend on enabling live email delivery.
export const emailPresentationEnabled = !!authConfig && (authConfig.emailEnabled || import.meta.env.DEV);
export const localeBrowserConfig = readLocaleBrowserConfig(import.meta.env, authConfig);
export const onboardingBrowserConfig = readOnboardingBrowserConfig(import.meta.env, authConfig);
