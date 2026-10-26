import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindWelcomeDialog, createWelcomeActions} from '../welcome-interactions.ts';
import {createPostLoginCoordinator} from '../../data/post-login-coordinator.ts';

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
      if (continueFails) return {ok: false, error: 'Network error'};
      return {ok: true};
    },
    onSkip: async () => {
      actionLog.push({action: 'skip'});
      return {ok: true};
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
        confirmed: fakeBridge.saved,
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

test('createWelcomeActions: cached enabled=true without server confirmation must verify via save and not complete prematurely', async () => {
  const calls = [];
  let saveCalled = false;
  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => ({
        status: 'ready',
        preference: {enabled: true},
        confirmed: saveCalled, // False initially because it was from cache!
      }),
      save: async (enabled, locale, consentLocale) => {
        calls.push({action: 'save', enabled, locale, consentLocale});
        saveCalled = true;
      },
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
  };

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => fakeBridge,
  });

  await actions.onContinue(true);

  // Verifies that save() was NOT bypassed despite preference.enabled being true in cache
  assert.equal(saveCalled, true);
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
        if (!fakeBridge.connectedUser) return {status: 'signed-out', confirmed: false};
        if (retryAttempted) return {status: 'ready', preference: {enabled: true}, confirmed: true};
        if (saveAttempted) return {status: 'error', retryable: true, preference: null, confirmed: false};
        return {status: 'ready', preference: null, confirmed: false};
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
  const attempt1Result = await actions.onContinue(true);
  assert.equal(attempt1Result.ok, false);
  assert.equal(bridgeFactoryCallCount, 1);
  assert.deepEqual(calls, [
    {action: 'connect', userId: '00000000-0000-4000-8000-000000000001'},
    {action: 'save', enabled: true, locale: 'it', consentLocale: 'it'},
  ]);

  // Attempt 2: retry must reuse bridge, preserve operation identity, call retry(), and complete
  const attempt2Result = await actions.onContinue(true);
  assert.equal(attempt2Result.ok, true);

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

  let preferenceSaved = false;
  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => ({status: 'ready', preference: {enabled: preferenceSaved}}),
      save: async () => {
        preferenceSaved = true;
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

  const result = await actions.onContinue(true);
  assert.equal(result.ok, false);
  assert.equal(result.stale, true);

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

test('integration: account switch while save is pending preserves and leaves open new user dialog', async () => {
  const records = new Map();
  const userA = '00000000-0000-4000-8000-00000000000a';
  const userB = '00000000-0000-4000-8000-00000000000b';

  records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });
  records.set(userB, {
    userId: userB,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const onboardingRepo = {
    read: async userId => ({ok: true, value: records.get(userId) ?? null}),
    recordDecision: async (_userId, decision) => {
      return {ok: true, value: {outcome: decision}};
    },
  };

  let resolveUserASave;
  let userASaveStarted = false;
  let userAPreferenceEnabled = false;
  const userASavePromise = new Promise(resolve => (resolveUserASave = resolve));

  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => ({status: 'ready', preference: {enabled: userAPreferenceEnabled}}),
      save: async () => {
        userASaveStarted = true;
        await userASavePromise;
        userAPreferenceEnabled = true;
      },
      retry: async () => {},
    },
    connect: async userId => {
      fakeBridge.connectedUser = userId;
    },
  };

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

  const elements = {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn};

  let binding;
  const coordinator = createPostLoginCoordinator({
    onboardingRepo,
    rolloutVersion: 'welcome-v1',
    onStateChange: state => binding?.render(state),
  });

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => fakeBridge,
  });

  binding = bindWelcomeDialog(elements, messages, actions);

  // 1. User A connects: dialog opens for User A
  await coordinator.connectUser(userA, {displayName: 'User A'});
  assert.equal(dialog.open, true);
  assert.equal(titleEl.textContent, 'Ciao, User A!');

  // 2. User A clicks continue (save starts and blocks on userASavePromise)
  reminderCheckbox.checked = true;
  continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(userASaveStarted, true);
  assert.equal(userAPreferenceEnabled, false);
  assert.equal(continueBtn.disabled, true);

  // 3. While save is in-flight, auth switches to User B!
  actions.resetBridge();
  await coordinator.connectUser(userB, {displayName: 'User B'});

  // Dialog must now show User B and be interactive
  assert.equal(dialog.open, true);
  assert.equal(titleEl.textContent, 'Ciao, User B!');
  assert.equal(continueBtn.disabled, false);

  // 4. User A's slow save resolves
  resolveUserASave();
  await new Promise(resolve => setTimeout(resolve, 10));

  // User B's dialog MUST STILL BE OPEN!
  assert.equal(userAPreferenceEnabled, true);
  assert.equal(dialog.open, true);
  assert.equal(titleEl.textContent, 'Ciao, User B!');
  assert.equal(errorEl.hidden, true);
  assert.equal(continueBtn.disabled, false);
});

