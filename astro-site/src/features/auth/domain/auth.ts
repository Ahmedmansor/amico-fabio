export type AuthFailure = 'unavailable' | 'invalid-email' | 'disposable-domain' | 'email-typo' | 'captcha-required' | 'invalid-password' | 'invalid-code' | 'invalid-link' | 'rate-limited' | 'failed' | 'busy';
export type AuthResult<T> = { ok: true; value: T } | { ok: false; reason: AuthFailure };
export interface AccountProfile { displayName: string | null; email: string | null; avatarUrl: string | null }
export interface AccountSession { userId: string; profile: AccountProfile }
export type CallbackInput = { kind: 'email'; tokenHash: string } | { kind: 'google'; code: string } | { kind: 'invalid' };

export { validateEmailAddress, isDisposableDomain, suggestEmailCorrection, type EmailTypoSuggestion, type EmailValidationOutcome } from './email-validation.ts';

/** Preserve mailbox identity, including dots, case and +tags; normalize the domain only. */
export function normalizeEmail(input: string): string | null {
  const email = input.trim();
  if (email.length > 254 || /\s/.test(email)) return null;
  const at = email.lastIndexOf('@');
  if (at < 1 || email.indexOf('@') !== at) return null;
  const local = email.slice(0, at);
  if (local.length > 64 || /[<>()[\]\\,;:"]/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;
  let domain: string;
  if (/[/:?#\\%]/.test(email.slice(at + 1))) return null;
  try {
    // URL's IDNA normalization supports private/international domains, without DNS access.
    const parsed = new URL(`https://${email.slice(at + 1)}/`);
    domain = parsed.hostname;
    if (parsed.port || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
  } catch { return null; }
  if (!domain.includes('.') || domain.length > 253 || !domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) return null;
  return `${local}@${domain.toLowerCase()}`;
}

/** Exact published paths supplied by the caller; no protocols, encodings or arbitrary redirects. */
export function safeReturnPath(value: unknown, allowed: readonly string[], fallback: string): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    && !/[\\%?#\s]/.test(value) && allowed.includes(value) ? value : fallback;
}

export function parseCallback(search: string, hash: string): CallbackInput {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  if (query.has('error') || fragment.has('error') || query.has('token_hash')
    || fragment.has('access_token') || fragment.has('refresh_token')) return { kind: 'invalid' };
  const tokenHash = fragment.get('token_hash');
  const code = query.get('code');
  if (tokenHash && !code && fragment.getAll('token_hash').length === 1
    && fragment.getAll('type').length === 1 && fragment.get('type') === 'email'
    && /^[a-zA-Z0-9_-]{1,512}$/.test(tokenHash)) return { kind: 'email', tokenHash };
  if (code && !fragment.has('token_hash') && query.getAll('code').length === 1
    && /^[a-zA-Z0-9_-]{1,4096}$/.test(code)) return { kind: 'google', code };
  return { kind: 'invalid' };
}

export function cooldownRemaining(sentAt: number | null, now: number, seconds: number): number {
  if (sentAt === null) return 0;
  return Math.max(0, Math.min(seconds, Math.ceil((sentAt + seconds * 1000 - now) / 1000)));
}
