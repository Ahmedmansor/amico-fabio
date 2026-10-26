import type {AuthConfig} from '../data/config.ts';
import type {getAuthMessages} from '../data/messages.ts';
import type {Locale} from '../../../shared/config/languages.ts';
import type {OnboardingBrowserConfig} from '../data/onboarding-browser-config.ts';
import type {PostLoginCoordinatorState} from '../data/post-login-coordinator.ts';
import type {AuthService} from '../data/service.ts';

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

export type WelcomeActionResult =
  | { ok: true; stale?: false; error?: never }
  | { ok: false; stale: true; error?: string }
  | { ok: false; stale?: false; error: string };

export function bindWelcomeDialog(
  elements: WelcomeDialogElements,
  messages: ReturnType<typeof getAuthMessages>,
  actions: {
    onContinue: (reminderOptIn: boolean) => Promise<WelcomeActionResult>;
    onSkip: () => Promise<WelcomeActionResult>;
    onDismiss: () => void;
  }
) {
  const {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn} = elements;

  let busy = false;
  let currentDialogGen = 0;
  let currentPromptUser: string | null = null;

  function render(state: PostLoginCoordinatorState) {
    if (state.status !== 'prompt') {
      currentPromptUser = null;
      currentDialogGen++;
      busy = false;
      if (dialog.open) dialog.close();
      return;
    }

    const isFreshOrUserChanged = !dialog.open || currentPromptUser !== state.userId;

    if (isFreshOrUserChanged) {
      currentPromptUser = state.userId;
      currentDialogGen++;
      busy = false;
      continueBtn.disabled = false;
      skipBtn.disabled = false;
      reminderCheckbox.checked = false;
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    introEl.textContent = messages.welcomeIntro;

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
    const clickGen = currentDialogGen;
    const clickUser = currentPromptUser;
    if (!clickUser) return;

    busy = true;
    continueBtn.disabled = true;
    skipBtn.disabled = true;
    errorEl.hidden = true;
    errorEl.textContent = '';

    try {
      const result = await actions.onContinue(reminderCheckbox.checked);

      if (currentDialogGen !== clickGen || currentPromptUser !== clickUser) {
        return;
      }

      if (!result.ok) {
        if (result.stale) return;
        errorEl.textContent = messages.failed;
        errorEl.hidden = false;
        return;
      }

      if (dialog.open) dialog.close();
    } catch {
      if (currentDialogGen === clickGen && currentPromptUser === clickUser) {
        errorEl.textContent = messages.failed;
        errorEl.hidden = false;
      }
    } finally {
      if (currentDialogGen === clickGen && currentPromptUser === clickUser) {
        busy = false;
        continueBtn.disabled = false;
        skipBtn.disabled = false;
      }
    }
  });

  skipBtn.addEventListener('click', async () => {
    if (busy) return;
    const clickGen = currentDialogGen;
    const clickUser = currentPromptUser;
    if (!clickUser) return;

    busy = true;
    continueBtn.disabled = true;
    skipBtn.disabled = true;
    errorEl.hidden = true;
    errorEl.textContent = '';

    try {
      const result = await actions.onSkip();

      if (currentDialogGen !== clickGen || currentPromptUser !== clickUser) {
        return;
      }

      if (!result.ok) {
        if (result.stale) return;
        errorEl.textContent = messages.failed;
        errorEl.hidden = false;
        return;
      }

      if (dialog.open) dialog.close();
    } catch {
      if (currentDialogGen === clickGen && currentPromptUser === clickUser) {
        errorEl.textContent = messages.failed;
        errorEl.hidden = false;
      }
    } finally {
      if (currentDialogGen === clickGen && currentPromptUser === clickUser) {
        busy = false;
        continueBtn.disabled = false;
        skipBtn.disabled = false;
      }
    }
  });

  return {
    render,
  };
}

