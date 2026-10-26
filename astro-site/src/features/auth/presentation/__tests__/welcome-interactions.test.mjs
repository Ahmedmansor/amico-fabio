import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindWelcomeDialog, createWelcomeActions} from '../welcome-interactions.ts';

const messages = {
  welcomeTitle: 'Benvenuto in Fabio Egypt',
  welcomeGreetingNamed: 'Ciao, {name}!',
  welcomeGreetingNeutral: 'Benvenuto!',
  welcomeIntro: 'Il tuo account è pronto.',
  welcomeFavoritesSynced: 'I tuoi preferiti sono stati salvati nel tuo account.',
  welcomeFavoritesSyncing: 'Salvataggio dei tuoi preferiti in corso…',
  welcomeFavoritesFailed: 'I tuoi preferiti restano al sicuro su questo dispositivo.',
  reminderOptIn: 'Inviami un promemoria con i miei preferiti (opzionale)',
  continue: 'Continua',
  notNow: 'Non ora',
  close: 'Chiudi',
  failed: 'Impossibile completare la richiesta. Riprova.',
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
    open: false,
    dataset: {},
    getAttribute: name => element.attributes[name] ?? null,
    setAttribute: (name, val) => {
      element.attributes[name] = String(val);
    },
    removeAttribute: name => {
      delete element.attributes[name];
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
      for (const fn of list) fn(event);
      return !event.defaultPrevented;
    },
    showModal: () => {
      element.open = true;
    },
    close: () => {
      element.open = false;
    },
    focus: () => {},
    getClientRects: () => [{width: 100, height: 40}],
    querySelectorAll: selector => {
      const results = [];
      if (selector.includes('button') || selector.includes('input')) {
        if (element.continueBtn) results.push(element.continueBtn);
        if (element.skipBtn) results.push(element.skipBtn);
        if (element.reminderCheckbox) results.push(element.reminderCheckbox);
      }
      return results;
    },
  };
  return element;
}

function createDialogFixture() {
  const dialog = createMockElement('dialog');
  const titleEl = createMockElement('h2');
  const introEl = createMockElement('p');
  const syncStatusEl = createMockElement('p');
  const errorEl = createMockElement('p');
  const reminderCheckbox = createMockElement('input', {type: 'checkbox'});
  const continueBtn = createMockElement('button');
  const skipBtn = createMockElement('button');

  dialog.continueBtn = continueBtn;
  dialog.skipBtn = skipBtn;
  dialog.reminderCheckbox = reminderCheckbox;

  const elements = {
    dialog,
    titleEl,
    introEl,
    syncStatusEl,
    errorEl,
    reminderCheckbox,
    continueBtn,
    skipBtn,
  };

  const actionLog = [];
  let continueFails = false;

  const actions = {
    onContinue: async optIn => {
      actionLog.push({action: 'continue', optIn});
      if (continueFails) throw new Error('Network error');
    },
    onSkip: async () => {
      actionLog.push({action: 'skip'});
    },
    onDismiss: () => {
      actionLog.push({action: 'dismiss'});
    },
  };

  const binding = bindWelcomeDialog(elements, messages, actions);

  return {
    elements,
    binding,
    actionLog,
    setContinueFails: v => (continueFails = v),
  };
}

test('renders prompt with neutral greeting and hides favorites status when no favorites exist', () => {
  const f = createDialogFixture();
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'none'},
    displayName: null,
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  assert.equal(f.elements.dialog.open, true);
  assert.equal(f.elements.titleEl.textContent, 'Benvenuto!');
  assert.equal(f.elements.syncStatusEl.hidden, true);
  assert.equal(f.elements.reminderCheckbox.checked, false);
});

test('renders prompt with named greeting and honest synced message when favorites were merged', () => {
  const f = createDialogFixture();
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'synced', count: 2},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  assert.equal(f.elements.dialog.open, true);
  assert.equal(f.elements.titleEl.textContent, 'Ciao, Mario!');
  assert.equal(f.elements.syncStatusEl.hidden, false);
  assert.equal(f.elements.syncStatusEl.textContent, 'I tuoi preferiti sono stati salvati nel tuo account.');
  assert.equal(f.elements.reminderCheckbox.checked, false);
});

test('unchecked choice on Continue makes zero consent grants and closes dialog', async () => {
  const f = createDialogFixture();
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'none'},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  assert.equal(f.elements.reminderCheckbox.checked, false);

  // Click continue without checking checkbox
  f.elements.continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.deepEqual(f.actionLog, [{action: 'continue', optIn: false}]);
  assert.equal(f.elements.dialog.open, false);
});

