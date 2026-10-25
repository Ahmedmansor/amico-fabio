import {browserAuth} from '../../auth/data/browser';
import {getAccountState} from '../../auth/data/account-state';
import type {AuthConfig} from '../../auth/data/config';
import type {Locale} from '../../../shared/config/languages';
import type {PreferenceBrowserConfig} from '../data/preferences-browser-config';
import type {getPreferenceMessages} from '../data/preference-messages';
import {createBrowserPreferenceController} from '../data/preferences-browser-controller';
import {bindPreferenceView} from './preferences-view';

async function initialize() {
  const node = document.getElementById('reminder-preference-config');
  const root = document.querySelector<HTMLElement>('[data-reminder-preferences]');
  if (!node || !root) return;
  const {auth, config, locale, messages} = JSON.parse(node.textContent!) as {
    auth: AuthConfig; config: PreferenceBrowserConfig; locale: Locale; messages: ReturnType<typeof getPreferenceMessages>;
  };
  const service = await browserAuth(auth); if (!service) return;
  const bridge = createBrowserPreferenceController({service, config, requestId: () => crypto.randomUUID(),
    fetcher: (input, init) => fetch(input, init)});
  bindPreferenceView(root, bridge.controller, locale, messages);
  const inlineReminder = document.querySelector<HTMLElement>('[data-wishlist-inline-reminder]');
  const inlineEnable = inlineReminder?.querySelector<HTMLButtonElement>('[data-wishlist-inline-reminder-enable]');

  inlineEnable?.addEventListener('click', async () => {
    if (bridge.controller.getState().status === 'ready') {
      inlineEnable.disabled = true;
      try {
        await bridge.controller.save(true, locale);
      } finally {
        inlineEnable.disabled = false;
      }
    }
  });

  const optInKey = 'fabio:auth:pending-reminder-optin:v1';
  let reconciling = false;

  const reconcilePendingOptIn = async (userId: string, prefState: ReturnType<typeof bridge.controller.getState>) => {
    if (reconciling || !userId || prefState.userId !== userId) return;
    const raw = sessionStorage.getItem(optInKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const isFresh = !parsed.createdAt || (Date.now() - parsed.createdAt < 24 * 60 * 60 * 1000);
      if (!isFresh || parsed.enabled !== true) {
        sessionStorage.removeItem(optInKey);
        return;
      }
      if (prefState.preference?.enabled === true) {
        sessionStorage.removeItem(optInKey);
        return;
      }
      if (prefState.status === 'ready') {
        reconciling = true;
        try {
          await bridge.controller.save(true, locale, parsed.locale ?? locale);
          const confirmed = bridge.controller.getState();
          if (confirmed.status === 'ready' && confirmed.preference?.enabled === true) {
            sessionStorage.removeItem(optInKey);
          }
        } finally {
          reconciling = false;
        }
      }
    } catch {
      sessionStorage.removeItem(optInKey);
    }
  };

  bridge.controller.subscribe(prefState => {
    if (inlineReminder) {
      const isSubscribed = prefState.preference?.enabled === true;
      inlineReminder.dataset.subscribed = String(isSubscribed);
      inlineReminder.hidden = !prefState.userId || isSubscribed;
    }
    if (prefState.userId) {
      void reconcilePendingOptIn(prefState.userId, prefState);
    }
  });

  getAccountState(service).subscribe(state => {
    if (state.status !== 'loading') {
      const userId = state.status === 'ready' ? state.session?.userId ?? null : null;
      void bridge.connect(userId);
    }
  });
}
void initialize();
