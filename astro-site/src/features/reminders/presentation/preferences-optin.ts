import type {Locale} from '../../../shared/config/languages.ts';
import type {PreferenceViewState} from '../data/preferences-controller.ts';
import {
  PENDING_REMINDER_OPTIN_KEY,
  type PendingReminderOptIn,
  clearPendingReminderOptIn,
} from '../../auth/presentation/pending-optin.ts';

export interface ReconcileOptInOptions {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  userId: string;
  prefState: PreferenceViewState;
  activeLocale: Locale;
  save: (enabled: boolean, locale: Locale, consentLocale?: Locale) => Promise<void>;
  getState: () => PreferenceViewState;
}

export async function reconcilePendingOptIn(
  options: ReconcileOptInOptions
): Promise<'skipped' | 'bound' | 'saved' | 'cleared' | 'failed' | 'mismatched'> {
  const {storage, userId, prefState, activeLocale, save, getState} = options;
  if (!userId || prefState.userId !== userId) return 'skipped';

  let raw: string | null = null;
  try {
    raw = storage.getItem(PENDING_REMINDER_OPTIN_KEY);
  } catch {
    return 'skipped';
  }
  if (!raw) return 'skipped';

  let parsed: PendingReminderOptIn;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearPendingReminderOptIn(storage);
    return 'cleared';
  }

  // 1. Freshness check (24 hours) and enabled flag
  const isFresh = !parsed.createdAt || (Date.now() - parsed.createdAt < 24 * 60 * 60 * 1000);
  if (!isFresh || parsed.enabled !== true) {
    clearPendingReminderOptIn(storage);
    return 'cleared';
  }

  // 2. Account binding check:
  // If targetUserId is set and does not match this userId, this intent belongs to a different account.
  // Never leak or apply it across accounts!
  if (parsed.targetUserId && parsed.targetUserId !== userId) {
    clearPendingReminderOptIn(storage);
    return 'mismatched';
  }

  // Bind targetUserId to this userId if not yet bound
  if (!parsed.targetUserId) {
    parsed.targetUserId = userId;
    try {
      storage.setItem(PENDING_REMINDER_OPTIN_KEY, JSON.stringify(parsed));
    } catch {}
  }

  // 3. If preferences are already confirmed enabled on server, clean up and exit
  if (prefState.preference?.enabled === true) {
    clearPendingReminderOptIn(storage);
    return 'cleared';
  }

  // 4. Must wait for confirmed 'ready' status (meaning client.read finished successfully)
  // If still loading or in error, do NOT attempt save yet!
  if (prefState.status !== 'ready') {
    return 'skipped';
  }

  // 5. Perform save
  try {
    await save(true, activeLocale, parsed.locale ?? activeLocale);
    const confirmed = getState();
    if (confirmed.status === 'ready' && confirmed.preference?.enabled === true) {
      clearPendingReminderOptIn(storage);
      return 'saved';
    }
    return 'failed';
  } catch {
    return 'failed';
  }
}
