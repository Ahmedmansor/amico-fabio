import type {AuthService} from '../data/service.ts';
import type {LocaleBrowserConfig} from '../data/locale-browser-config.ts';
import type {getLocaleMessages} from '../data/locale-messages.ts';
import {createLocaleClient} from '../data/locale-client.ts';
import {createLocaleCoordinator} from '../data/locale-coordinator.ts';
import {createLocalePendingStore} from '../data/locale-pending-store.ts';
import {createCachedLocaleRepository} from '../data/locale-cache.ts';
import {bindLocaleView} from './locale-view.ts';

/** Feature-scoped binding; Auth supplies its already restored identity. No new
 * currentSession/getUser call or global client controller is introduced. */
export function bindAccountLocale(options: {
  root: HTMLElement; service: Pick<AuthService, 'bearerFor'>; config: LocaleBrowserConfig;
  messages: ReturnType<typeof getLocaleMessages>;
}) {
  let account: string | null = null;
  // Access can throw in restricted browsers. Keep navigation/HTTP usable anyway.
  const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
    getItem: key => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: key => sessionStorage.removeItem(key),
  };
  const client = createLocaleClient({...options.config, fetcher: (input, init) => fetch(input, init),
    session: async expected => {
      if (account !== expected) return null;
      const bearer = await options.service.bearerFor(expected);
      return bearer.ok && account === expected ? {userId: expected, bearer: bearer.value} : null;
    }});
  const cached = createCachedLocaleRepository({repository: client, storage, now: Date.now, maxAgeMs: options.config.cacheMaxAgeMs});
  let render: ReturnType<typeof bindLocaleView> | undefined;
  const pendingStore = createLocalePendingStore({storage, now: Date.now, maxAgeMs: options.config.pendingMaxAgeMs});
  const coordinator = createLocaleCoordinator({repository: cached.repository,
    store: {...pendingStore, read(userId) {
      const value = pendingStore.read(userId);
      // Never replay a site/follow-site command captured by the retired flow.
      if (value && (value.intent.kind !== 'email_explicit'
        || (value.command && value.command.kind !== 'email_explicit'))) {
        pendingStore.remove(userId); return null;
      }
      return value;
    }},
    requestId: () => crypto.randomUUID(), onChange: state => render?.(state)});
  render = bindLocaleView(options.root, coordinator, options.messages);
  render(coordinator.snapshot());
  // Site language anchors only navigate. Correspondence changes require Save.
  return {
    setAccount(userId: string | null) {
      if (account === userId) return;
      account = userId; void coordinator.setAccount(userId);
    },
    refresh() {
      if (!account) return;
      cached.invalidate(account); void coordinator.refresh();
    },
  };
}
