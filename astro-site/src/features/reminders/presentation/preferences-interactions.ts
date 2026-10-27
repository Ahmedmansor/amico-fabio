import {browserAuth} from '../../auth/data/browser';
import {getAccountState} from '../../auth/data/account-state';
import type {AuthConfig} from '../../auth/data/config';
import type {Locale} from '../../../shared/config/languages';
import type {PreferenceBrowserConfig} from '../data/preferences-browser-config';
import type {getPreferenceMessages} from '../data/preference-messages';
import {createBrowserPreferenceController} from '../data/preferences-browser-controller';
import {clearPendingReminderOptIn} from '../../auth/presentation/pending-optin.ts';

async function initialize() {
  const node = document.getElementById('reminder-preference-config');
  if (!node) return;
  const {auth, config, locale, messages} = JSON.parse(node.textContent!) as {
    auth: AuthConfig; config: PreferenceBrowserConfig; locale: Locale; messages: Pick<ReturnType<typeof getPreferenceMessages>, 'error' | 'outdated' | 'retry'>;
  };
  const service = await browserAuth(auth); if (!service) return;
  const bridge = createBrowserPreferenceController({service, config, requestId: () => crypto.randomUUID(),
    fetcher: (input, init) => fetch(input, init)});
  const inlineReminder = document.querySelector<HTMLElement>('[data-wishlist-inline-reminder]');
  const inlineEnable = inlineReminder?.querySelector<HTMLButtonElement>('[data-wishlist-inline-reminder-enable]');
  const status = document.querySelector<HTMLElement>('[data-wishlist-reminder-status]');
  const enableLabel = inlineEnable?.textContent ?? '';

  inlineEnable?.addEventListener('click', async () => {
    const state = bridge.controller.getState();
    if (state.status === 'ready' || state.status === 'error') {
      inlineEnable.disabled = true;
      try {
        if (state.status === 'error') {
          await (state.retryable ? bridge.controller.retry() : bridge.controller.refresh());
        } else {
          await bridge.controller.save(true, locale);
        }
      } finally {
        inlineEnable.disabled = false;
      }
    }
  });

  // Retire pre-login pending opt-in reconciliation as an active path;
  // purge any stale intent from storage so it cannot silently execute alongside welcome flow.
  try { clearPendingReminderOptIn(window.sessionStorage); } catch { /* Storage may be unavailable. */ }

  bridge.controller.subscribe(prefState => {
    if (inlineReminder) {
      const isSubscribed = prefState.preference?.enabled === true;
      inlineReminder.dataset.subscribed = String(isSubscribed);
      inlineReminder.dataset.preferenceStatus = prefState.status;
      inlineReminder.hidden = !prefState.userId || isSubscribed || !['ready', 'error', 'saving'].includes(prefState.status);
    }
    if (inlineEnable) {
      inlineEnable.disabled = !['ready', 'error'].includes(prefState.status);
      inlineEnable.textContent = prefState.status === 'error' ? messages.retry : enableLabel;
    }
    if (status) {
      status.hidden = prefState.status !== 'error';
      status.textContent = prefState.status === 'error' ? (prefState.error === 'outdated-consent' ? messages.outdated : messages.error) : '';
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
