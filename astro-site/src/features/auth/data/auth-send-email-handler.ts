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

export interface AuthRateLimitResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly retry_after_seconds?: number;
}

export interface AuthSendEmailDependencies {
  readonly apiKey: string | null;
  readonly sender: {
    readonly name: string;
    readonly email: string;
  };
  readonly verifyDns?: (domain: string) => Promise<DnsVerificationResult>;
  readonly checkRateLimit?: (email: string) => Promise<AuthRateLimitResult>;
  readonly fetcher?: typeof fetch;
  readonly defaultSiteUrl?: string;
  readonly isDispatchAllowed?: () => boolean;
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
          <a href="${params.confirmationUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);">${buttonText}</a>
        </div>
        <p style="margin: 24px 0 8px; font-size: 13px; line-height: 1.5; color: #64748b;">${validityNotice}</p>
        <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: #64748b;">${ignoreNotice}</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">${fallbackText}</p>
        <p style="margin: 0; font-size: 12px; word-break: break-all; color: #64748b;"><a href="${params.confirmationUrl}" style="color: #d97706;">${params.confirmationUrl}</a></p>
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
  const verifyDns = deps.verifyDns ?? verifyEmailDomainDns;
  const defaultSiteUrl = deps.defaultSiteUrl ?? 'https://fabioegypt.com';

  return async function handleAuthSendEmail(event: AuthSendEmailEvent): Promise<AuthSendEmailResponse> {
    const rawEmail = event.user?.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return {
        status: 400,
        body: { error: { http_code: 400, message: 'Missing recipient email address.' } },
      };
    }

    // Step 1: Syntax & RFC Structure Validation
    const validation = validateEmailAddress(rawEmail);
    if (!validation.ok) {
      if (validation.reason === 'disposable-domain') {
        return {
          status: 403,
          body: { error: { http_code: 403, message: 'Temporary or disposable email domains are not allowed.' } },
        };
      }
      return {
        status: 400,
        body: { error: { http_code: 400, message: 'Invalid email address format.' } },
      };
    }

    const email = validation.normalizedEmail;
    const domain = validation.domain;

    // Step 2: Maintained Disposable Domain Check
    if (isDisposableDomain(domain)) {
      return {
        status: 403,
        body: { error: { http_code: 403, message: 'Temporary or disposable email domains are not allowed.' } },
      };
    }

    // Step 3: Real DNS Verification with DoH
    const dnsResult = await verifyDns(domain);
    if (dnsResult.status === 'nonexistent-domain' || dnsResult.status === 'no-mail-exchange') {
      return {
        status: 400,
        body: { error: { http_code: 400, message: 'Email domain does not accept incoming messages.' } },
      };
    }

    if (dnsResult.status === 'temporary-dns-failure') {
      return {
        status: 503,
        body: { error: { http_code: 503, message: 'DNS resolution temporarily unavailable. Please retry shortly.' } },
      };
    }

    // Step 4: Atomic Rate Limiting (Global + Per-Email)
    if (deps.checkRateLimit) {
      const rateLimit = await deps.checkRateLimit(email);
      if (!rateLimit.allowed) {
        return {
          status: 429,
          body: {
            error: {
              http_code: 429,
              message: 'Too many requests. Please wait before requesting another sign-in link.',
              retry_after_seconds: rateLimit.retry_after_seconds,
            },
          },
        };
      }
    }

    // Step 5: Check if sending is allowed / credentials configured
    if (deps.isDispatchAllowed && !deps.isDispatchAllowed()) {
      return {
        status: 503,
        body: { error: { http_code: 503, message: 'Email service unavailable.' } },
      };
    }

    if (!deps.apiKey || !deps.apiKey.trim()) {
      return {
        status: 503,
        body: { error: { http_code: 503, message: 'Email service configuration incomplete.' } },
      };
    }

    // Step 6: Construct Confirmation URL
    const emailData = event.email_data;
    const tokenHash = emailData?.token_hash ?? '';
    const actionType = emailData?.email_action_type ?? 'magiclink';
    const redirectTo = emailData?.redirect_to ?? `${defaultSiteUrl}/auth/callback`;
    const siteUrl = emailData?.site_url ?? defaultSiteUrl;

    const confirmationUrl = `${siteUrl.replace(/\/$/, '')}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(actionType)}&redirect_to=${encodeURIComponent(redirectTo)}`;

    // Step 7: Localized Email Content
    const userLocale = event.user?.user_metadata?.site_locale === 'en' ? 'en' : 'it';
    const emailContent = buildMagicLinkEmailContent({
      recipient: email,
      confirmationUrl,
      locale: userLocale,
    });

    // Step 8: Real Brevo REST API Dispatch
    try {
      const brevoResponse = await fetcher('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': deps.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: deps.sender,
          to: [{ email, contactPixelTrackingConsent: false }],
          subject: emailContent.subject,
          htmlContent: emailContent.html,
          textContent: emailContent.text,
        }),
      });

      if (brevoResponse.status === 201) {
        // Successfully accepted by Brevo for delivery
        return { status: 200, body: {} };
      }

      if (brevoResponse.status === 429) {
        return {
          status: 429,
          body: { error: { http_code: 429, message: 'Provider rate limit reached. Please try again later.' } },
        };
      }

      return {
        status: 502,
        body: { error: { http_code: 502, message: 'Provider rejected email dispatch.' } },
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return {
        status: 500,
        body: { error: { http_code: 500, message: `Failed to dispatch email: ${detail}` } },
      };
    }
  };
}
