import { browserAuth } from '../data/browser';
import { getAuthMessages } from '../data/messages';
import type { AuthConfig } from '../data/config';
import type { Locale } from '../../../shared/config/languages';
import type { AccountSession } from '../domain/auth';

async function initialize() {
  const configNode = document.getElementById('auth-config');
  if (!configNode) return;
  const { config, messages: m, locale } = JSON.parse(configNode.textContent!) as { config: AuthConfig; messages: ReturnType<typeof getAuthMessages>; locale: Locale };
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
  const triggers = [...document.querySelectorAll<HTMLButtonElement>('[data-auth-open]')];
  let opener: HTMLElement | null = null;
  let pending = false;
  let session: AccountSession | null = null;
  let revision = 0;
  let ready = false;
  const service = await browserAuth(config);
  const profiles = [...document.querySelectorAll<HTMLElement>('[data-auth-profile]')];
  for (const profile of profiles) {
    const image = profile.querySelector<HTMLImageElement>('[data-auth-avatar]')!;
    const fallback = profile.querySelector<HTMLElement>('[data-auth-avatar-fallback]')!;
    image.addEventListener('load', () => { image.hidden = false; fallback.hidden = true; });
    image.addEventListener('error', () => { image.dataset.failedSrc = image.getAttribute('src') ?? ''; image.hidden = true; fallback.hidden = false; });
  }
  const show = (text: string) => { status.textContent = text; status.hidden = !text; };
  function render() {
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
      const image = profile.querySelector<HTMLImageElement>('[data-auth-avatar]')!;
      const fallback = profile.querySelector<HTMLElement>('[data-auth-avatar-fallback]')!;
      if (!values?.avatarUrl) {
        image.removeAttribute('src'); image.hidden = true; fallback.hidden = false; delete image.dataset.failedSrc;
      } else if (image.getAttribute('src') !== values.avatarUrl) {
        image.hidden = true; fallback.hidden = false; delete image.dataset.failedSrc; image.src = values.avatarUrl;
      }
    }
    dialog.querySelector('#auth-title')!.textContent = session ? m.accountTitle : m.title;
    for (const trigger of triggers) { trigger.textContent = session ? m.accountTitle : m.signIn; trigger.hidden = !ready; }
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
  }
  for (const trigger of triggers) {
    trigger.addEventListener('click', () => {
      opener = trigger;
      show(service ? '' : m.unavailable);
      render();
      dialog.showModal();
      (session ? signout : email ?? google)?.focus();
    });
  }
  dialog.querySelector('[data-auth-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href]')]
      .filter(element => element.getClientRects().length > 0);
    const first = focusable[0], last = focusable.at(-1);
    if (first && last && ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  dialog.addEventListener('close', () => {
    (opener?.getClientRects().length ? opener : document.getElementById('gh-menu-btn'))?.focus();
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!service || pending) return;
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
    if (result.ok) { session = null; show(''); } else show(m.failed);
    render();
  });
  if (service) {
    service.subscribe(next => { revision++; session = next; render(); });
    const before = revision;
    const restored = await service.currentSession();
    if (before === revision) {
      if (restored.ok) session = restored.value;
      else show(m.failed);
    }
  }
  ready = true;
  render();
  window.setInterval(() => { if (dialog.open) render(); }, 1000);
}
void initialize();
