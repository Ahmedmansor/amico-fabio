import type {Locale} from '../../../shared/config/languages.ts';

export const PENDING_REMINDER_OPTIN_KEY = 'fabio:auth:pending-reminder-optin:v1';

export interface PendingReminderOptIn {
  enabled: boolean;
  locale: Locale;
  createdAt: number;
  attemptId: string;
  targetUserId?: string | null;
}

export function recordPendingReminderOptIn(
  storage: Pick<Storage, 'setItem'>,
  locale: Locale,
  attemptId: string = crypto.randomUUID()
): void {
  try {
    const payload: PendingReminderOptIn = {
      enabled: true,
      locale,
      createdAt: Date.now(),
      attemptId,
      targetUserId: null,
    };
    storage.setItem(PENDING_REMINDER_OPTIN_KEY, JSON.stringify(payload));
  } catch {}
}

export function clearPendingReminderOptIn(storage: Pick<Storage, 'removeItem'>): void {
  try {
    storage.removeItem(PENDING_REMINDER_OPTIN_KEY);
  } catch {}
}

export function clearMatchingPendingReminderOptIn(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  expectedAttemptId: string,
  expectedUserId?: string | null
): boolean {
  try {
    const raw = storage.getItem(PENDING_REMINDER_OPTIN_KEY);
    if (!raw) return false;
    const current = JSON.parse(raw) as PendingReminderOptIn;
    const matchesAttempt = current.attemptId === expectedAttemptId;
    const matchesUser = expectedUserId === undefined || current.targetUserId === expectedUserId;
    if (matchesAttempt && matchesUser) {
      storage.removeItem(PENDING_REMINDER_OPTIN_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function readPendingReminderOptIn(storage: Pick<Storage, 'getItem'>): PendingReminderOptIn | null {
  try {
    const raw = storage.getItem(PENDING_REMINDER_OPTIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingReminderOptIn;
  } catch {
    return null;
  }
}
