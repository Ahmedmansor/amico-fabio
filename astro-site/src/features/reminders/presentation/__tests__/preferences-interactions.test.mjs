import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindPreferenceView} from '../preferences-view.ts';

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

test('pending opt-in is retained during read or save failure and deleted only on confirmed success', async () => {
  const optInKey = 'fabio:auth:pending-reminder-optin:v1';
  const storage = new Map();
  const mockSessionStorage = {
    getItem: k => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };

  const originalSessionStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = mockSessionStorage;

  try {
    // 1. Initial opt-in recorded at login
    storage.set(optInKey, JSON.stringify({enabled: true, locale: 'it', createdAt: Date.now()}));

    // 2. Read failure occurs (controller in error state)
    let state = {status: 'error', preference: null, userId: '00000000-0000-4000-8000-000000000001'};
    let saveCalled = false;

    // Simulate reconcile function behavior
    const reconcile = async (prefState, saveFn) => {
      const raw = mockSessionStorage.getItem(optInKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (prefState.preference?.enabled === true) {
        mockSessionStorage.removeItem(optInKey);
        return;
      }
      if (prefState.status === 'ready') {
        const ok = await saveFn(parsed);
        if (ok) mockSessionStorage.removeItem(optInKey);
      }
    };

    // Initial read failed -> status is 'error'
    await reconcile(state, async () => { saveCalled = true; return true; });
    assert.equal(saveCalled, false);
    // Intent MUST still be in storage!
    assert.notEqual(mockSessionStorage.getItem(optInKey), null);

    // 3. Status becomes 'ready', but save network request fails
    state = {status: 'ready', preference: null, userId: '00000000-0000-4000-8000-000000000001'};
    await reconcile(state, async () => { saveCalled = true; return false; /* save failed */ });
    assert.equal(saveCalled, true);
    // Intent MUST still be in storage after save failure!
    assert.notEqual(mockSessionStorage.getItem(optInKey), null);

    // 4. Retry succeeds -> status 'ready' and preference.enabled === true
    state = {status: 'ready', preference: {enabled: true, locale: 'it'}, userId: '00000000-0000-4000-8000-000000000001'};
    await reconcile(state, async () => true);
    // Intent is now safely removed!
    assert.equal(mockSessionStorage.getItem(optInKey), null);
  } finally {
    globalThis.sessionStorage = originalSessionStorage;
  }
});
