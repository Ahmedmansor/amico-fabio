/** Committed server activity summary; no IDs, provider fields or client clocks. */
export interface ReminderActivity {favoriteCount: number; lastAdditionAt: number | null; revision: number}
export function parseReminderActivity(value: unknown): ReminderActivity | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['favoriteCount', 'lastAdditionAt', 'revision'].includes(key))
    || !Number.isSafeInteger(row.favoriteCount) || (row.favoriteCount as number) < 0
    || !Number.isSafeInteger(row.revision) || (row.revision as number) < 0) return null;
  if (row.favoriteCount === 0 ? row.lastAdditionAt !== null
    : !Number.isSafeInteger(row.lastAdditionAt) || (row.lastAdditionAt as number) < 0) return null;
  return {favoriteCount: row.favoriteCount as number, lastAdditionAt: row.lastAdditionAt as number | null, revision: row.revision as number};
}
export type ActivityResult = {ok: true; value: ReminderActivity | null}
  | {ok: false; reason: 'invalid-input' | 'unavailable' | 'failed'};
export interface ReminderActivityRepository {read(userId: string): Promise<ActivityResult>}
