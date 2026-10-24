/** Imported only by a disposable, local-only QA page. No real Auth identity. */
import {bindAccountLocale} from '../../src/features/auth/presentation/locale-interactions';
import {getLocaleMessages} from '../../src/features/auth/data/locale-messages';
import type {Locale} from '../../src/shared/config/languages';
export function mountLocaleFixture() {
  const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002';
  let current: string | null = null;
  const binding = bindAccountLocale({root: document.querySelector<HTMLElement>('[data-locale-settings]')!,
    service: {async bearerFor(expected) {return current === expected ? {ok: true, value: `synthetic-${expected}`} : {ok: false, reason: 'failed'};}},
    config: {endpoint: 'https://locale-qa.invalid/functions/v1/account-locale', timeoutMs: 1000, maxResponseBytes: 4096,
      cacheMaxAgeMs: 300000, pendingMaxAgeMs: 86400000},
    messages: getLocaleMessages(document.documentElement.lang as Locale)});
  document.querySelector('[data-qa-a]')!.addEventListener('click', () => {current = a; binding.setAccount(a);});
  document.querySelector('[data-qa-b]')!.addEventListener('click', () => {current = b; binding.setAccount(b);});
  document.querySelector('[data-qa-out]')!.addEventListener('click', () => {current = null; binding.setAccount(null);});
}
