import type {AuthConfig} from '../data/config.ts';
import type {getAuthMessages} from '../data/messages.ts';
import type {Locale} from '../../../shared/config/languages.ts';
import type {OnboardingBrowserConfig} from '../data/onboarding-browser-config.ts';
import type {PostLoginCoordinatorState} from '../data/post-login-coordinator.ts';

export interface WelcomeDialogElements {
  dialog: HTMLDialogElement;
  titleEl: HTMLElement;
  introEl: HTMLElement;
  syncStatusEl: HTMLElement;
  errorEl: HTMLElement;
  reminderCheckbox: HTMLInputElement;
  continueBtn: HTMLButtonElement;
  skipBtn: HTMLButtonElement;
}

export function bindWelcomeDialog(
  elements: WelcomeDialogElements,
  messages: ReturnType<typeof getAuthMessages>,
  actions: {
    onContinue: (reminderOptIn: boolean) => Promise<void>;
    onSkip: () => Promise<void>;
    onDismiss: () => void;
  }
) {
  const {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn} = elements;

  let busy = false;

  function render(state: PostLoginCoordinatorState) {
    if (state.status !== 'prompt') {
      if (dialog.open) dialog.close();
      return;
    }

    introEl.textContent = messages.welcomeIntro;
    errorEl.textContent = '';
    errorEl.hidden = true;

    // Greet by display name when available, with neutral greeting otherwise
    if (state.displayName) {
      titleEl.textContent = messages.welcomeGreetingNamed.replace('{name}', state.displayName);
    } else {
      titleEl.textContent = messages.welcomeGreetingNeutral;
    }

    // Sync status messaging
    const {syncReport} = state;
    if (syncReport.status === 'synced' && syncReport.count > 0) {
      syncStatusEl.textContent = messages.welcomeFavoritesSynced;
      syncStatusEl.hidden = false;
    } else if (syncReport.status === 'syncing') {
      syncStatusEl.textContent = messages.welcomeFavoritesSyncing;
      syncStatusEl.hidden = false;
    } else if (syncReport.status === 'failed') {
      syncStatusEl.textContent = messages.welcomeFavoritesFailed;
      syncStatusEl.hidden = false;
    } else {
      // No favorites: omit the sentence
      syncStatusEl.textContent = '';
      syncStatusEl.hidden = true;
    }

    // Ensure unchecked by default
    reminderCheckbox.checked = false;

    if (!dialog.open) {
      dialog.showModal();
      continueBtn.focus();
    }
  }

  // Keyboard navigation & focus trap
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busy) {
        dialog.close();
        actions.onDismiss();
      }
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),a[href]'
      ),
    ].filter(el => el.getClientRects().length > 0);

    const first = focusable[0];
    const last = focusable.at(-1);

    if (first && last) {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  continueBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    continueBtn.disabled = true;
    skipBtn.disabled = true;
    errorEl.hidden = true;
    errorEl.textContent = '';
    try {
      await actions.onContinue(reminderCheckbox.checked);
      if (dialog.open) dialog.close();
    } catch {
      errorEl.textContent = messages.failed;
      errorEl.hidden = false;
    } finally {
      busy = false;
      continueBtn.disabled = false;
      skipBtn.disabled = false;
    }
  });

  skipBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    continueBtn.disabled = true;
    skipBtn.disabled = true;
    errorEl.hidden = true;
    errorEl.textContent = '';
    try {
      await actions.onSkip();
    } finally {
      busy = false;
      continueBtn.disabled = false;
      skipBtn.disabled = false;
      if (dialog.open) dialog.close();
    }
  });

  return {
    render,
  };
}

