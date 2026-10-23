import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Locale } from '../../../shared/config/languages.ts';
import { normalizeEmail, safeReturnPath, cooldownRemaining, type AuthResult, type AccountSession, type CallbackInput } from '../domain/auth.ts';
import { authReturnPaths, defaultAuthReturn, type AuthConfig } from './config.ts';

type Client = Pick<SupabaseClient, 'auth'>;
const failure = (reason: 'unavailable' | 'invalid-email' | 'invalid-link' | 'rate-limited' | 'failed' | 'busy'): AuthResult<never> => ({ ok: false, reason });
const success = <T>(value: T): AuthResult<T> => ({ ok: true, value });
function sessionView(session: Session | null): AccountSession | null {
  return session?.user?.id ? { userId: session.user.id } : null;
}
function rateLimited(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && error.status === 429;
}

/** SDK/provider interaction only. No DOM, analytics, wishlist operations or secret keys. */
export function createAuthService(client: Client, config: AuthConfig, now: () => number = Date.now) {
  let busy = false;
  let sentAt: number | null = null;
  function callbackUrl(locale: Locale, requestedReturn: unknown): string {
    const callback = new URL(`/${locale}/auth/callback/`, config.siteOrigin);
    callback.searchParams.set('next', safeReturnPath(requestedReturn, authReturnPaths(), defaultAuthReturn(locale)));
    return callback.href;
  }
  return {
    remainingCooldown() { return cooldownRemaining(sentAt, now(), config.resendSeconds); },
    async currentSession(): Promise<AuthResult<AccountSession | null>> {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) return failure('failed');
        if (!data.session) return success(null);
        // The SDK owns token refresh; validate identity without using editable metadata.
        const verified = await client.auth.getUser();
        if (verified.error || !verified.data.user || verified.data.user.id !== data.session.user.id) return failure('failed');
        return success({ userId: verified.data.user.id });
      } catch { return failure('failed'); }
    },
    subscribe(listener: (session: AccountSession | null) => void): () => void {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        // Keep async consumers out of the SDK's locked synchronous callback.
        queueMicrotask(() => listener(sessionView(session)));
      });
      return () => data.subscription.unsubscribe();
    },
    async requestMagicLink(input: string, locale: Locale, requestedReturn?: unknown, captchaToken?: string): Promise<AuthResult<void>> {
      if (!config.emailEnabled) return failure('unavailable');
      const email = normalizeEmail(input);
      if (!email) return failure('invalid-email');
      if (busy) return failure('busy');
      if (cooldownRemaining(sentAt, now(), config.resendSeconds)) return failure('rate-limited');
      busy = true;
      try {
        const { error } = await client.auth.signInWithOtp({ email, options: {
          shouldCreateUser: true, emailRedirectTo: callbackUrl(locale, requestedReturn),
          ...(captchaToken ? { captchaToken } : {}),
        } });
        if (error) return failure(rateLimited(error) ? 'rate-limited' : 'failed');
        sentAt = now();
        return success(undefined);
      } catch { return failure('failed'); } finally { busy = false; }
    },
    async googleUrl(locale: Locale, requestedReturn?: unknown): Promise<AuthResult<string>> {
      if (!config.googleEnabled) return failure('unavailable');
      if (busy) return failure('busy');
      busy = true;
      try {
        const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: {
          redirectTo: callbackUrl(locale, requestedReturn), skipBrowserRedirect: true,
        } });
        if (error || !data.url) return failure('failed');
        const target = new URL(data.url);
        if (target.origin !== config.url || target.pathname !== '/auth/v1/authorize') return failure('failed');
        return success(target.href);
      } catch { return failure('failed'); } finally { busy = false; }
    },
    async completeCallback(input: CallbackInput): Promise<AuthResult<AccountSession>> {
      if (input.kind === 'invalid') return failure('invalid-link');
      if ((input.kind === 'email' && !config.emailEnabled) || (input.kind === 'google' && !config.googleEnabled)) return failure('unavailable');
      if (busy) return failure('busy');
      busy = true;
      try {
        const { data, error } = input.kind === 'email'
          ? await client.auth.verifyOtp({ token_hash: input.tokenHash, type: 'email' })
          : await client.auth.exchangeCodeForSession(input.code);
        const session = sessionView(data.session);
        return error || !session ? failure('invalid-link') : success(session);
      } catch { return failure('invalid-link'); } finally { busy = false; }
    },
    async signOut(): Promise<AuthResult<void>> {
      try {
        const { error } = await client.auth.signOut({ scope: 'local' });
        return error ? failure('failed') : success(undefined);
      } catch { return failure('failed'); }
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
