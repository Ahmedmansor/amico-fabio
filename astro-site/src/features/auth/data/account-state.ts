import type {AuthService} from './service.ts';
import type {AccountSession} from '../domain/auth.ts';

export interface AccountState {
  status: 'loading' | 'ready' | 'failed';
  session: AccountSession | null;
}
type Source = Pick<AuthService, 'subscribe' | 'currentSession'>;
function copy(session: AccountSession | null): AccountSession | null {
  return session ? {userId: session.userId, profile: {displayName: session.profile.displayName,
    email: session.profile.email, avatarUrl: session.profile.avatarUrl}} : null;
}

/** Page-lifetime Auth identity only: one verified restoration shared by feature
 * consumers. No tokens, tables, reminders, UI or authorization decisions here. */
function createAccountState(service: Source) {
  let state: AccountState = {status: 'loading', session: null};
  let revision = 0, restoring: Promise<void> | null = null;
  const listeners = new Set<(state: AccountState) => void>();
  const snapshot = (): AccountState => ({status: state.status, session: copy(state.session)});
  function emit() {
    for (const listener of listeners) {
      try {listener(snapshot());} catch { /* One view cannot corrupt other Auth consumers. */ }
    }
  }
  service.subscribe(session => {
    revision++;
    state = {status: 'ready', session: copy(session)}; emit();
  });
  function refresh(): Promise<void> {
    if (restoring) return restoring;
    const captured = revision;
    state = {status: 'loading', session: null}; emit();
    const run = async () => {
      try {
        const result = await service.currentSession();
        if (captured !== revision) return;
        state = result.ok ? {status: 'ready', session: copy(result.value)} : {status: 'failed', session: null};
      } catch {
        if (captured !== revision) return;
        state = {status: 'failed', session: null};
      }
      emit();
    };
    const task = run().finally(() => {if (restoring === task) restoring = null;});
    restoring = task; return task;
  }
  void refresh();
  return {snapshot, refresh,
    subscribe(listener: (state: AccountState) => void) {
      listeners.add(listener); listener(snapshot());
      return () => {listeners.delete(listener);};
    }};
}
const sources = new WeakMap<Source, ReturnType<typeof createAccountState>>();
export function getAccountState(service: Source) {
  let source = sources.get(service);
  if (!source) {source = createAccountState(service); sources.set(service, source);}
  return source;
}
