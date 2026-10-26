import {isLocale} from '../../../shared/config/languages.ts';
import {authReturnPaths} from './config.ts';
import {readBoundedBody, sha256, withDeadline} from './hook-transport.ts';
import {validateEmailAddress, isDisposableDomain} from '../domain/email-validation.ts';
import {verifyEmailDomainDns, type DnsVerificationResult} from './dns-verification.ts';

export interface AuthSendEmailEvent {
  readonly user?: {
    readonly id?: string;
    readonly email?: string;
    readonly user_metadata?: {
      readonly site_locale?: string;
      readonly [key: string]: unknown;
    };
  };
  readonly email_data?: {
    readonly token?: string;
    readonly token_hash?: string;
    readonly redirect_to?: string;
    readonly email_action_type?: string;
    readonly site_url?: string;
    readonly token_new?: string;
    readonly token_hash_new?: string;
  };
}

export type DeliveryAdmission = {outcome: 'send'; attemptId: string} | {outcome: 'accepted' | 'blocked' | 'uncertain'};
export interface AuthSendEmailDependencies {
  readonly apiKey: string | null;
  readonly sender: {readonly name: string; readonly email: string};
  readonly allowedOrigins: readonly string[];
  readonly reserve: (input: {email: string; deliveryKey: string}) => Promise<DeliveryAdmission>;
  readonly settle: (input: {deliveryKey: string; attemptId: string; state: 'accepted' | 'unknown' | 'retryable' | 'rejected'; messageId?: string}) => Promise<boolean>;
  readonly verifyDns?: (domain: string) => Promise<DnsVerificationResult>;
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
}

