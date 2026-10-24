import {isLocaleRequestId, parseLocaleCommand, type LocaleRepository} from '../domain/locale-preference.ts';

/** Backend only: verifiedUserId must come from remote Auth verification, never JSON. */
export function createLocaleService(repository: LocaleRepository) {
  return {
    async read(verifiedUserId: string) {
      if (!isLocaleRequestId(verifiedUserId)) return {ok: false, reason: 'invalid-input'} as const;
      return repository.read(verifiedUserId);
    },
    async change(verifiedUserId: string, body: unknown) {
      const command = parseLocaleCommand(body);
      if (!isLocaleRequestId(verifiedUserId) || !command) return {ok: false, reason: 'invalid-input'} as const;
      return repository.change(verifiedUserId, command);
    },
  };
}
