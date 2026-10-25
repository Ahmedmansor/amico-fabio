import { browserAuth } from '../data/browser';
import { getAuthMessages } from '../data/messages';
import type { AuthConfig } from '../data/config';
import type { Locale } from '../../../shared/config/languages';
import type { AccountSession } from '../domain/auth';
import type {LocaleBrowserConfig} from '../data/locale-browser-config';
import type {getLocaleMessages} from '../data/locale-messages';
import type {bindAccountLocale} from './locale-interactions';
import {getAccountState} from '../data/account-state';
import { readCachedAuthProfile, saveCachedAuthProfile, clearCachedAuthProfile, hasCachedAuthSession } from '../data/auth-cache';
import { clearAccountWishlistCache } from '../../wishlist/data/wishlist-cache';
import { recordPendingReminderOptIn, clearPendingReminderOptIn } from './pending-optin';

async function initialize() {
  const configNode = document.getElementById('auth-config');
  if (!configNode) return;
  const { config, messages: m, locale, localeSettings } = JSON.parse(configNode.textContent!) as {
    config: AuthConfig; messages: ReturnType<typeof getAuthMessages>; locale: Locale;
    localeSettings?: {config: LocaleBrowserConfig; messages: ReturnType<typeof getLocaleMessages>} | null;
  };
  const dialog = document.querySelector<HTMLDialogElement>('[data-auth-dialog]')!;
  const guest = dialog.querySelector<HTMLElement>('[data-auth-guest]')!;
  const account = dialog.querySelector<HTMLElement>('[data-auth-account]')!;
  const status = dialog.querySelector<HTMLElement>('[data-auth-status]')!;
  const form = dialog.querySelector<HTMLFormElement>('[data-auth-form]');
  const email = dialog.querySelector<HTMLInputElement>('#auth-email');
  const inputError = dialog.querySelector<HTMLElement>('[data-auth-input-error]');
  const countdown = dialog.querySelector<HTMLElement>('[data-auth-countdown]');
  const send = dialog.querySelector<HTMLButtonElement>('[data-auth-send]');
  const google = dialog.querySelector<HTMLButtonElement>('[data-auth-google]');
  const signout = dialog.querySelector<HTMLButtonElement>('[data-auth-signout]')!;
  const modeSwitch = dialog.querySelector<HTMLButtonElement>('[data-auth-mode-switch]')!;
  const reminderCheckbox = dialog.querySelector<HTMLInputElement>('[data-auth-reminder-optin]');
  const recordPendingOptIn = () => {
    if (reminderCheckbox?.checked) recordPendingReminderOptIn(sessionStorage, locale);
    else clearPendingReminderOptIn(sessionStorage);
  };
  reminderCheckbox?.addEventListener('change', () => {
    if (!reminderCheckbox.checked) clearPendingReminderOptIn(sessionStorage);
  });
  let signingUp = false;
  const triggers = [...document.querySelectorAll<HTMLButtonElement>('[data-auth-open]')];
  let opener: HTMLElement | null = null;
  let pending = false;
  let session: AccountSession | null = null;
  let ready = false;
  const cachedProfile = readCachedAuthProfile();
  if (cachedProfile) {
    session = { userId: cachedProfile.userId, profile: cachedProfile.profile };
    ready = true;
  } else if (!hasCachedAuthSession()) {
    session = null;
    ready = true;
  }
  const service = await browserAuth(config);
  let localeBinding: ReturnType<typeof bindAccountLocale> | null = null;
  const localeRoot = dialog.querySelector<HTMLElement>('[data-locale-settings]');
  if (service && localeSettings && localeRoot) {
    const {bindAccountLocale} = await import('./locale-interactions');
    localeBinding = bindAccountLocale({root: localeRoot, service, activeLocale: locale, ...localeSettings});
  }
  const profiles = [...document.querySelectorAll<HTMLElement>('[data-auth-profile]')];
  const avatars = [...document.querySelectorAll<HTMLImageElement>('[data-auth-avatar]')];
  for (const image of avatars) {
    const wrapper = image.parentElement!;
    const fallback = wrapper.querySelector<HTMLElement>('[data-auth-avatar-fallback]')!;
    image.addEventListener('load', () => {
      if (!image.getAttribute('src')) return;
      image.hidden = false; fallback.hidden = true; wrapper.dataset.avatarLoading = String(!ready);
    });
    image.addEventListener('error', () => {
      image.dataset.failedSrc = image.getAttribute('src') ?? '';
      image.hidden = true; fallback.hidden = false; wrapper.dataset.avatarLoading = String(!ready);
    });
  }
  const show = (text: string) => { status.textContent = text; status.hidden = !text; };
  function render() {
    if (ready) localeBinding?.setAccount(session?.userId ?? null);
    guest.hidden = !!session;
    account.hidden = !session;
    dialog.toggleAttribute('aria-describedby', !session);
    if (!session) dialog.setAttribute('aria-describedby', 'auth-intro');
    for (const text of document.querySelectorAll<HTMLElement>('[data-auth-entry-guest]')) text.hidden = !ready || !!session;
    for (const profile of profiles) {
      profile.hidden = !session;
      const values = session?.profile;
      profile.querySelector('[data-auth-name]')!.textContent = values?.displayName ?? '';
      profile.querySelector<HTMLElement>('[data-auth-name-row]')!.hidden = !values?.displayName;
      profile.querySelector('[data-auth-email]')!.textContent = values?.email ?? '';
      profile.querySelector<HTMLElement>('[data-auth-email-row]')!.hidden = !values?.email;
    }
    for (const image of avatars) {
      const values = session?.profile;
      const wrapper = image.parentElement!;
      const fallback = wrapper.querySelector<HTMLElement>('[data-auth-avatar-fallback]')!;
      if (!values?.avatarUrl) {
        image.removeAttribute('src'); image.hidden = true; fallback.hidden = false; delete image.dataset.failedSrc;
        wrapper.dataset.avatarLoading = String(!ready);
      } else if (image.getAttribute('src') !== values.avatarUrl) {
        image.hidden = true; fallback.hidden = false; delete image.dataset.failedSrc; image.src = values.avatarUrl;
        wrapper.dataset.avatarLoading = 'true';
      } else {
        wrapper.dataset.avatarLoading = String(!ready || (!image.complete && image.dataset.failedSrc !== values.avatarUrl));
      }
    }
    dialog.querySelector('#auth-title')!.textContent = session ? m.accountTitle : signingUp ? m.signUpTitle : m.title;
    dialog.querySelector('[data-auth-mode-prompt]')!.textContent = signingUp ? m.alreadyRegistered : m.noAccount;
    modeSwitch.textContent = signingUp ? m.signIn : m.signUp;
    modeSwitch.disabled = pending;
    const googleLabel = dialog.querySelector('[data-auth-google-label]');
    if (googleLabel) googleLabel.textContent = signingUp ? m.signUpGoogle : m.google;
    for (const trigger of triggers) {
      if (trigger.classList.contains('auth-trigger')) {
        const firstName = session?.profile.displayName?.trim().split(/\s+/u)[0];
        const label = session ? (firstName ? m.greeting.replace('{name}', firstName) : m.accountTitle) : m.signIn;
        trigger.querySelector('.auth-trigger-label')!.textContent = label;
        trigger.setAttribute('aria-label', label);
        trigger.disabled = !ready;
        trigger.setAttribute('aria-busy', String(!ready));
      } else {
        trigger.textContent = session ? m.accountTitle : m.signIn;
        trigger.hidden = !ready;
      }
    }
    const remaining = service?.remainingCooldown() ?? 0;
    if (send) send.disabled = pending || !service || remaining > 0;
    if (google) google.disabled = pending || !service;
    if (email) email.disabled = pending || !service;
    signout.disabled = pending || !service;
    if (countdown) {
      countdown.hidden = !remaining;
      countdown.textContent = remaining ? m.resend.replace('{seconds}', String(remaining)) : '';
    }
    dialog.setAttribute('aria-busy', String(pending));
    document.getElementById('global-header')?.setAttribute('data-session-pending', String(!ready));
  }
  for (const trigger of triggers) {
    trigger.addEventListener('click', () => {
      opener = trigger;
      signingUp = false;
      show(service ? '' : m.unavailable);
      render();
      dialog.showModal();
      if (session) localeBinding?.refresh();
      (session ? signout : email ?? google)?.focus();
    });
  }
  modeSwitch.addEventListener('click', () => {
    if (pending) return;
    signingUp = !signingUp;
    show('');
    if (inputError) inputError.hidden = true;
    email?.removeAttribute('aria-invalid');
    render();
  });
  dialog.querySelector('[data-auth-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')]
      .filter(element => element.getClientRects().length > 0);
    const first = focusable[0], last = focusable.at(-1);
    if (first && last && ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  dialog.addEventListener('close', () => {
    (opener?.getClientRects().length ? opener : document.querySelector<HTMLButtonElement>('#global-header [data-auth-open]'))?.focus();
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!service || pending) return;
    recordPendingOptIn();
    pending = true; inputError!.hidden = true; email!.removeAttribute('aria-invalid'); show(m.pending); render();
    const result = await service.requestMagicLink(email!.value, locale);
    pending = false;
    if (result.ok) show(m.sent);
    else if (result.reason === 'invalid-email') {
      show(''); inputError!.textContent = m.invalidEmail; inputError!.hidden = false;
      email!.setAttribute('aria-invalid', 'true');
    } else show(result.reason === 'rate-limited' ? m.rateLimited : m.failed);
    render();
    if (!result.ok && result.reason === 'invalid-email') email!.focus();
  });
  google?.addEventListener('click', async () => {
    if (!service || pending) return;
    recordPendingOptIn();
    pending = true; show(m.pending); render();
    const result = await service.googleUrl(locale);
    if (result.ok) { window.location.assign(result.value); return; }
    pending = false; show(m.failed); render();
  });
  signout.addEventListener('click', async () => {
    if (!service || pending) return;
    pending = true; render();
    const result = await service.signOut();
    pending = false;
    if (result.ok) {
      clearCachedAuthProfile();
      clearAccountWishlistCache();
      clearPendingReminderOptIn(sessionStorage);
      session = null; show(''); render(); dialog.close();
      window.location.replace(`/${locale}/`);
      return;
    } else show(m.failed);
    render();
  });
  render();
  if (service) {
    getAccountState(service).subscribe(state => {
      ready = state.status !== 'loading';
      session = state.session;
      if (state.status === 'ready') {
        if (state.session) saveCachedAuthProfile(state.session);
        else clearCachedAuthProfile();
      } else if (state.status === 'failed') {
        clearCachedAuthProfile();
        show(m.failed);
      }
      render();
    });
  } else {ready = true; render();}
  window.addEventListener('storage', event => {
    if (event.key === 'fabio:auth:profile:v1' || (event.key && event.key.startsWith('sb-') && event.key.endsWith('-auth-token'))) {
      const freshCached = readCachedAuthProfile();
      if (freshCached) {
        session = { userId: freshCached.userId, profile: freshCached.profile };
        ready = true;
      } else if (!hasCachedAuthSession()) {
        session = null;
        ready = true;
      }
      render();
    }
  });
  window.setInterval(() => { if (dialog.open) render(); }, 1000);
}
void initialize();
