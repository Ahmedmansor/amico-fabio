import {isLocale} from '../../../shared/config/languages.ts';
import type {getLocaleMessages} from '../data/locale-messages.ts';
import type {createLocaleCoordinator, LocaleCoordinatorState} from '../data/locale-coordinator.ts';

export function bindLocaleView(root: HTMLElement, coordinator: Pick<ReturnType<typeof createLocaleCoordinator>, 'choose' | 'retry' | 'refresh'>,
  messages: ReturnType<typeof getLocaleMessages>) {
  const form = root.querySelector<HTMLFormElement>('[data-locale-form]')!;
  const select = root.querySelector<HTMLSelectElement>('[data-locale-choice]')!;
  const save = root.querySelector<HTMLButtonElement>('[data-locale-save]')!;
  const retry = root.querySelector<HTMLButtonElement>('[data-locale-retry]')!;
  const status = root.querySelector<HTMLElement>('[data-locale-status]')!;
  const noPreference = root.querySelector<HTMLElement>('[data-locale-no-preference]')!;
  let previous: LocaleCoordinatorState['status'] = 'signed-out';
  let pending = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (save.disabled) return;
    if (select.value === 'follow_site') void coordinator.choose({kind: 'email_follow_site'});
    else if (isLocale(select.value)) void coordinator.choose({kind: 'email_explicit', locale: select.value});
  });
  retry.addEventListener('click', () => {void (pending ? coordinator.retry() : coordinator.refresh());});
  return (state: LocaleCoordinatorState) => {
    root.hidden = state.status === 'signed-out'; root.dataset.state = state.status;
    pending = state.pending;
    const busy = state.status === 'loading' || state.status === 'saving';
    root.setAttribute('aria-busy', String(busy));
    const hasPreference = !!state.confirmed?.email;
    form.hidden = !hasPreference;
    noPreference.hidden = busy || !state.confirmed || hasPreference;
    select.disabled = save.disabled = busy || state.status === 'uncertain' || !hasPreference;
    if (state.pendingIntent?.kind === 'email_explicit') select.value = state.pendingIntent.locale;
    else if (state.pendingIntent?.kind === 'email_follow_site') select.value = 'follow_site';
    else if (state.confirmed?.email) select.value = state.confirmed.email.source === 'follow_site' ? 'follow_site' : state.confirmed.email.locale;
    retry.hidden = busy || (!state.pending && state.status !== 'failed')
      || (state.status === 'conflict' && state.pendingIntent?.kind !== 'site');
    let text = state.status === 'loading' ? messages.loading : state.status === 'saving' ? messages.saving
      : state.status === 'uncertain' ? messages.uncertain : state.status === 'conflict' ? messages.conflict
      : state.status === 'failed' ? messages.failed : state.status === 'ready' && previous === 'saving' ? messages.saved : '';
    if (state.pending && !state.durable) text = messages.storageFailed;
    if (state.status !== 'ready' || previous !== 'ready') status.textContent = text;
    status.hidden = !status.textContent; previous = state.status;
  };
}
