import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Locale } from '../../../shared/config/languages.ts';
import { normalizeEmail, safeReturnPath, cooldownRemaining, type AuthFailure, type AuthResult, type AccountSession, type CallbackInput } from '../domain/auth.ts';
import { authReturnPaths, defaultAuthReturn, type AuthConfig } from './config.ts';
import { accountSession } from './profile.ts';
import type {SignupDetails} from '../domain/login.ts';

type Client = Pick<SupabaseClient, 'auth'>;
const failure = (reason: AuthFailure): AuthResult<never> => ({ ok: false, reason });
const success = <T>(value: T): AuthResult<T> => ({ ok: true, value });
function sessionView(session: Session | null): AccountSession | null {
  return session?.user?.id ? accountSession(session.user) : null;
}
function rateLimited(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && error.status === 429;
}

/** SDK/provider interaction only. No DOM, analytics, wishlist operations or secret keys. */
export function createAuthService(client: Client, config: AuthConfig, now: () => number = Date.now) {
  let busy = false;
  let sentAt: number | null = null;
  let verificationRetryAt = 0;
  function callbackUrl(locale: Locale, requestedReturn: unknown): string {
    const callback = new URL(`/${locale}/auth/callback/`, config.siteOrigin);
    callback.searchParams.set('next', safeReturnPath(requestedReturn, authReturnPaths(requestedReturn), defaultAuthReturn(locale)));
    return callback.href;
  }
  return {
    remainingCooldown() { return cooldownRemaining(sentAt, now(), config.resendSeconds); },
    async resendSignupCode(input:string,locale:Locale,requestedReturn?:unknown,captchaToken?:string):Promise<AuthResult<void>>{
      if(!config.passwordEnabled||!config.emailEnabled)return failure('unavailable');
      const {emailSendingGate}=await import('../domain/login.ts');
      const gate=emailSendingGate(input,!!config.turnstileSiteKey,captchaToken);
      if(!gate.ok)return gate;
      if(busy)return failure('busy');
      if(cooldownRemaining(sentAt,now(),config.resendSeconds))return failure('rate-limited');
      busy=true;
      try{
        const {error}=await client.auth.resend({type:'signup',email:gate.value,options:{captchaToken,emailRedirectTo:callbackUrl(locale,requestedReturn)}});
        if(error)return failure(rateLimited(error)?'rate-limited':'failed');
        sentAt=now();return success(undefined);
      }catch{return failure('failed');}finally{busy=false;}
    },
    async verifyEmailCode(email:string,input:string):Promise<AuthResult<AccountSession>>{
      if(!config.emailEnabled)return failure('unavailable');
      const normalized=normalizeEmail(email);
      const {normalizeEmailCode}=await import('../domain/login.ts');
      const code=normalizeEmailCode(input);
      if(!normalized)return failure('invalid-email');
      if(!code)return failure('invalid-code');
      if(busy)return failure('busy');
      if(now()<verificationRetryAt)return failure('rate-limited');
      busy=true;
      try{
        // The email is the captured submitted identity, not a newly edited field.
        // Supabase verifies expiry, single-use and native verification rate limits.
        const {data,error}=await client.auth.verifyOtp({email:normalized,token:code,type:'email'});
        const view=sessionView(data.session);
        if(error||!view){verificationRetryAt=now()+3000;return failure(rateLimited(error)?'rate-limited':'invalid-code');}
        return success(view);
      }catch{verificationRetryAt=now()+3000;return failure('failed');}finally{busy=false;}
    },
    /** Internal feature transport only. Never render, persist again or log this
     * bearer. The receiving backend must remotely verify the token itself. */
    async bearerFor(userId:string):Promise<AuthResult<string>>{
      try{
        const {data,error}=await client.auth.getSession();
        if(error||!data.session||data.session.user.id!==userId||!data.session.access_token)return failure('failed');
        return success(data.session.access_token);
      }catch{return failure('failed');}
    },
    async currentSession(): Promise<AuthResult<AccountSession | null>> {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) return failure('failed');
        if (!data.session) return success(null);
        return success(sessionView(data.session));
      } catch { return failure('failed'); }
    },
    subscribe(listener: (session: AccountSession | null) => void): () => void {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        // Initial restoration goes through currentSession/getUser, including fresh profile.
        if (event === 'INITIAL_SESSION') return;
        // Keep async consumers out of the SDK's locked synchronous callback.
        queueMicrotask(() => listener(sessionView(session)));
      });
      return () => data.subscription.unsubscribe();
    },
    async requestMagicLink(input: string, locale: Locale, requestedReturn?: unknown, captchaToken?: string): Promise<AuthResult<void>> {
      if (!config.emailEnabled) return failure('unavailable');
      const {emailSendingGate} = await import('../domain/login.ts');
      const validation = emailSendingGate(input, !!config.turnstileSiteKey, captchaToken);
      if (!validation.ok) return validation;
      const email = validation.value;
      if (busy) return failure('busy');
      if (cooldownRemaining(sentAt, now(), config.resendSeconds)) return failure('rate-limited');
      busy = true;
      try {
        const { error } = await client.auth.signInWithOtp({ email, options: {
          shouldCreateUser: !config.passwordEnabled, emailRedirectTo: callbackUrl(locale, requestedReturn),
          ...(captchaToken ? { captchaToken } : {}),
        } });
        if (error) {
          if (rateLimited(error)) return failure('rate-limited');
          const msg = typeof error === 'object' && error && 'message' in error ? String(error.message).toLowerCase() : '';
          if (msg.includes('disposable') || msg.includes('temporary email') || msg.includes('domain not allowed')) {
            return failure('disposable-domain');
          }
          return failure('failed');
        }
        sentAt = now();
        return success(undefined);
      } catch { return failure('failed'); } finally { busy = false; }
    },
    async signUp(email: string, password: string, locale: Locale, requestedReturn?: unknown, captchaToken?: string, marketingIntent = false,details?:SignupDetails): Promise<AuthResult<void>> {
      if (!config.passwordEnabled) return failure('unavailable');
      const {emailSendingGate,validNewPassword,passwordsMatch,normalizePersonName} = await import('../domain/login.ts');
      const gate = emailSendingGate(email, true, captchaToken);
      if (!gate.ok) return gate;
      if (!validNewPassword(password)) return failure('invalid-password');
      const firstName=normalizePersonName(details?.firstName),lastName=normalizePersonName(details?.lastName);
      if(!firstName||!lastName)return failure('invalid-name');
      if(!passwordsMatch(password,details?.passwordConfirmation??''))return failure('password-mismatch');
      if (busy) return failure('busy');
      if (cooldownRemaining(sentAt, now(), config.resendSeconds)) return failure('rate-limited');
      busy = true;
      try {
        const { error } = await client.auth.signUp({ email: gate.value, password, options: {
          captchaToken, emailRedirectTo: callbackUrl(locale, requestedReturn),
          // Intent only; never grant marketing permission or reminder consent from metadata.
          data: { site_locale: locale, marketing_consent: marketingIntent === true,
            first_name:firstName,last_name:lastName,full_name:`${firstName} ${lastName}`,
            ...(marketingIntent === true ? {marketing_notice_version: (await import('../../marketing/domain/consent.ts')).marketingNoticeVersion} : {}),
          },
        } });
        if (error) return failure(rateLimited(error) ? 'rate-limited' : 'failed');
        sentAt = now();
        return success(undefined);
      } catch { return failure('failed'); } finally { busy = false; }
    },
    async signInWithPassword(email: string, password: string, captchaToken?: string): Promise<AuthResult<AccountSession>> {
      if (!config.passwordEnabled) return failure('unavailable');
      const normalized = normalizeEmail(email);
      if (!normalized) return failure('invalid-email');
      if (!password || password.length > 128) return failure('invalid-password');
      if (config.turnstileSiteKey && !captchaToken?.trim()) return failure('captcha-required');
      if (busy) return failure('busy');
      busy = true;
      try {
        const { data, error } = await client.auth.signInWithPassword({ email: normalized, password, options: { captchaToken } });
        const view = sessionView(data.session);
        return error || !view ? failure(rateLimited(error) ? 'rate-limited' : 'failed') : success(view);
      } catch { return failure('failed'); } finally { busy = false; }
    },
    async setPassword(password: string,confirmation?:string): Promise<AuthResult<void>> {
      if (!config.passwordEnabled) return failure('unavailable');
      const {validNewPassword,passwordsMatch} = await import('../domain/login.ts');
      if (!validNewPassword(password)) return failure('invalid-password');
      if(!passwordsMatch(password,confirmation??''))return failure('password-mismatch');
      if (busy) return failure('busy');
      busy = true;
      try {
        // Verify an actual session before attempting an authenticated update.
        const identity = await client.auth.getUser();
        if (identity.error || !identity.data.user) return failure('failed');
        const { error } = await client.auth.updateUser({ password });
        return error ? failure(rateLimited(error) ? 'rate-limited' : 'failed') : success(undefined);
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