export function createWelcomeActions(options: {
  coordinator: Pick<ReturnType<typeof import('../data/post-login-coordinator.ts').createPostLoginCoordinator>, 'getState' | 'complete' | 'skip' | 'dismiss'>;
  service: Pick<AuthService, 'bearerFor'>;
  preferences: import('../../reminders/data/preferences-browser-config.ts').PreferenceBrowserConfig | null;
  locale: Locale;
  createBridge?: typeof import('../../reminders/data/preferences-browser-controller.ts').createBrowserPreferenceController;
}) {
  let activeBridge: {
    userId: string;
    controller: ReturnType<typeof import('../../reminders/data/preferences-browser-controller.ts').createBrowserPreferenceController>['controller'];
    connect: (id: string | null) => Promise<void>;
  } | null = null;
  let activeOperationEpoch = 0;

  return {
    resetBridge() {
      activeOperationEpoch++;
      activeBridge = null;
    },
    async onContinue(reminderOptIn: boolean): Promise<WelcomeActionResult> {
      const capturedUser = options.coordinator.getState().userId;
      const capturedEpoch = ++activeOperationEpoch;
      if (!capturedUser) {
        return { ok: false, error: 'No authenticated user for onboarding.' };
      }

      const isCurrent = () =>
        activeOperationEpoch === capturedEpoch &&
        options.coordinator.getState().userId === capturedUser;

      if (reminderOptIn) {
        if (!options.preferences) {
          return { ok: false, error: 'Reminder preferences are not configured.' };
        }

        if (!activeBridge || activeBridge.userId !== capturedUser) {
          const createBridge = options.createBridge ?? (
            await import('../../reminders/data/preferences-browser-controller.ts')
          ).createBrowserPreferenceController;

          if (!isCurrent()) return { ok: false, stale: true };

          const bridge = createBridge({
            service: options.service,
            config: options.preferences,
            requestId: () => crypto.randomUUID(),
            fetcher: (input, init) => fetch(input, init),
          });

          activeBridge = {
            userId: capturedUser,
            controller: bridge.controller,
            connect: id => bridge.connect(id),
          };

          await activeBridge.connect(capturedUser);
        }

        if (!isCurrent()) return { ok: false, stale: true };

        const controller = activeBridge.controller;
        const currentState = controller.getState();

        if (currentState.status === 'error' && currentState.retryable) {
          await controller.retry();
        } else if (currentState.status === 'ready') {
          // If preference is unconfirmed from server in this session, OR enabled is not true,
          // we must verify/save with the server to ensure we never trust stale cache.
          if (!currentState.confirmed || currentState.preference?.enabled !== true) {
            await controller.save(true, options.locale, options.locale);
          }
        } else {
          return { ok: false, error: 'Reminder preference controller is not in a valid state to save.' };
        }

        if (!isCurrent()) return { ok: false, stale: true };

        const savedState = controller.getState();
        if (savedState.status !== 'ready' || savedState.preference?.enabled !== true || !savedState.confirmed) {
          return { ok: false, error: 'Failed to confirm reminder preference opt-in.' };
        }
      }

      if (!isCurrent()) return { ok: false, stale: true };

      const completeResult = await options.coordinator.complete(capturedUser);
      if (!isCurrent()) return { ok: false, stale: true };

      if (!completeResult.ok) {
        return { ok: false, error: completeResult.error || 'Failed to record onboarding completion.' };
      }

      return { ok: true };
    },
    async onSkip(): Promise<WelcomeActionResult> {
      const capturedUser = options.coordinator.getState().userId;
      const capturedEpoch = ++activeOperationEpoch;
      if (!capturedUser) {
        return { ok: false, error: 'No authenticated user for onboarding.' };
      }

      const isCurrent = () =>
        activeOperationEpoch === capturedEpoch &&
        options.coordinator.getState().userId === capturedUser;

      const skipResult = await options.coordinator.skip(capturedUser);
      if (!isCurrent()) return { ok: false, stale: true };

      if (!skipResult.ok) {
        return { ok: false, error: skipResult.error || 'Failed to record onboarding skip.' };
      }

      return { ok: true };
    },
    onDismiss() {
      options.coordinator.dismiss();
    },
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
  const {readCachedOnboarding, saveCachedOnboarding} = await import('../data/onboarding-cache.ts');

  const [service, client] = await Promise.all([browserAuth(config), browserSupabase(config)]);
  if (!service || !client) return;

  let binding: ReturnType<typeof bindWelcomeDialog>;
  const onboardingRepo = createOnboardingRepository(client);
  const coordinator = createPostLoginCoordinator({
    onboardingRepo,
    rolloutVersion: onboarding.rolloutVersion,
    cache: {
      read: (userId, version) => readCachedOnboarding(userId, version),
      save: entry => saveCachedOnboarding(entry),
    },
    onStateChange: state => binding?.render(state),
  });

  const actions = createWelcomeActions({
    coordinator,
    service,
    preferences,
    locale,
  });

  binding = bindWelcomeDialog(
    {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn},
    messages,
    actions
  );

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

  getAccountState(service).subscribe(state => {
    if (state.status === 'ready' && state.session) {
      void coordinator.connectUser(state.session.userId, state.session.profile);
    } else if (state.status !== 'loading') {
      actions.resetBridge();
      void coordinator.connectUser(null);
    }
  });
}

if (typeof document !== 'undefined') {
  void initialize();
}