export interface AuthSendEmailResponse {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

export function buildMagicLinkEmailContent(params: {
  readonly recipient: string;
  readonly confirmationUrl: string;
  readonly locale: 'it' | 'en';
}): { readonly subject: string; readonly html: string; readonly text: string } {
  const isIt = params.locale === 'it';

  const subject = isIt
    ? 'Il tuo link di accesso - Fabio Egypt'
    : 'Your sign-in link - Fabio Egypt';

  const title = isIt
    ? 'Accedi a Fabio Egypt'
    : 'Sign in to Fabio Egypt';

  const greeting = isIt
    ? 'Ciao,'
    : 'Hello,';

  const intro = isIt
    ? 'Abbiamo ricevuto una richiesta di accesso al tuo account Fabio Egypt per salvare e gestire i tuoi preferiti.'
    : 'We received a request to sign in to your Fabio Egypt account to save and manage your favorites.';

  const buttonText = isIt
    ? 'Accedi ora'
    : 'Sign in now';

  const validityNotice = isIt
    ? 'Questo link è valido per una sola volta e scade a breve.'
    : 'This link is single-use and expires shortly.';

  const ignoreNotice = isIt
    ? 'Se non hai richiesto questo link, puoi ignorare questa email in tutta sicurezza.'
    : 'If you did not request this link, you can safely ignore this email.';

  const fallbackText = isIt
    ? 'Se il pulsante non funziona, copia e incolla questo indirizzo nel tuo browser:'
    : 'If the button does not work, copy and paste this link into your browser:';

  const htmlUrl = params.confirmationUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const html = `<!DOCTYPE html>
<html lang="${params.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Fabio Egypt</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">${title}</h2>
        <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #334155;">${greeting}</p>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #334155;">${intro}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${htmlUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);">${buttonText}</a>
        </div>
        <p style="margin: 24px 0 8px; font-size: 13px; line-height: 1.5; color: #64748b;">${validityNotice}</p>
        <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: #64748b;">${ignoreNotice}</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">${fallbackText}</p>
        <p style="margin: 0; font-size: 12px; word-break: break-all; color: #64748b;"><a href="${htmlUrl}" style="color: #d97706;">${htmlUrl}</a></p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Fabio Egypt. info@fabioegypt.com
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${title}

${greeting}
${intro}

${buttonText}: ${params.confirmationUrl}

${validityNotice}
${ignoreNotice}

Fabio Egypt - info@fabioegypt.com`;

  return { subject, html, text };
}

export function createAuthSendEmailHandler(deps: AuthSendEmailDependencies) {
  const fetcher = deps.fetcher ?? fetch;
  const verifyDns = deps.verifyDns ?? (domain => verifyEmailDomainDns(domain, {timeoutMs: 500}));
  const timeoutMs = deps.timeoutMs ?? 1500;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1500) throw new Error('Invalid timeout');
  const fail = (status: number, message: string): AuthSendEmailResponse => ({status, body: {error: {http_code: status, message}}});
  return async function handleAuthSendEmail(event: AuthSendEmailEvent): Promise<AuthSendEmailResponse> {
    const validation = typeof event.user?.email === 'string' ? validateEmailAddress(event.user.email) : null;
    if (!validation?.ok) return fail(validation?.reason === 'disposable-domain' ? 403 : 400, 'Invalid or disposable email address.');
    if (isDisposableDomain(validation.domain)) return fail(403, 'Temporary or disposable email domains are not allowed.');
    const {normalizedEmail: email, domain} = validation;
    const userId = event.user?.id;
    const data = event.email_data;
    const tokenHash = data?.token_hash;
    if (typeof userId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(userId)
      || typeof tokenHash !== 'string' || !/^[a-zA-Z0-9_-]{1,512}$/.test(tokenHash)
      || !['magiclink', 'signup'].includes(data?.email_action_type ?? '')) return fail(400, 'Unsupported email event.');
    let callback: URL;
    let locale: 'it' | 'en';
    try {
      callback = new URL(data!.redirect_to!);
      const segment = callback.pathname.split('/')[1];
      if (!deps.allowedOrigins.includes(callback.origin) || callback.username || callback.password || callback.hash
        || !isLocale(segment) || callback.pathname !== `/${segment}/auth/callback/`
        || [...callback.searchParams.keys()].some(key => key !== 'next') || callback.searchParams.getAll('next').length > 1
        || (callback.searchParams.has('next') && !authReturnPaths().includes(callback.searchParams.get('next')!))) throw new Error('Invalid callback');
      locale = segment;
    } catch { return fail(400, 'Invalid callback URL.'); }
    if (!deps.apiKey?.trim()) return fail(503, 'Email service unavailable.');
    try {
      const dns = await verifyDns(domain);
      if (dns.status === 'temporary-dns-failure') return fail(503, 'DNS resolution temporarily unavailable.');
      if (dns.status !== 'valid') return fail(400, 'Email domain does not accept incoming messages.');
      // Canonical identity; never persist the raw token or email body.
      const deliveryKey = await sha256(JSON.stringify([userId, email, data!.email_action_type, tokenHash, callback.href]));
      const admission = await deps.reserve({email, deliveryKey});
      if (admission.outcome === 'accepted') return {status: 200, body: {}};
      if (admission.outcome === 'blocked') return fail(429, 'Email request blocked or rate limited.');
      if (admission.outcome !== 'send') return fail(503, 'Delivery requires reconciliation.');
      callback.hash = new URLSearchParams({token_hash: tokenHash, type: 'email'}).toString();
      const content = buildMagicLinkEmailContent({recipient: email, confirmationUrl: callback.href, locale});
      let delivery: {state: 'accepted' | 'unknown' | 'retryable' | 'rejected'; messageId?: string} = {state: 'unknown'};
      try {
        delivery = await withDeadline(async signal => {
          const response = await fetcher('https://api.brevo.com/v3/smtp/email', {
            method: 'POST', signal,
            headers: {'api-key': deps.apiKey!, 'Content-Type': 'application/json', Accept: 'application/json'},
            body: JSON.stringify({sender: deps.sender, to: [{email, contactPixelTrackingConsent: false}], subject: content.subject, htmlContent: content.html, textContent: content.text}),
          });
          if (response.status === 201) {
            const result: unknown = JSON.parse(await readBoundedBody(response.body, 8192, signal));
            if (result && typeof result === 'object' && 'messageId' in result && typeof result.messageId === 'string'
              && result.messageId.length > 0 && result.messageId.length <= 512) {
              return {state: 'accepted' as const, messageId: result.messageId};
            }
          } else {
            // Only explicit rejections are safe to retry. Ambiguous failures stay quarantined.
            const state = response.status === 429 ? 'retryable' as const : response.status >= 400 && response.status < 500 ? 'rejected' as const : 'unknown' as const;
            void response.body?.cancel().catch(() => {});
            return {state};
          }
          return {state: 'unknown' as const};
        }, timeoutMs);
      } catch { delivery = {state: 'unknown'}; }
      const {state, messageId} = delivery;
      const settled = await deps.settle({deliveryKey, attemptId: admission.attemptId, state, messageId});
      if (!settled) return fail(503, 'Delivery requires reconciliation.');
      return state === 'accepted' ? {status: 200, body: {}} : fail(state === 'retryable' ? 429 : 503, 'Email dispatch unavailable.');
    } catch { return fail(503, 'Email service temporarily unavailable.'); }
  };
}
