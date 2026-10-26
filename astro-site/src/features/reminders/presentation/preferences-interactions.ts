import {browserAuth} from '../../auth/data/browser';
import {getAccountState} from '../../auth/data/account-state';
import type {AuthConfig} from '../../auth/data/config';
import type {Locale} from '../../../shared/config/languages';
import type {PreferenceBrowserConfig} from '../data/preferences-browser-config';
import type {getPreferenceMessages} from '../data/preference-messages';
import {createBrowserPreferenceController} from '../data/preferences-browser-controller';
import {bindPreferenceView} from './preferences-view';
import {clearPendingReminderOptIn} from '../../auth/presentation/pending-optin.ts';

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

  // Retire pre-login pending opt-in reconciliation as an active path;
  // purge any stale intent from storage so it cannot silently execute alongside welcome flow.
  clearPendingReminderOptIn(sessionStorage);

  bridge.controller.subscribe(prefState => {
    if (inlineReminder) {
      const isSubscribed = prefState.preference?.enabled === true;
      inlineReminder.dataset.subscribed = String(isSubscribed);
      inlineReminder.hidden = !prefState.userId || isSubscribed;
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
