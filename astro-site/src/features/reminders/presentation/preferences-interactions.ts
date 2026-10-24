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
  getAccountState(service).subscribe(state => {
    if (state.status !== 'loading') void bridge.connect(state.status === 'ready' ? state.session?.userId ?? null : null);
  });
}
void initialize();
