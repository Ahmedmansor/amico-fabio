import { supportedLocales, type Locale } from '../../../shared/config/languages.ts';
export interface AuthConfig {
  url: string;
  publishableKey: string;
  siteOrigin: string;
  googleEnabled: boolean;
  emailEnabled: boolean;
  resendSeconds: number;
}
export function authReturnPaths(): string[] {
  return supportedLocales.flatMap(locale => [`/${locale}/`, `/${locale}/wishlist/`, `/${locale}/explore/`]);
}
export function defaultAuthReturn(locale: Locale): string { return `/${locale}/`; }

export function readAuthConfig(env: Record<string, unknown>): AuthConfig | null {
  if (env.PUBLIC_AUTH_ENABLED === undefined || env.PUBLIC_AUTH_ENABLED === '' || env.PUBLIC_AUTH_ENABLED === '0') return null;
  if (env.PUBLIC_AUTH_ENABLED !== '1') throw new Error('[auth] PUBLIC_AUTH_ENABLED must be 0 or 1.');
  const required = (key: string) => {
    const value = env[key];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`[auth] Missing ${key}.`);
    return value.trim();
  };
  const flag = (key: string) => {
    if (env[key] === undefined || env[key] === '' || env[key] === '0') return false;
    if (env[key] !== '1') throw new Error(`[auth] ${key} must be 0 or 1.`);
    return true;
  };
  const endpoint = new URL(required('PUBLIC_AUTH_SUPABASE_URL'));
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) {
    throw new Error('[auth] PUBLIC_AUTH_SUPABASE_URL must be an HTTPS origin.');
  }
  const key = required('PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY');
  if (!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key)) throw new Error('[auth] Use a modern publishable key; privileged/legacy keys are not allowed.');
  const site = new URL(required('PUBLIC_AUTH_SITE_URL'));
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(site.hostname);
  if ((site.protocol !== 'https:' && !(site.protocol === 'http:' && loopback)) || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
    throw new Error('[auth] PUBLIC_AUTH_SITE_URL must be an HTTPS origin or local loopback origin.');
  }
  const emailEnabled = flag('PUBLIC_AUTH_EMAIL_ENABLED');
  const googleEnabled = flag('PUBLIC_AUTH_GOOGLE_ENABLED');
  if (!emailEnabled && !googleEnabled) throw new Error('[auth] Enable at least one reviewed sign-in provider.');
  const seconds = emailEnabled ? required('PUBLIC_AUTH_RESEND_SECONDS') : '0';
  if (emailEnabled && (!/^\d+$/.test(seconds) || !Number.isSafeInteger(Number(seconds)) || Number(seconds) < 1)) {
    throw new Error('[auth] PUBLIC_AUTH_RESEND_SECONDS must match the approved positive backend cooldown.');
  }
  return { url: endpoint.origin, publishableKey: key, siteOrigin: site.origin, emailEnabled, googleEnabled, resendSeconds: Number(seconds) };
}