async function initialize() {
  const configNode = document.getElementById('welcome-config');
  if (!configNode) return;

  const {config, onboarding, preferences, messages, locale} = JSON.parse(configNode.textContent!) as {
    config: AuthConfig | null;
    onboarding: OnboardingBrowserConfig | null;
    preferences: import('../../reminders/data/preferences-browser-config.ts').PreferenceBrowserConfig | null;
    messages: ReturnType<typeof getAuthMessages>;
    locale: Locale;
  };

  const dialog = document.querySelector<HTMLDialogElement>('[data-welcome-dialog]');
  if (!dialog || !onboarding) return;

  const titleEl = dialog.querySelector<HTMLElement>('[data-welcome-title]')!;
  const introEl = dialog.querySelector<HTMLElement>('[data-welcome-intro]')!;
  const syncStatusEl = dialog.querySelector<HTMLElement>('[data-welcome-sync-status]')!;
  const errorEl = dialog.querySelector<HTMLElement>('[data-welcome-error]')!;
  const reminderCheckbox = dialog.querySelector<HTMLInputElement>('[data-welcome-reminder-optin]')!;
  const continueBtn = dialog.querySelector<HTMLButtonElement>('[data-welcome-continue]')!;
  const skipBtn = dialog.querySelector<HTMLButtonElement>('[data-welcome-skip]')!;

  const {browserAuth} = await import('../data/browser.ts');
  const {browserSupabase} = await import('../../../shared/data/browser-client.ts');
  const {getAccountState} = await import('../data/account-state.ts');
  const {createOnboardingRepository} = await import('../data/onboarding-repository.ts');
  const {createPostLoginCoordinator} = await import('../data/post-login-coordinator.ts');

  const [service, client] = await Promise.all([browserAuth(config), browserSupabase(config)]);
  if (!service || !client) return;

  const onboardingRepo = createOnboardingRepository(client);
  const coordinator = createPostLoginCoordinator({
    onboardingRepo,
    rolloutVersion: onboarding.rolloutVersion,
    onStateChange: state => binding.render(state),
  });

  if (typeof window !== 'undefined') {
    const existingSync = (window as unknown as {__fabio_wishlist_sync?: import('../data/post-login-coordinator.ts').WishlistSyncReport}).__fabio_wishlist_sync;
    if (existingSync) {
      coordinator.updateWishlistSync(existingSync);
    }
    window.addEventListener('fabio:wishlist:sync', ((event: CustomEvent<import('../data/post-login-coordinator.ts').WishlistSyncReport>) => {
      if (event.detail) {
        coordinator.updateWishlistSync(event.detail);
      }
    }) as EventListener);
  }

  const binding = bindWelcomeDialog(
    {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn},
    messages,
    {
      onContinue: async (reminderOptIn: boolean) => {
        const userId = coordinator.getState().userId;
        if (!userId) {
          throw new Error('No authenticated user for onboarding.');
        }

        if (reminderOptIn) {
          if (!preferences) {
            throw new Error('Reminder preferences are not configured.');
          }
          const {createBrowserPreferenceController} = await import(
            '../../reminders/data/preferences-browser-controller.ts'
          );
          const bridge = createBrowserPreferenceController({
            service,
            config: preferences,
            requestId: () => crypto.randomUUID(),
            fetcher: (input, init) => fetch(input, init),
          });

          await bridge.connect(userId);
          const prefState = bridge.controller.getState();
          if (prefState.status !== 'ready') {
            throw new Error('Reminder preference controller failed to ready.');
          }

          await bridge.controller.save(true, locale, locale);
          const savedState = bridge.controller.getState();
          if (savedState.status !== 'ready' || savedState.preference?.enabled !== true) {
            throw new Error('Failed to confirm reminder preference opt-in.');
          }
        }

        const completeResult = await coordinator.complete();
        if (!completeResult.ok) {
          throw new Error('Failed to record onboarding completion.');
        }
      },
      onSkip: async () => {
        const skipResult = await coordinator.skip();
        if (!skipResult.ok) {
          throw new Error('Failed to record onboarding skip.');
        }
      },
      onDismiss: () => {
        coordinator.dismiss();
      },
    }
  );

  getAccountState(service).subscribe(state => {
    if (state.status === 'ready' && state.session) {
      void coordinator.connectUser(state.session.userId, state.session.profile);
    } else if (state.status !== 'loading') {
      void coordinator.connectUser(null);
    }
  });
}

if (typeof document !== 'undefined') {
  void initialize();
}

