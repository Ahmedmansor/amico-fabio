// Auth Send Email Hook Entry — Fabio Egypt
// Dispatches Magic Link authentication emails through Brevo REST API
// with email validation, disposable domain rejection, DNS verification, and rate limits.
// Disabled by default. Requires explicit deployment and webhook activation.

import {createClient} from '@supabase/supabase-js';
import configuration from './configuration.json' with {type: 'json'};
import {createAuthSendEmailHandler} from '../../../src/features/auth/data/auth-send-email-handler.ts';

let handler;
try {
  if (configuration.enabled !== true) {
    throw new Error('Send email hook not enabled.');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const backendKey = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');

  if (!supabaseUrl || !backendKey?.startsWith('sb_secret_') || !brevoApiKey) {
    throw new Error('Required backend runtime credentials unavailable.');
  }

  const backend = createClient(supabaseUrl, backendKey, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  });

  const checkRateLimit = async (email) => {
    try {
      const {data, error} = await backend.rpc('check_and_consume_auth_rate_limit', {
        p_email: email,
      });
      if (error) {
        // Fail-closed on database error
        return {allowed: false, reason: 'database_error'};
      }
      return data ?? {allowed: true};
    } catch {
      return {allowed: false, reason: 'database_unreachable'};
    }
  };

  const internalHandler = createAuthSendEmailHandler({
    apiKey: brevoApiKey,
    sender: {
      email: configuration.senderEmail,
      name: configuration.senderName,
    },
    checkRateLimit,
    defaultSiteUrl: configuration.defaultSiteUrl,
  });

  handler = async (req) => {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({error: {message: 'Method not allowed'}}), {
        status: 405,
        headers: {'Content-Type': 'application/json'},
      });
    }

    try {
      const event = await req.json();
      const result = await internalHandler(event);
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: {'Content-Type': 'application/json'},
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({error: {message: detail}}), {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      });
    }
  };
} catch {
  handler = async () =>
    new Response(JSON.stringify({error: 'unavailable'}), {
      status: 503,
      headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
    });
}

Deno.serve(handler);
