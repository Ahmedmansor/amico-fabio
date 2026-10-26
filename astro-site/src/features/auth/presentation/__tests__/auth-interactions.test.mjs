import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { suggestEmailCorrection, validateEmailAddress } from '../../domain/email-validation.ts';

const itJson = JSON.parse(fs.readFileSync(new URL('../../data/content/it.json', import.meta.url), 'utf8'));
const enJson = JSON.parse(fs.readFileSync(new URL('../../data/content/en.json', import.meta.url), 'utf8'));

test('auth dialog: typo suggestion detects common errors and formats suggestion message', () => {
  const typo = suggestEmailCorrection('mario@gmial.com');
  assert.notEqual(typo, null);
  assert.equal(typo?.suggested, 'mario@gmail.com');

  const msgIt = itJson.didYouMean.replace('{suggestion}', typo.suggested);
  assert.equal(msgIt, 'Forse intendevi mario@gmail.com?');

  const msgEn = enJson.didYouMean.replace('{suggestion}', typo.suggested);
  assert.equal(msgEn, 'Did you mean mario@gmail.com?');
});

test('auth dialog: disposable domains are blocked and matched with translated error', () => {
  const validation = validateEmailAddress('spammer@mailinator.com');
  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.equal(validation.reason, 'disposable-domain');
  }

  assert.equal(typeof itJson.disposableEmail, 'string');
  assert.equal(itJson.disposableEmail.includes('temporanei'), true);

  assert.equal(typeof enJson.disposableEmail, 'string');
  assert.equal(enJson.disposableEmail.includes('Temporary email'), true);
});

test('auth dialog: legitimate Italian and private domains are valid without suggestion', () => {
  for (const domain of ['libero.it', 'virgilio.it', 'poste.it', 'tiscali.it', 'my-domain.tours']) {
    const email = `tourist@${domain}`;
    const validation = validateEmailAddress(email);
    assert.equal(validation.ok, true, `Expected ${email} to be valid`);
    if (validation.ok) {
      assert.equal(validation.suggestion, null);
    }
  }
});

test('callback: expired or invalid link messages and request new link buttons exist in both locales', () => {
  for (const dict of [itJson, enJson]) {
    assert.equal(typeof dict.invalidLink, 'string');
    assert.equal(dict.invalidLink.length > 0, true);
    assert.equal(typeof dict.expiredLink, 'string');
    assert.equal(dict.expiredLink.length > 0, true);
    assert.equal(typeof dict.requestNewLink, 'string');
    assert.equal(dict.requestNewLink.length > 0, true);
  }
});
