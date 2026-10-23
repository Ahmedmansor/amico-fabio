import { browserAuth } from '../data/browser';
import { parseCallback, safeReturnPath } from '../domain/auth';
import { authReturnPaths, defaultAuthReturn, type AuthConfig } from '../data/config';
import type { getAuthMessages } from '../data/messages';
import type { Locale } from '../../../shared/config/languages';

async function initialize() {
  const globals = window as unknown as { __fabioAuthCallback?: { search: string; hash: string } };
  const handoff = globals.__fabioAuthCallback;
  delete globals.__fabioAuthCallback;
  const { config, messages: m, locale } = JSON.parse(document.getElementById('auth-callback-config')!.textContent!) as { config: AuthConfig | null; messages: ReturnType<typeof getAuthMessages>; locale: Locale };
  let input = parseCallback(handoff?.search ?? '', handoff?.hash ?? '');
  const destination = safeReturnPath(new URLSearchParams(handoff?.search).get('next'), authReturnPaths(), defaultAuthReturn(locale));
  const button = document.querySelector<HTMLButtonElement>('[data-auth-continue]')!;
  const status = document.querySelector<HTMLElement>('[data-auth-callback-status]')!;
  const back = document.querySelector<HTMLAnchorElement>('[data-auth-back]')!;
  back.href = destination;
  const service = await browserAuth(config);
  if (!service) { status.textContent = m.unavailable; return; }
  if (input.kind === 'invalid') { status.textContent = m.invalidLink; return; }
  button.hidden = false;
  let pending = false;
  button.addEventListener('click', async () => {
    if (pending) return;
    pending = true; button.disabled = true; status.textContent = m.pending;
    const result = await service.completeCallback(input);
    input = { kind: 'invalid' };
    if (result.ok) { window.location.replace(destination); return; }
    status.textContent = m.invalidLink;
    button.hidden = true;
    back.focus();
  });
}
void initialize();
