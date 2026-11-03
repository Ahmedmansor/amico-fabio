// Auth mail runtime. Fail closed; log only fixed startup codes, never values.
import {createClient} from '@supabase/supabase-js';
import configuration from './configuration.json' with {type: 'json'};
import {createAuthSendEmailHandler} from '../../../src/features/auth/data/auth-send-email-handler.ts';
import {createAuthHookHttpHandler} from '../../../src/features/auth/data/auth-hook-http.ts';
import {createAuthDeliveryRepository} from '../../../src/features/auth/data/auth-delivery-repository.ts';

let handler = async () => Response.json({error: {http_code: 503, message: 'Email hook unavailable'}}, {status: 503, headers: {'Cache-Control': 'no-store'}});
let startupCode = 'DISABLED';
try {
  if (configuration.enabled !== true) throw new Error('Disabled');
  startupCode = 'BACKEND_ENV_INVALID';
  const url = Deno.env.get('SUPABASE_URL');
  const key = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
  const apiKey = Deno.env.get('BREVO_API_KEY');
  const signingSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  const missing = [
    ['PROJECT_URL_MISSING', !url], ['BACKEND_KEY_MISSING', !key?.startsWith('sb_secret_')],
    ['BREVO_KEY_MISSING', !apiKey?.trim()], ['HOOK_SIGNING_SECRET_MISSING', !signingSecret?.trim()],
  ].filter(([, absent]) => absent).map(([code]) => code);
  if (missing.length) {startupCode = missing.join(','); throw new Error('Missing configuration');}
  startupCode = 'ORIGINS_INVALID';
  if (!Array.isArray(configuration.allowedOrigins) || !configuration.allowedOrigins.length
    || configuration.allowedOrigins.some(value => {
      const origin = new URL(value);
      return origin.origin !== value || (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname)));
    })) throw new Error('Invalid origins');
  startupCode = 'CLIENT_OR_LIMITS_INVALID';
  const repository = createAuthDeliveryRepository(createClient(url, key, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  }), configuration.limits);
  startupCode = 'HOOK_CONFIGURATION_INVALID';
  handler = createAuthHookHttpHandler({
    secrets: [signingSecret],
    dispatch: createAuthSendEmailHandler({
      apiKey, sender: {email: configuration.senderEmail, name: configuration.senderName},
      allowedOrigins: configuration.allowedOrigins, timeoutMs: configuration.timeoutMs,
      ...repository,
    }),
  });
} catch { console.error(`[auth-send-email] startup:${startupCode}`); }
Deno.serve(handler);