test('checked choice on Continue submits optIn=true and closes dialog on success', async () => {
  const f = createDialogFixture();
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'none'},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  // Check the checkbox
  f.elements.reminderCheckbox.checked = true;

  f.elements.continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.deepEqual(f.actionLog, [{action: 'continue', optIn: true}]);
  assert.equal(f.elements.dialog.open, false);
});

test('failed consent write displays error and keeps dialog open for retry or skip', async () => {
  const f = createDialogFixture();
  f.setContinueFails(true);

  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'none'},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  f.elements.reminderCheckbox.checked = true;

  f.elements.continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));

  // Dialog must REMAIN open so user can retry or skip!
  assert.equal(f.elements.dialog.open, true);
  assert.equal(f.elements.errorEl.hidden, false);
  assert.equal(f.elements.errorEl.textContent, 'Impossibile completare la richiesta. Riprova.');

  // User decides to Skip instead:
  f.elements.skipBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(f.elements.dialog.open, false);
  assert.equal(f.actionLog[1].action, 'skip');
});

test('clicking Not Now calls onSkip and closes dialog without consent grant', async () => {
  const f = createDialogFixture();
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'none'},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  f.elements.skipBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.deepEqual(f.actionLog, [{action: 'skip'}]);
  assert.equal(f.elements.dialog.open, false);
});

test('pressing Escape calls onDismiss and closes dialog', async () => {
  const f = createDialogFixture();
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'none'},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  let defaultPrevented = false;
  f.elements.dialog.dispatchEvent({
    type: 'keydown',
    key: 'Escape',
    preventDefault: () => (defaultPrevented = true),
  });

  assert.equal(defaultPrevented, true);
  assert.deepEqual(f.actionLog, [{action: 'dismiss'}]);
  assert.equal(f.elements.dialog.open, false);
});

test('render preserves reminderCheckbox.checked when dialog is already open (e.g. on sync update)', () => {
  const f = createDialogFixture();
  // Initial render: opens dialog, unchecked by default
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'syncing'},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  assert.equal(f.elements.dialog.open, true);
  assert.equal(f.elements.reminderCheckbox.checked, false);

  // User checks the box while sync is still running
  f.elements.reminderCheckbox.checked = true;

  // Sync finishes and updates state while dialog is open
  f.binding.render({
    userId: '00000000-0000-4000-8000-000000000001',
    status: 'prompt',
    syncReport: {status: 'synced', count: 2},
    displayName: 'Mario',
    onboardingRecord: null,
    decisionReason: 'new-eligible',
  });

  // User's checkbox choice MUST be preserved, not wiped!
  assert.equal(f.elements.dialog.open, true);
  assert.equal(f.elements.reminderCheckbox.checked, true);
  assert.equal(f.elements.syncStatusEl.textContent, 'I tuoi preferiti sono stati salvati nel tuo account.');
});

test('createWelcomeActions: optIn=true connects bridge, saves consent, and completes for captured user', async () => {
  const calls = [];
  const fakeBridge = {
    connectedUser: null,
    saved: false,
    controller: {
      getState: () => ({
        status: fakeBridge.connectedUser ? 'ready' : 'signed-out',
        preference: fakeBridge.saved ? {enabled: true} : null,
      }),
      save: async (enabled, locale, consentLocale) => {
        calls.push({action: 'save', enabled, locale, consentLocale});
        fakeBridge.saved = true;
      },
      retry: async () => calls.push({action: 'retry'}),
    },
    connect: async userId => {
      calls.push({action: 'connect', userId});
      fakeBridge.connectedUser = userId;
    },
  };

  const coordinator = {
    state: {userId: '00000000-0000-4000-8000-000000000001'},
    getState: () => coordinator.state,
    complete: async user => {
      calls.push({action: 'complete', user});
      return {ok: true};
    },
    skip: async user => {
      calls.push({action: 'skip', user});
      return {ok: true};
    },
    dismiss: () => calls.push({action: 'dismiss'}),
  };

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => fakeBridge,
  });

  await actions.onContinue(true);

  assert.deepEqual(calls, [
    {action: 'connect', userId: '00000000-0000-4000-8000-000000000001'},
    {action: 'save', enabled: true, locale: 'it', consentLocale: 'it'},
    {action: 'complete', user: '00000000-0000-4000-8000-000000000001'},
  ]);
});

