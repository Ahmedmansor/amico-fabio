import {isLocaleRequestId, parseLocaleCommand, parseAccountLocaleState, parseLocaleMutation,
  type LocaleCommand, type LocaleRepository, type LocaleResult} from '../domain/locale-preference.ts';

/** Browser HTTP transport. Ownership is checked locally, then derived remotely;
 * tokens appear in headers only. Unload writes use keepalive, never a delivery promise. */
export function createLocaleClient(options: {
  endpoint: string;
  session: (userId: string) => Promise<{userId: string; bearer: string} | null>;
  fetcher: typeof fetch;
  timeoutMs: number;
  maxResponseBytes: number;
}): LocaleRepository {
  const url = new URL(options.endpoint), local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash)
    throw new Error('[auth] Invalid locale endpoint.');
  for (const value of [options.timeoutMs, options.maxResponseBytes])
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('[auth] Locale transport limits required.');
  const failure = (): LocaleResult<never> => ({ok: false, reason: 'failed'});
  async function request(userId: string, command?: LocaleCommand): Promise<{status: number; body: Record<string, unknown>} | null> {
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<null>(resolve => {timer = setTimeout(() => {
      controller.abort(); void reader?.cancel().catch(() => {}); resolve(null);
    }, options.timeoutMs);});
    const execute = async () => {
      try {
        const session = await options.session(userId);
        if (controller.signal.aborted || session?.userId !== userId || !session.bearer || /\s/.test(session.bearer)) return null;
        const response = await options.fetcher(url.href, {method: command ? 'PATCH' : 'GET', signal: controller.signal,
          keepalive: !!command, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
          headers: {Authorization: `Bearer ${session.bearer}`, Accept: 'application/json', ...(command ? {'Content-Type': 'application/json'} : {})},
          ...(command ? {body: JSON.stringify(command)} : {})});
        if (response.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {await response.body?.cancel(); return null;}
        reader = response.body?.getReader(); if (!reader) return null;
        const decoder = new TextDecoder('utf-8', {fatal: true}); let size = 0, text = '';
        try {
          while (true) {
            const chunk = await reader.read(); if (chunk.done) break;
            size += chunk.value.byteLength;
            if (size > options.maxResponseBytes) {await reader.cancel(); return null;}
            text += decoder.decode(chunk.value, {stream: true});
          }
          text += decoder.decode();
        } finally {reader.releaseLock();}
        const body = JSON.parse(text);
        return body && typeof body === 'object' && !Array.isArray(body) ? {status: response.status, body} : null;
      } catch {return null;}
    };
    try {return await Promise.race([execute(), timeout]);} finally {clearTimeout(timer!);}
  }
  return {
    async read(userId) {
      if (!isLocaleRequestId(userId)) return {ok: false, reason: 'invalid-input'};
      const response = await request(userId);
      if (!response) return failure();
      if (response.status === 404 && response.body.error === 'missing-profile') return {ok: false, reason: 'missing-profile'};
      if (response.status !== 200 || Object.keys(response.body).length !== 1) return failure();
      const state = parseAccountLocaleState(response.body.state);
      return state ? {ok: true, value: state} : failure();
    },
    async change(userId, input) {
      const command = parseLocaleCommand(input);
      if (!isLocaleRequestId(userId) || !command) return {ok: false, reason: 'invalid-input'};
      const response = await request(userId, command);
      if (!response) return failure();
      if (response.status === 200) {
        const result = parseLocaleMutation(response.body, command);
        return result?.ok ? result : failure();
      }
      if (response.status === 409 && response.body.error === 'conflict' && Object.keys(response.body).length === 2)
        return parseLocaleMutation({outcome: 'conflict', state: response.body.state}, command) ?? failure();
      if (response.status === 404 && response.body.error === 'missing-preference') return {ok: false, reason: 'missing-preference'};
      return failure();
    },
  };
}
