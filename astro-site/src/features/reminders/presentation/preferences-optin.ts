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

  // Bind targetUserId to this userId if not yet bound.
  // If binding cannot be persisted securely in storage, abort automatic opt-in to prevent cross-account leakage.
  if (!parsed.targetUserId) {
    parsed.targetUserId = userId;
    try {
      storage.setItem(PENDING_REMINDER_OPTIN_KEY, JSON.stringify(parsed));
      const verifyRaw = storage.getItem(PENDING_REMINDER_OPTIN_KEY);
      if (!verifyRaw) {
        clearPendingReminderOptIn(storage);
        return 'failed';
      }
      const verified = JSON.parse(verifyRaw) as PendingReminderOptIn;
      if (verified.targetUserId !== userId) {
        clearPendingReminderOptIn(storage);
        return 'failed';
      }
    } catch {
      clearPendingReminderOptIn(storage);
      return 'failed';
    }
  }

  // 3. Must wait for confirmed 'ready' status (meaning client.read finished successfully).
  // If still loading or in error, do NOT attempt save yet!
  if (prefState.status !== 'ready') {
    return 'skipped';
  }

  // 4. Respect confirmed server preference:
  // If preferences already exist on server (whether enabled=true or explicitly disabled=false after withdrawal),
  // we must respect the server's confirmed state and clear the pending intent without sending a new opt-in command.
  if (prefState.preference !== null) {
    clearPendingReminderOptIn(storage);
    return 'cleared';
  }

  // 5. Perform initial save (only when server record does not exist yet)
  try {
    await save(true, activeLocale, parsed.locale ?? activeLocale);
    const confirmed = getState();
    if (confirmed.status === 'ready') {
      clearPendingReminderOptIn(storage);
      return confirmed.preference?.enabled === true ? 'saved' : 'cleared';
    }
    return 'failed';
  } catch {
    return 'failed';
  }
}
