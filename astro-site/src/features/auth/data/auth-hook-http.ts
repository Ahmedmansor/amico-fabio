import {readBoundedBody, withDeadline} from './hook-transport.ts';
import type {AuthSendEmailEvent, AuthSendEmailResponse} from './auth-send-email-handler.ts';

/** Standard Webhooks HMAC verification over the exact raw body, before parsing or I/O. */
export function createAuthHookHttpHandler(options: {
  readonly secrets: readonly string[];
  readonly dispatch: (event: AuthSendEmailEvent) => Promise<AuthSendEmailResponse>;
  readonly now?: () => number;
}) {
  const keys = options.secrets.map(secret => {
    const encoded = secret.replace(/^v1,whsec_/, '');
    const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    if (bytes.length < 32 || !/^v1,whsec_/.test(secret)) throw new Error('Invalid signing key');
    return crypto.subtle.importKey('raw', bytes, {name: 'HMAC', hash: 'SHA-256'}, false, ['verify']);
  });
  if (!keys.length) throw new Error('Signing key required');
  const respond = (status: number, body: Record<string, unknown>) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return respond(405, {error: {http_code: 405, message: 'Method not allowed'}});
    try {
      const id = request.headers.get('webhook-id') ?? '';
      const timestamp = request.headers.get('webhook-timestamp') ?? '';
      const signatures = request.headers.get('webhook-signature') ?? '';
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !/^\d{1,12}$/.test(timestamp)
        || Math.abs((options.now?.() ?? Date.now()) / 1000 - Number(timestamp)) > 300
        || signatures.length > 2048) return respond(401, {error: {http_code: 401, message: 'Invalid signature'}});
      const raw = await withDeadline(signal => readBoundedBody(request.body, 32768, signal), 500);
      const message = new TextEncoder().encode(`${id}.${timestamp}.${raw}`);
      let verified = false;
      for (const signature of signatures.split(' ')) {
        if (!/^v1,[A-Za-z0-9+/]{43}=$/.test(signature)) continue;
        const bytes = Uint8Array.from(atob(signature.slice(3)), char => char.charCodeAt(0));
        for (const key of keys) if (await crypto.subtle.verify('HMAC', await key, bytes, message)) verified = true;
      }
      if (!verified) return respond(401, {error: {http_code: 401, message: 'Invalid signature'}});
      const event: unknown = JSON.parse(raw);
      if (!event || typeof event !== 'object' || Array.isArray(event)) return respond(400, {error: {http_code: 400, message: 'Invalid event'}});
      const result = await options.dispatch(event as AuthSendEmailEvent);
      // Auth reads business failures from error.http_code inside a 200 envelope.
      // Transport 4xx instead becomes "Invalid payload sent to hook" in GoTrue.
      return respond(200, result.body);
    } catch { return respond(503, {error: {http_code: 503, message: 'Email hook unavailable'}}); }
  };
}