test('createWelcomeActions: retryable error preserves bridge and calls retry() on second attempt', async () => {
  const calls = [];
  let saveAttempted = false;
  let retryAttempted = false;

  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => {
        if (!fakeBridge.connectedUser) return {status: 'signed-out'};
        if (retryAttempted) return {status: 'ready', preference: {enabled: true}};
        if (saveAttempted) return {status: 'error', retryable: true, preference: null};
        return {status: 'ready', preference: null};
      },
      save: async (enabled, locale, consentLocale) => {
        calls.push({action: 'save', enabled, locale, consentLocale});
        saveAttempted = true;
      },
      retry: async () => {
        calls.push({action: 'retry'});
        retryAttempted = true;
      },
    },
    connect: async userId => {
      calls.push({action: 'connect', userId});
      fakeBridge.connectedUser = userId;
    },
  };

  let bridgeFactoryCallCount = 0;
  const coordinator = {
    state: {userId: '00000000-0000-4000-8000-000000000001'},
    getState: () => coordinator.state,
    complete: async user => {
      calls.push({action: 'complete', user});
      return {ok: true};
    },
    skip: async _user => ({ok: true}),
    dismiss: () => {},
  };

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => {
      bridgeFactoryCallCount++;
      return fakeBridge;
    },
  });

  // Attempt 1: save fails with retryable error
  let attempt1Error = null;
  try {
    await actions.onContinue(true);
  } catch (err) {
    attempt1Error = err;
  }
  assert.ok(attempt1Error);
  assert.equal(bridgeFactoryCallCount, 1);
  assert.deepEqual(calls, [
    {action: 'connect', userId: '00000000-0000-4000-8000-000000000001'},
    {action: 'save', enabled: true, locale: 'it', consentLocale: 'it'},
  ]);

  // Attempt 2: retry must reuse bridge, preserve operation identity, call retry(), and complete
  await actions.onContinue(true);

  // Must NOT have recreated bridge!
  assert.equal(bridgeFactoryCallCount, 1);
  assert.deepEqual(calls, [
    {action: 'connect', userId: '00000000-0000-4000-8000-000000000001'},
    {action: 'save', enabled: true, locale: 'it', consentLocale: 'it'},
    {action: 'retry'},
    {action: 'complete', user: '00000000-0000-4000-8000-000000000001'},
  ]);
});

test('createWelcomeActions: account switch during save aborts completion on other user', async () => {
  const calls = [];
  const coordinator = {
    state: {userId: '00000000-0000-4000-8000-00000000000a'},
    getState: () => coordinator.state,
    complete: async user => {
      calls.push({action: 'complete', user});
      return {ok: true};
    },
    skip: async () => ({ok: true}),
    dismiss: () => {},
  };

  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => ({status: 'ready', preference: {enabled: true}}),
      save: async () => {
        // Switch user while save is running
        coordinator.state = {userId: '00000000-0000-4000-8000-00000000000b'};
        calls.push({action: 'save'});
      },
      retry: async () => {},
    },
    connect: async userId => {
      calls.push({action: 'connect', userId});
      fakeBridge.connectedUser = userId;
    },
  };

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => fakeBridge,
  });

  await actions.onContinue(true);

  // Must NOT call complete on user B!
  assert.deepEqual(calls, [
    {action: 'connect', userId: '00000000-0000-4000-8000-00000000000a'},
    {action: 'save'},
  ]);
  assert.equal(calls.some(c => c.action === 'complete'), false);
});

test('createWelcomeActions: optIn=false makes 0 bridge calls and completes directly', async () => {
  const calls = [];
  const coordinator = {
    state: {userId: '00000000-0000-4000-8000-000000000001'},
    getState: () => coordinator.state,
    complete: async user => {
      calls.push({action: 'complete', user});
      return {ok: true};
    },
    skip: async () => ({ok: true}),
    dismiss: () => {},
  };

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: null,
    locale: 'it',
    createBridge: () => {
      throw new Error('Should not create bridge');
    },
  });

  await actions.onContinue(false);

  assert.deepEqual(calls, [
    {action: 'complete', user: '00000000-0000-4000-8000-000000000001'},
  ]);
});

test('createWelcomeActions: onSkip calls coordinator.skip for captured user', async () => {
  const calls = [];
  const coordinator = {
    state: {userId: '00000000-0000-4000-8000-000000000001'},
    getState: () => coordinator.state,
    complete: async () => ({ok: true}),
    skip: async user => {
      calls.push({action: 'skip', user});
      return {ok: true};
    },
    dismiss: () => calls.push({action: 'dismiss'}),
  };

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: null,
    locale: 'it',
  });

  await actions.onSkip();
  assert.deepEqual(calls, [
    {action: 'skip', user: '00000000-0000-4000-8000-000000000001'},
  ]);
});
