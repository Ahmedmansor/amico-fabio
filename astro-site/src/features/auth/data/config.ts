import { supportedLocales, type Locale } from '../../../shared/config/languages.ts';
export interface AuthConfig {
  url: string;
  publishableKey: string;
  siteOrigin: string;
  googleEnabled: boolean;
  emailEnabled: boolean;
  resendSeconds: number;
  microsoftEnabled?: boolean;
  passwordEnabled?: boolean;
  turnstileSiteKey?: string;
}
export function authReturnPaths(requested?: unknown): string[] {
  const paths = supportedLocales.flatMap(locale => [`/${locale}/`, `/${locale}/wishlist/`, `/${locale}/explore/`, `/${locale}/sharm-secrets/`, `/${locale}/legal/`]);
  // Only known static content namespaces, a single conservative slug, no query,
  // fragment, encoding, dot segments, login loops or arbitrary same-origin URLs.
  if (typeof requested === 'string' && supportedLocales.some(locale =>
    new RegExp(`^/${locale}/(?:tours|packages|explore)/[a-z0-9][a-z0-9_-]{0,199}/$`).test(requested))) paths.push(requested);
  return paths;
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
  const microsoftEnabled = flag('PUBLIC_AUTH_MICROSOFT_ENABLED');
  const passwordEnabled = flag('PUBLIC_AUTH_PASSWORD_ENABLED');
  const turnstileSiteKey = typeof env.PUBLIC_AUTH_TURNSTILE_SITE_KEY === 'string' ? env.PUBLIC_AUTH_TURNSTILE_SITE_KEY.trim() : '';
  if (turnstileSiteKey && !/^[a-zA-Z0-9_-]{3,100}$/.test(turnstileSiteKey)) throw new Error('[auth] Invalid Turnstile site key.');
  if (passwordEnabled && (!emailEnabled || !turnstileSiteKey)) throw new Error('[auth] Password signup requires reviewed email sending and Turnstile.');
  if (!emailEnabled && !googleEnabled && !microsoftEnabled) throw new Error('[auth] Enable at least one reviewed sign-in provider.');
  const seconds = emailEnabled ? required('PUBLIC_AUTH_RESEND_SECONDS') : '0';
  if (emailEnabled && (!/^\d+$/.test(seconds) || !Number.isSafeInteger(Number(seconds)) || Number(seconds) < 1)) {
    throw new Error('[auth] PUBLIC_AUTH_RESEND_SECONDS must match the approved positive backend cooldown.');
  }
  return { url: endpoint.origin, publishableKey: key, siteOrigin: site.origin, emailEnabled, googleEnabled, microsoftEnabled, passwordEnabled, turnstileSiteKey, resendSeconds: Number(seconds) };
}
