import type {AuthService} from '../../auth/data/service.ts';
import type {PreferenceBrowserConfig} from './preferences-browser-config.ts';
import {createPreferenceClient} from './preferences-client.ts';
import {createPreferenceController} from './preferences-controller.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';

/** Feature-owned consent bridge. Auth supplies identity/bearer, never table access. */
export function createBrowserPreferenceController(options: {
  service: Pick<AuthService, 'bearerFor'>;
  config: PreferenceBrowserConfig;
  fetcher: typeof fetch;
  requestId: () => string;
}) {
  let currentUser: string | null = null;
  const client = createPreferenceClient({...options.config, fetcher: options.fetcher,
    session: async () => {
      const expected = currentUser;
      if (!expected) return null;
      const bearer = await options.service.bearerFor(expected);
      return bearer.ok && currentUser === expected ? {userId: expected, bearer: bearer.value} : null;
    }});
  const controller = createPreferenceController(client, options.requestId);
  return {controller,
    async connect(userId: string | null) {
      const next = isPreferenceRequestId(userId) ? userId : null;
      if (next === currentUser) return;
      currentUser = next; await controller.connect(next);
    }};
}
