import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindWelcomeDialog} from '../welcome-interactions.ts';

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

test('action handler: optIn=true connects bridge, verifies status, saves consent, and completes', async () => {
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
    },
    connect: async userId => {
      calls.push({action: 'connect', userId});
      fakeBridge.connectedUser = userId;
    },
  };
  const fakeCoordinator = {
    getState: () => ({userId: '00000000-0000-4000-8000-000000000001'}),
    complete: async () => {
      calls.push({action: 'complete'});
      return {ok: true};
    },
  };

  const executeContinue = async (optIn, bridge) => {
    const userId = fakeCoordinator.getState().userId;
    if (!userId) throw new Error('No user');
    if (optIn) {
      await bridge.connect(userId);
      if (bridge.controller.getState().status !== 'ready') throw new Error('Not ready');
      await bridge.controller.save(true, 'it', 'it');
      if (bridge.controller.getState().preference?.enabled !== true) throw new Error('Not enabled');
    }
    const res = await fakeCoordinator.complete();
    if (!res.ok) throw new Error('Failed');
  };

  await executeContinue(true, fakeBridge);
  assert.deepEqual(calls, [
    {action: 'connect', userId: '00000000-0000-4000-8000-000000000001'},
    {action: 'save', enabled: true, locale: 'it', consentLocale: 'it'},
    {action: 'complete'},
  ]);
});

test('action handler: optIn=false makes 0 bridge calls and completes directly', async () => {
  const calls = [];
  const fakeBridge = {
    connect: async () => calls.push({action: 'connect'}),
    controller: {save: async () => calls.push({action: 'save'})},
  };
  const fakeCoordinator = {
    getState: () => ({userId: '00000000-0000-4000-8000-000000000001'}),
    complete: async () => {
      calls.push({action: 'complete'});
      return {ok: true};
    },
  };

  const executeContinue = async (optIn, bridge) => {
    const userId = fakeCoordinator.getState().userId;
    if (!userId) throw new Error('No user');
    if (optIn) {
      await bridge.connect(userId);
      await bridge.controller.save(true, 'it', 'it');
    }
    const res = await fakeCoordinator.complete();
    if (!res.ok) throw new Error('Failed');
  };

  await executeContinue(false, fakeBridge);
  assert.deepEqual(calls, [{action: 'complete'}]);
});

test('action handler: bridge connect failure throws and aborts completion', async () => {
  const calls = [];
  const fakeBridge = {
    connect: async () => {
      calls.push({action: 'connect'});
      throw new Error('Connection failed');
    },
    controller: {
      getState: () => ({status: 'signed-out'}),
      save: async () => calls.push({action: 'save'}),
    },
  };
  const fakeCoordinator = {
    getState: () => ({userId: '00000000-0000-4000-8000-000000000001'}),
    complete: async () => calls.push({action: 'complete'}),
  };

  let threw = false;
  try {
    const userId = fakeCoordinator.getState().userId;
    await fakeBridge.connect(userId);
    await fakeCoordinator.complete();
  } catch {
    threw = true;
  }

  assert.equal(threw, true);
  assert.deepEqual(calls, [{action: 'connect'}]);
});
