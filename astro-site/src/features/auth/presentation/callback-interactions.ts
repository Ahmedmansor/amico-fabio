import { browserAuth } from '../data/browser';
import { parseCallback, safeReturnPath } from '../domain/auth';
import { authReturnPaths, defaultAuthReturn, type AuthConfig } from '../data/config';
import type { getAuthMessages } from '../data/messages';
import type { Locale } from '../../../shared/config/languages';

async function initialize() {
  const globals = window as unknown as { __fabioAuthCallback?: { search: string; hash: string } };
  const handoff = globals.__fabioAuthCallback;
  delete globals.__fabioAuthCallback;
  const { config, messages: m, locale,marketingEnabled } = JSON.parse(document.getElementById('auth-callback-config')!.textContent!) as { config: AuthConfig | null; messages: ReturnType<typeof getAuthMessages>; locale: Locale;marketingEnabled?:boolean };
  let input = parseCallback(handoff?.search ?? '', handoff?.hash ?? '');
  const requested = new URLSearchParams(handoff?.search).get('next');
  const destination = safeReturnPath(requested, authReturnPaths(requested), defaultAuthReturn(locale));
  const button = document.querySelector<HTMLButtonElement>('[data-auth-continue]')!;
  const status = document.querySelector<HTMLElement>('[data-auth-callback-status]')!;
  const intro = document.querySelector<HTMLElement>('[data-auth-callback-intro]')!;
  const back = document.querySelector<HTMLAnchorElement>('[data-auth-back]')!;
  const requestNew = document.querySelector<HTMLAnchorElement>('[data-auth-request-new]');
  back.href = defaultAuthReturn(locale);
  const service = await browserAuth(config);
  if (!service) { status.textContent = m.unavailable; return; }
  if (input.kind === 'invalid') {
    status.textContent = m.invalidLink;
    if (requestNew) requestNew.hidden = false;
    return;
  }
  let pending = false;
  const complete = async () => {
    if (pending) return;
    pending = true; button.disabled = true; status.textContent = m.pending;
    const result = await service.completeCallback(input);
    input = { kind: 'invalid' };
    if (result.ok) {
      if(marketingEnabled&&config){
        // Auth is already complete. Optional consent failure cannot block access;
        // the account preference view retries the durable verified signup intent.
        try{const {browserMarketing}=await import('../../marketing/data/browser');const repository=await browserMarketing(config);await repository?.activateSignup(result.value.userId);}catch{}
      }
      window.location.replace(destination); return;
    }
    status.textContent = m.invalidLink;
    button.hidden = true;
    if (requestNew) { requestNew.hidden = false; requestNew.focus(); }
    else { back.focus(); }
  };
  if (input.kind === 'google') {
    // OAuth already follows an explicit sign-in action; exchange PKCE once on return.
    await complete();
  } else {
    // Email links retain the explicit action before consuming their one-time token.
    intro.textContent = m.callbackIntro;
    button.hidden = false;
    button.addEventListener('click', () => { void complete(); });
  }
}
void initialize();
