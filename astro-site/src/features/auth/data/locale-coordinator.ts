import {isLocaleRequestId, parseLocaleCommand, type AccountLocaleState, type LocaleCommand,
  type LocaleRepository} from '../domain/locale-preference.ts';
import type {Locale} from '../../../shared/config/languages.ts';

export type LocaleIntent = {kind: 'site' | 'email_explicit'; locale: Locale} | {kind: 'email_follow_site'};
export interface PendingLocaleIntent {intent: LocaleIntent; command: LocaleCommand | null}
export interface LocalePendingStore {
  read(userId: string): PendingLocaleIntent | null;
  write(userId: string, value: PendingLocaleIntent): boolean;
  remove(userId: string): void;
}
export interface LocaleCoordinatorState {
  status: 'signed-out' | 'loading' | 'ready' | 'saving' | 'uncertain' | 'conflict' | 'failed';
  confirmed: AccountLocaleState | null;
  pending: boolean;
  durable: boolean;
}
const intentOf = (command: LocaleCommand): LocaleIntent => command.kind === 'email_follow_site'
  ? {kind: command.kind} : {kind: command.kind, locale: command.locale};
const equal = (a: LocaleIntent, b: LocaleIntent) => a.kind === b.kind
  && (a.kind === 'email_follow_site' || (b.kind !== 'email_follow_site' && a.locale === b.locale));
const satisfied = (state: AccountLocaleState, intent: LocaleIntent) => intent.kind === 'site'
  ? state.siteLocale === intent.locale : intent.kind === 'email_follow_site'
    ? state.email?.source === 'follow_site'
    : state.email?.source === 'explicit' && state.email.locale === intent.locale;

/** Local-only coordinator. Navigation never waits for this promise. No DOM or tokens.
 * The eventual HTTP adapter must derive ownership remotely, not send userId in JSON. */
export function createLocaleCoordinator(options: {
  repository: LocaleRepository;
  store: LocalePendingStore;
  requestId: () => string;
  onChange?: (state: LocaleCoordinatorState) => void;
}) {
  let userId: string | null = null, epoch = 0;
  let state: LocaleCoordinatorState = {status: 'signed-out', confirmed: null, pending: false, durable: true};
  let pending: PendingLocaleIntent | null = null;
  let running: Promise<void> | null = null;
  let freshChoice = false;
  const snapshot = () => structuredClone(state);
  function emit() {state.pending = pending !== null; options.onChange?.(snapshot());}
  function persist() {
    if (!userId) return;
    try {
      if (pending) state.durable = options.store.write(userId, structuredClone(pending));
      else {options.store.remove(userId); state.durable = true;}
    } catch {state.durable = false;}
  }
  function clear() {pending = null; persist();}
  function flush(): Promise<void> {
    if (running) return running;
    const capturedEpoch = epoch, capturedUser = userId;
    const current = () => capturedEpoch === epoch && capturedUser === userId;
    if (!capturedUser || !state.confirmed || !pending) return Promise.resolve();
    const work = async () => {
      while (current() && pending && state.confirmed) {
        if (!pending.command) {
          if (satisfied(state.confirmed, pending.intent)) {clear(); state.status = 'ready'; emit(); return;}
          const command = parseLocaleCommand({...pending.intent, expectedRevision: state.confirmed.revision,
            requestId: options.requestId()});
          if (!command) {state.status = 'failed'; emit(); return;}
          pending.command = command;
        }
        const command = structuredClone(pending.command);
        persist(); state.status = 'saving'; emit();
        let result;
        try {result = await options.repository.change(capturedUser, command);}
        catch {if (current()) {state.status = 'uncertain'; emit();} return;}
        if (!current()) return;
        if (!result.ok) {
          if (result.reason === 'conflict') {
            state.confirmed = result.state; pending.command = null;
            state.status = 'conflict'; persist();
          } else state.status = 'uncertain';
          emit(); return;
        }
        state.confirmed = result.value.state;
        const latest = pending.intent;
        pending.command = null;
        // A retry may discover newer changes from another tab/device. Never rebase
        // queued old intent automatically over that newer remote state.
        if (result.value.state.revision > command.expectedRevision + 1) {
          state.status = 'conflict'; persist(); emit(); return;
        }
        if (equal(latest, intentOf(command))) {clear(); state.status = 'ready'; emit(); return;}
        persist();
      }
    };
    const task = work().finally(() => {if (current()) running = null;});
    running = task;
    return task;
  }
  return {
    snapshot,
    async setAccount(nextUserId: string | null) {
      const next = isLocaleRequestId(nextUserId) ? nextUserId : null;
      if (next === userId) return;
      userId = next; epoch++; running = null; freshChoice = false;
      pending = null;
      state = {status: next ? 'loading' : 'signed-out', confirmed: null, pending: false, durable: true};
      if (!next) {emit(); return;}
      try {pending = options.store.read(next);} catch {state.durable = false;}
      const capturedEpoch = epoch;
      emit();
      let result;
      try {result = await options.repository.read(next);} catch {result = {ok: false} as const;}
      if (capturedEpoch !== epoch) return;
      if (!result.ok) {state.status = 'failed'; emit(); return;}
      state.confirmed = result.value;
      // Restoring storage never writes on page load. Explicit retry is required.
      state.status = pending ? 'uncertain' : 'ready'; emit();
      if (freshChoice) {freshChoice = false; await flush();}
    },
    async choose(intent: LocaleIntent) {
      if (!userId) return;
      const valid = parseLocaleCommand({...intent, requestId: '00000000-0000-4000-8000-000000000000', expectedRevision: 0});
      if (!valid) return;
      pending = {intent: intentOf(valid), command: pending?.command ?? null};
      persist(); emit();
      if (!state.confirmed) {freshChoice = true; return;}
      // Preserve an uncertain operation until its identity has been resolved.
      if (state.status === 'uncertain' && pending.command) return;
      await flush();
    },
    async retry() {
      if (!userId || !pending || state.status === 'loading') return;
      if (!state.confirmed) {
        const capturedEpoch = epoch, capturedUser = userId;
        state.status = 'loading'; emit();
        let result;
        try {result = await options.repository.read(capturedUser);} catch {result = {ok: false} as const;}
        if (capturedEpoch !== epoch) return;
        if (!result.ok) {state.status = 'failed'; emit(); return;}
        state.confirmed = result.value;
      }
      await flush();
    },
  };
}
