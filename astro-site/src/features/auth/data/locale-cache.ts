import {isLocaleRequestId, parseAccountLocaleState, type AccountLocaleState, type LocaleRepository} from '../domain/locale-preference.ts';

/** Per-tab display/cache hint, never an authorization or consent source. Writes
 * always reach the backend with a revision, even when this hint is present. */
export function createCachedLocaleRepository(options: {
  repository: LocaleRepository;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  now: () => number;
  maxAgeMs: number;
}) {
  if (!Number.isSafeInteger(options.maxAgeMs) || options.maxAgeMs < 1) throw new Error('[auth] Locale cache lifetime required.');
  const invalidated = new Set<string>();
  function key(id: string) {
    if (!isLocaleRequestId(id)) throw new Error('[auth] Account required.');
    return `fabio:locale-cache:v1:${id}`;
  }
  function save(id: string, state: AccountLocaleState) {
    try {options.storage.setItem(key(id), JSON.stringify({version: 1, savedAt: options.now(), state}));} catch { /* Cache is optional. */ }
  }
  function cached(id: string): AccountLocaleState | null {
    try {
      const raw = options.storage.getItem(key(id));
      if (!raw || raw.length > 2048) return null;
      const row = JSON.parse(raw), age = options.now() - row.savedAt;
      if (row.version !== 1 || !Number.isSafeInteger(row.savedAt) || age < 0 || age > options.maxAgeMs
        || Object.keys(row).some(field => !['version', 'savedAt', 'state'].includes(field))) return null;
      return parseAccountLocaleState(row.state);
    } catch {return null;}
  }
  const repository: LocaleRepository = {
    async read(id) {
      if (!isLocaleRequestId(id)) return {ok: false, reason: 'invalid-input'};
      const force = invalidated.delete(id);
      const hit = force ? null : cached(id);
      if (hit) return {ok: true, value: hit};
      const result = await options.repository.read(id);
      if (result.ok) save(id, result.value);
      return result;
    },
    async change(id, command) {
      const result = await options.repository.change(id, command);
      if (result.ok) save(id, result.value.state);
      else if (result.reason === 'conflict') save(id, result.state);
      return result;
    },
  };
  return {repository, invalidate(id: string) {invalidated.add(id); try {options.storage.removeItem(key(id));} catch { /* Force-read remains active in memory. */ }}};
}
