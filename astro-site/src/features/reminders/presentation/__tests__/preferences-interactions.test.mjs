import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindPreferenceView} from '../preferences-view.ts';
import {reconcilePendingOptIn} from '../preferences-optin.ts';
import {
  recordPendingReminderOptIn,
  clearPendingReminderOptIn,
  PENDING_REMINDER_OPTIN_KEY,
} from '../../../auth/presentation/pending-optin.ts';
import {createPreferenceController} from '../../data/preferences-controller.ts';

const messages = {
  title: 'Promemoria',
  label: 'Attiva promemoria',
  description: 'Ricevi promemoria via email',
  languageLabel: 'Lingua',
  languageNote: 'Lingua email',
  save: 'Salva',
  retry: 'Riprova',
  reload: 'Ricarica',
  loading: 'Caricamento...',
  saving: 'Salvataggio...',
  enabled: 'Attivo',
  disabled: 'Disattivato',
  error: 'Errore',
  outdated: 'Consenso non aggiornato',
  privacy: 'Privacy',
};

function createMockElement(tag, attrs = {}) {
  const listeners = new Map();
  const element = {
    tagName: tag.toUpperCase(),
    attributes: {...attrs},
    disabled: false,
    checked: false,
    value: '',
    hidden: false,
    textContent: '',
    dataset: {},
    getAttribute: name => element.attributes[name] ?? null,
    setAttribute: (name, val) => { element.attributes[name] = String(val); },
    removeAttribute: name => { delete element.attributes[name]; },
    toggleAttribute: (name, force) => {
      if (force === undefined) {
        if (element.attributes[name]) delete element.attributes[name];
        else element.attributes[name] = '';
      } else if (force) element.attributes[name] = '';
      else delete element.attributes[name];
    },
    addEventListener: (event, fn) => {
      const list = listeners.get(event) ?? [];
      list.push(fn);
      listeners.set(event, list);
    },
    removeEventListener: (event, fn) => {
      const list = listeners.get(event) ?? [];
      listeners.set(event, list.filter(cb => cb !== fn));
    },
    dispatchEvent: event => {
      const list = listeners.get(event.type) ?? [];
      for (const cb of list) cb(event);
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  return element;
}

function createViewDom() {
  const root = createMockElement('section');
  const form = createMockElement('form');
  const fieldset = createMockElement('fieldset');
  const choice = createMockElement('input', {'type': 'checkbox'});
  const language = createMockElement('select');
  const save = createMockElement('button', {'type': 'submit'});
  const retry = createMockElement('button', {'type': 'button'});
  const status = createMockElement('p');

  form.querySelector = selector => {
    if (selector === 'fieldset') return fieldset;
    return null;
  };

  root.querySelector = selector => {
    if (selector === '[data-reminder-form]') return form;
    if (selector === '[data-reminder-choice]') return choice;
    if (selector === '[data-reminder-language]') return language;
    if (selector === '[data-reminder-save]') return save;
    if (selector === '[data-reminder-retry]') return retry;
    if (selector === '[data-reminder-status]') return status;
    return null;
  };

  return {root, form, fieldset, choice, language, save, retry, status};
}

test('preferences-view does not redirect when save fails, preserving error and retry', async () => {
  const dom = createViewDom();
  let state = {
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'ready',
    preference: {enabled: true, locale: 'it', wordingVersion: 'wishlist-reminders-v1'},
    error: null,
    retryable: false,
  };
  const listeners = new Set();
  let redirected = null;

  const controller = {
    getState: () => state,
    subscribe: fn => {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    save: async (_enabled, _chosenLocale) => {
      // Simulate save failure
      state = {
        ...state,
        status: 'error',
        error: 'unavailable',
        retryable: true,
      };
      for (const fn of listeners) fn(state);
    },
    retry: async () => {},
    refresh: async () => {},
  };

  // Mock window.location
  const originalWindow = globalThis.window;
  globalThis.window = {
    location: {
      pathname: '/it/wishlist/',
      search: '',
      hash: '',
      set href(val) { redirected = val; },
    },
  };

  try {
    bindPreferenceView(dom.root, controller, 'it', messages);
    dom.language.value = 'en';

    // Submit form with new language
    const submitEvent = {preventDefault: () => {}};
    dom.form.dispatchEvent({type: 'submit', ...submitEvent});
    await new Promise(resolve => setTimeout(resolve, 10));

    // Must NOT have navigated because status was 'error'
    assert.equal(redirected, null);
    assert.equal(dom.status.textContent, messages.error);
    assert.equal(dom.retry.hidden, false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('preferences-view redirects to matching language route only upon confirmed save', async () => {
  const dom = createViewDom();
  let state = {
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'ready',
    preference: {enabled: true, locale: 'it', wordingVersion: 'wishlist-reminders-v1'},
    error: null,
    retryable: false,
  };
  const listeners = new Set();
  let redirected = null;

  const controller = {
    getState: () => state,
    subscribe: fn => {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    save: async (enabled, chosenLocale) => {
      // Simulate successful save
      state = {
        ...state,
        status: 'ready',
        preference: {enabled, locale: chosenLocale, wordingVersion: 'wishlist-reminders-v1'},
        error: null,
        retryable: false,
      };
      for (const fn of listeners) fn(state);
    },
    retry: async () => {},
    refresh: async () => {},
  };

  const originalWindow = globalThis.window;
  globalThis.window = {
    location: {
      pathname: '/it/wishlist/',
      search: '',
      hash: '',
      set href(val) { redirected = val; },
    },
  };

  try {
    bindPreferenceView(dom.root, controller, 'it', messages);
    dom.language.value = 'en';

    const submitEvent = {preventDefault: () => {}};
    dom.form.dispatchEvent({type: 'submit', ...submitEvent});
    await new Promise(resolve => setTimeout(resolve, 10));

    // Successfully navigated to /en/wishlist/
    assert.equal(redirected, '/en/wishlist/');
  } finally {
    globalThis.window = originalWindow;
  }
});

test('reconcilePendingOptIn waits for confirmed ready state and never saves on loading or error', async () => {
  const storage = new Map();
  const mockStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };

  const userId = '00000000-0000-4000-8000-000000000001';
  recordPendingReminderOptIn(mockStorage, 'it');
  assert.notEqual(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null);

  let saves = 0;
  const save = async () => { saves++; };

  // 1. Controller is in 'loading' status (connect() reading initial state from server)
  const loadingState = {status: 'loading', preference: null, userId, error: null, retryable: false};
  const resLoading = await reconcilePendingOptIn({
    storage: mockStorage,
    userId,
    prefState: loadingState,
    activeLocale: 'it',
    save,
    getState: () => loadingState,
  });
  assert.equal(resLoading, 'skipped');
  assert.equal(saves, 0);
  assert.notEqual(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null);

  // 2. Controller is in 'error' status (read failure)
  const errorState = {status: 'error', preference: null, userId, error: 'unavailable', retryable: true};
  const resError = await reconcilePendingOptIn({
    storage: mockStorage,
    userId,
    prefState: errorState,
    activeLocale: 'it',
    save,
    getState: () => errorState,
  });
  assert.equal(resError, 'skipped');
  assert.equal(saves, 0);
  assert.notEqual(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null);
});

test('reconcilePendingOptIn clears intent without writes if server preference is already enabled', async () => {
  const storage = new Map();
  const mockStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };

  const userId = '00000000-0000-4000-8000-000000000001';
  recordPendingReminderOptIn(mockStorage, 'it');

  let saves = 0;
  const save = async () => { saves++; };

  const readyAlreadyEnabled = {
    status: 'ready',
    preference: {enabled: true, locale: 'it', wordingVersion: 'wishlist-reminders-v1'},
    userId,
    error: null,
    retryable: false,
  };

  const res = await reconcilePendingOptIn({
    storage: mockStorage,
    userId,
    prefState: readyAlreadyEnabled,
    activeLocale: 'it',
    save,
    getState: () => readyAlreadyEnabled,
  });

  assert.equal(res, 'cleared');
  assert.equal(saves, 0, 'Must NOT perform a redundant save when server confirms user is already enabled');
  assert.equal(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null, 'Must clear pending storage');
});

test('reconcilePendingOptIn binds to account and blocks cross-account intent transfer (A -> B)', async () => {
  const storage = new Map();
  const mockStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };

  const userA = '00000000-0000-4000-8000-000000000001';
  const userB = '00000000-0000-4000-8000-000000000002';

  // User A signs in with opt-in intent
  recordPendingReminderOptIn(mockStorage, 'it');

  let userASaves = 0;
  let userAState = {
    status: 'ready',
    preference: null,
    userId: userA,
    error: null,
    retryable: false,
  };

  // Simulate save failure for User A (e.g. server 500)
  const saveUserA = async () => {
    userASaves++;
    userAState = {...userAState, status: 'error', error: 'unavailable', retryable: true};
  };

  const resUserA = await reconcilePendingOptIn({
    storage: mockStorage,
    userId: userA,
    prefState: userAState,
    activeLocale: 'it',
    save: saveUserA,
    getState: () => userAState,
  });

  assert.equal(resUserA, 'failed');
  assert.equal(userASaves, 1);
  // Intent is still in storage, bound to User A!
  const rawA = mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY);
  assert.notEqual(rawA, null);
  assert.equal(JSON.parse(rawA).targetUserId, userA);

  // Now User switches to User B (without signout clearing storage)
  let userBSaves = 0;
  const userBState = {
    status: 'ready',
    preference: null,
    userId: userB,
    error: null,
    retryable: false,
  };
  const saveUserB = async () => { userBSaves++; };

  const resUserB = await reconcilePendingOptIn({
    storage: mockStorage,
    userId: userB,
    prefState: userBState,
    activeLocale: 'it',
    save: saveUserB,
    getState: () => userBState,
  });

  // MUST be rejected as mismatched, and User B must NEVER be saved!
  assert.equal(resUserB, 'mismatched');
  assert.equal(userBSaves, 0, 'User B must NOT inherit User A pending opt-in');
  assert.equal(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null, 'Mismatched storage must be purged');
});

test('reconcilePendingOptIn retains intent on save failure and deletes on confirmed success', async () => {
  const storage = new Map();
  const mockStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };

  const userId = '00000000-0000-4000-8000-000000000001';
  recordPendingReminderOptIn(mockStorage, 'en');

  let state = {
    status: 'ready',
    preference: null,
    userId,
    error: null,
    retryable: false,
  };

  // 1. Save fails
  const resFail = await reconcilePendingOptIn({
    storage: mockStorage,
    userId,
    prefState: state,
    activeLocale: 'en',
    save: async () => {
      state = {...state, status: 'error', error: 'unavailable', retryable: true};
    },
    getState: () => state,
  });
  assert.equal(resFail, 'failed');
  assert.notEqual(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null, 'Intent retained on save failure');

  // 2. Retry succeeds
  state = {...state, status: 'ready'};
  const resSuccess = await reconcilePendingOptIn({
    storage: mockStorage,
    userId,
    prefState: state,
    activeLocale: 'en',
    save: async () => {
      state = {
        ...state,
        status: 'ready',
        preference: {enabled: true, locale: 'en', wordingVersion: 'wishlist-reminders-v1'},
      };
    },
    getState: () => state,
  });
  assert.equal(resSuccess, 'saved');
  assert.equal(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null, 'Intent deleted on confirmed save');
});

test('reconcilePendingOptIn respects confirmed withdrawal (enabled=false) and does not re-subscribe', async () => {
  const storage = new Map();
  const mockStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };

  const userId = '00000000-0000-4000-8000-000000000001';
  recordPendingReminderOptIn(mockStorage, 'it');

  let saves = 0;
  const save = async () => { saves++; };

  // Server confirmed the user withdrew consent from another tab: preference.enabled === false
  const withdrawnState = {
    status: 'ready',
    preference: {
      enabled: false,
      locale: 'it',
      wordingVersion: 'wishlist-reminders-v1',
      updatedAt: new Date().toISOString(),
      enabledSince: null,
    },
    userId,
    error: null,
    retryable: false,
  };

  const res = await reconcilePendingOptIn({
    storage: mockStorage,
    userId,
    prefState: withdrawnState,
    activeLocale: 'it',
    save,
    getState: () => withdrawnState,
  });

  // Must NOT trigger a new save!
  assert.equal(res, 'cleared');
  assert.equal(saves, 0, 'Must NOT re-subscribe when server confirmed user is disabled/withdrawn');
  assert.equal(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null, 'Must clear pending storage');
});

test('reconcilePendingOptIn halts and clears storage if account binding fails to persist', async () => {
  const storage = new Map();
  const failingStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (_k, _v) => {
      throw new Error('QuotaExceededError: storage is full');
    },
    removeItem: k => storage.delete(k),
  };

  const userId = '00000000-0000-4000-8000-000000000001';
  storage.set(PENDING_REMINDER_OPTIN_KEY, JSON.stringify({
    enabled: true,
    locale: 'it',
    createdAt: Date.now(),
    attemptId: 'test-attempt-1',
    targetUserId: null,
  }));

  let saves = 0;
  const save = async () => { saves++; };

  const readyState = {
    status: 'ready',
    preference: null,
    userId,
    error: null,
    retryable: false,
  };

  const res = await reconcilePendingOptIn({
    storage: failingStorage,
    userId,
    prefState: readyState,
    activeLocale: 'it',
    save,
    getState: () => readyState,
  });

  assert.equal(res, 'failed');
  assert.equal(saves, 0, 'Must not send opt-in write when account binding cannot be persisted');
  assert.equal(storage.get(PENDING_REMINDER_OPTIN_KEY), undefined, 'Must purge unbound storage on failure');
});

test('createPreferenceController.connect performs server read first and never emits ready prematurely', async () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const observedStatuses = [];
  let readCalled = false;

  const mockClient = {
    read: async _id => {
      readCalled = true;
      return {
        ok: true,
        value: {enabled: true, locale: 'it', wordingVersion: 'wishlist-reminders-v1'},
      };
    },
    change: async () => assert.fail('change should not be called during connect'),
  };

  const controller = createPreferenceController(mockClient, () => '00000000-0000-4000-8000-000000000099');
  controller.subscribe(s => {
    if (s.userId) observedStatuses.push({status: s.status, pref: s.preference});
  });

  await controller.connect(userId);

  assert.equal(readCalled, true);
  // Initial state published upon connect(userId) must be 'loading', NOT premature 'ready'
  assert.equal(observedStatuses[0].status, 'loading');
  assert.equal(observedStatuses[0].pref, null);

  // Subsequent state published must be 'ready' with confirmed server preference
  const lastState = observedStatuses.at(-1);
  assert.equal(lastState.status, 'ready');
  assert.equal(lastState.pref.enabled, true);
});

test('clearPendingReminderOptIn clears pending storage immediately', () => {
  const storage = new Map();
  const mockStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };
  recordPendingReminderOptIn(mockStorage, 'it');
  assert.notEqual(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null);
  clearPendingReminderOptIn(mockStorage);
  assert.equal(mockStorage.getItem(PENDING_REMINDER_OPTIN_KEY), null);
});
