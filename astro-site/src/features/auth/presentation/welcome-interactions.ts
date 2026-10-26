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
  const {dialog, titleEl, introEl, syncStatusEl, reminderCheckbox, continueBtn, skipBtn} = elements;

  let busy = false;

  function render(state: PostLoginCoordinatorState) {
    if (state.status !== 'prompt') {
      if (dialog.open) dialog.close();
      return;
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
    try {
      await actions.onContinue(reminderCheckbox.checked);
    } finally {
      busy = false;
      continueBtn.disabled = false;
      skipBtn.disabled = false;
      if (dialog.open) dialog.close();
    }
  });

  skipBtn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    continueBtn.disabled = true;
    skipBtn.disabled = true;
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

  const {messages} = JSON.parse(configNode.textContent!) as {
    config: AuthConfig | null;
    onboarding: OnboardingBrowserConfig | null;
    messages: ReturnType<typeof getAuthMessages>;
    locale: Locale;
  };

  const dialog = document.querySelector<HTMLDialogElement>('[data-welcome-dialog]');
  if (!dialog) return;

  const titleEl = dialog.querySelector<HTMLElement>('[data-welcome-title]')!;
  const introEl = dialog.querySelector<HTMLElement>('[data-welcome-intro]')!;
  const syncStatusEl = dialog.querySelector<HTMLElement>('[data-welcome-sync-status]')!;
  const reminderCheckbox = dialog.querySelector<HTMLInputElement>('[data-welcome-reminder-optin]')!;
  const continueBtn = dialog.querySelector<HTMLButtonElement>('[data-welcome-continue]')!;
  const skipBtn = dialog.querySelector<HTMLButtonElement>('[data-welcome-skip]')!;

  bindWelcomeDialog(
    {dialog, titleEl, introEl, syncStatusEl, reminderCheckbox, continueBtn, skipBtn},
    messages,
    {
      onContinue: async () => {},
      onSkip: async () => {},
      onDismiss: () => {},
    }
  );
}

void initialize();
