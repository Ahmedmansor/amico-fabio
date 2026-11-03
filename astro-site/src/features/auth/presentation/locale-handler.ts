import {isLocaleRequestId} from '../domain/locale-preference.ts';
import type {createLocaleService} from '../data/locale-service.ts';

/** Portable separate backend handler, never an Astro runtime route. */
export function createLocaleHandler(options: {
  service: ReturnType<typeof createLocaleService>;
  verifyUser: (bearer: string) => Promise<{ok: true; userId: string} | {ok: false; reason: 'unauthenticated' | 'unavailable'}>;
  limiter: {take(userId: string, operation: 'read' | 'write'): Promise<
    {status: 'allowed'} | {status: 'unavailable'} | {status: 'limited'; retryAfterSeconds: number}>};
  allowedOrigins: readonly string[];
  maxBodyBytes: number;
  bodyTimeoutMs: number;
}) {
  for (const value of [options.maxBodyBytes, options.bodyTimeoutMs])
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('[auth] Locale body limits required.');
  const origins = new Set(options.allowedOrigins);
  if (!origins.size) throw new Error('[auth] Locale origins required.');
  for (const origin of origins) {
    const url = new URL(origin), local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (url.origin !== origin || (url.protocol !== 'https:' && !(local && url.protocol === 'http:')))
      throw new Error('[auth] Invalid locale origin.');
  }
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    const headers = new Headers({'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin'});
    const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers});
    if (origin && !origins.has(origin)) return respond(403, {error: 'origin-denied'});
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey');
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
    if (!['GET', 'PATCH'].includes(request.method)) return respond(405, {error: 'method-not-allowed'});
    const bearer = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!bearer) return respond(401, {error: 'unauthenticated'});
    try {
      const identity = await options.verifyUser(bearer);
      if (!identity.ok) return respond(identity.reason === 'unauthenticated' ? 401 : 503, {error: identity.reason});
      if (!isLocaleRequestId(identity.userId)) return respond(401, {error: 'unauthenticated'});
      const limit = await options.limiter.take(identity.userId, request.method === 'GET' ? 'read' : 'write');
      if (limit.status === 'unavailable') return respond(503, {error: 'unavailable'});
      if (limit.status === 'limited') {
        if (!Number.isSafeInteger(limit.retryAfterSeconds) || limit.retryAfterSeconds < 1) return respond(503, {error: 'unavailable'});
        headers.set('Retry-After', String(limit.retryAfterSeconds)); return respond(429, {error: 'rate-limited'});
      }
      if (limit.status !== 'allowed') return respond(503, {error: 'unavailable'});
      if (request.method === 'GET') {
        const result = await options.service.read(identity.userId);
        return result.ok ? respond(200, {state: result.value})
          : respond(result.reason === 'missing-profile' ? 404 : 503, {error: result.reason});
      }
      if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return respond(415, {error: 'json-required'});
      const reader = request.body?.getReader();
      if (!reader) return respond(400, {error: 'invalid-input'});
      let expired = false, size = 0, text = '';
      const timer = setTimeout(() => {expired = true; void reader.cancel().catch(() => {});}, options.bodyTimeoutMs);
      const decoder = new TextDecoder('utf-8', {fatal: true});
      let body: unknown;
      try {
        while (true) {
          const chunk = await reader.read();
          if (expired) return respond(408, {error: 'request-timeout'});
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > options.maxBodyBytes) {void reader.cancel().catch(() => {}); return respond(413, {error: 'body-too-large'});}
          text += decoder.decode(chunk.value, {stream: true});
        }
        text += decoder.decode(); body = JSON.parse(text);
      } catch {return respond(expired ? 408 : 400, {error: expired ? 'request-timeout' : 'invalid-input'});}
      finally {clearTimeout(timer); reader.releaseLock();}
      const result = await options.service.change(identity.userId, body);
      if (result.ok) return respond(200, result.value);
      if (result.reason === 'conflict') return respond(409, {error: 'conflict', state: result.state});
      return respond(result.reason === 'invalid-input' ? 400
        : ['missing-profile', 'missing-preference'].includes(result.reason) ? 404 : 503, {error: result.reason});
    } catch {return respond(503, {error: 'unavailable'});}
  };
}