test('integration: wishlist sync update while save is pending preserves currentDialogGen, busy state, and displays error on failure', async () => {
  const records = new Map();
  const userA = '00000000-0000-4000-8000-00000000000a';
  records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const onboardingRepo = {
    read: async userId => ({ok: true, value: records.get(userId) ?? null}),
    recordDecision: async () => {
      return {ok: true, value: {outcome: 'complete'}};
    },
  };

  let rejectSave;
  let saveStarted = false;
  const savePromise = new Promise((_resolve, reject) => {
    rejectSave = reject;
  });

  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => ({status: 'ready', preference: {enabled: false}}),
      save: async () => {
        saveStarted = true;
        await savePromise;
      },
      retry: async () => {},
    },
    connect: async userId => {
      fakeBridge.connectedUser = userId;
    },
  };

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

  const elements = {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn};

  let binding;
  const coordinator = createPostLoginCoordinator({
    onboardingRepo,
    rolloutVersion: 'welcome-v1',
    onStateChange: state => binding?.render(state),
  });

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => fakeBridge,
  });

  binding = bindWelcomeDialog(elements, messages, actions);

  // 1. Connect user
  await coordinator.connectUser(userA, {displayName: 'User A'});
  assert.equal(dialog.open, true);

  // 2. User checks checkbox and clicks continue
  reminderCheckbox.checked = true;
  continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(saveStarted, true);
  assert.equal(continueBtn.disabled, true);
  assert.equal(skipBtn.disabled, true);

  // 3. While save is in-flight, a wishlist sync update arrives!
  coordinator.updateWishlistSync({status: 'synced', count: 4});

  // Busy state and button disabling MUST BE PRESERVED!
  assert.equal(continueBtn.disabled, true);
  assert.equal(skipBtn.disabled, true);
  assert.equal(syncStatusEl.hidden, false);
  assert.equal(syncStatusEl.textContent, messages.welcomeFavoritesSynced);

  // 4. The pending save fails
  rejectSave(new Error('Network disconnected'));
  await new Promise(resolve => setTimeout(resolve, 10));

  // The error MUST be displayed and buttons re-enabled for retry (not treated as stale)!
  assert.equal(dialog.open, true);
  assert.equal(errorEl.hidden, false);
  assert.equal(errorEl.textContent, messages.failed);
  assert.equal(reminderCheckbox.checked, true);
  assert.equal(continueBtn.disabled, false);
  assert.equal(skipBtn.disabled, false);
});

test('integration: complete failure leaves dialog open, shows error, preserves checkbox, and retry succeeds', async () => {
  const records = new Map();
  const userA = '00000000-0000-4000-8000-00000000000a';
  records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  let writeFails = true;
  const onboardingRepo = {
    read: async userId => ({ok: true, value: records.get(userId) ?? null}),
    recordDecision: async (_userId, decision) => {
      if (writeFails) throw new Error('Database write error');
      return {ok: true, value: {outcome: decision}};
    },
  };

  const fakeBridge = {
    connectedUser: null,
    controller: {
      getState: () => ({status: 'ready', preference: {enabled: true}, confirmed: true}),
      save: async () => {},
      retry: async () => {},
    },
    connect: async userId => {
      fakeBridge.connectedUser = userId;
    },
  };

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

  const elements = {dialog, titleEl, introEl, syncStatusEl, errorEl, reminderCheckbox, continueBtn, skipBtn};

  let binding;
  const coordinator = createPostLoginCoordinator({
    onboardingRepo,
    rolloutVersion: 'welcome-v1',
    onStateChange: state => binding?.render(state),
  });

  const actions = createWelcomeActions({
    coordinator,
    service: {bearerFor: async () => ({ok: true, value: 'token'})},
    preferences: {endpoint: 'https://auth.invalid/functions/v1/wishlist-email-preferences', timeoutMs: 5000, maxResponseBytes: 4096},
    locale: 'it',
    createBridge: () => fakeBridge,
  });

  binding = bindWelcomeDialog(elements, messages, actions);

  // Connect user A
  await coordinator.connectUser(userA, {displayName: 'User A'});
  assert.equal(dialog.open, true);

  // User checks the reminder checkbox
  reminderCheckbox.checked = true;

  // Click continue -> recordDecision fails
  continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 10));

  // Dialog must REMAIN open! Error displayed! Checkbox preserved! Buttons re-enabled!
  assert.equal(dialog.open, true);
  assert.equal(errorEl.hidden, false);
  assert.equal(errorEl.textContent, messages.failed);
  assert.equal(reminderCheckbox.checked, true);
  assert.equal(continueBtn.disabled, false);
  assert.equal(skipBtn.disabled, false);
  assert.equal(coordinator.getState().status, 'prompt');

  // Server write recovers
  writeFails = false;

  // Retry: click continue again
  continueBtn.dispatchEvent({type: 'click'});
  await new Promise(resolve => setTimeout(resolve, 10));

  // Succeeded: dialog is now closed! Coordinator is completed!
  assert.equal(dialog.open, false);
  assert.equal(coordinator.getState().status, 'completed');
});

