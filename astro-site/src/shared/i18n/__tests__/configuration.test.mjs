import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultLocale, isLocale, resolveLocale, supportedLocales } from '../../config/languages.ts';
import { siteConfig } from '../../config/site.ts';
import { getSetupMessages, setupMessages } from '../setup.ts';
import { validateTranslations } from '../validate.ts';

test('enabled languages match the supplied dictionaries', () => {
  assert.deepEqual(supportedLocales, ['it', 'en']);
  assert.doesNotThrow(() => validateTranslations(setupMessages, supportedLocales, defaultLocale));
  assert.equal(getSetupMessages('en').status, setupMessages.en.status);
});

test('invalid stored preference does not hide a valid later preference', () => {
  assert.equal(resolveLocale('ar', 'en', 'it'), 'en');
  assert.equal(resolveLocale(undefined, 'unsupported'), 'it');
  assert.equal(isLocale('__proto__'), false);
});

test('a missing dictionary fails with its language', () => {
  assert.throws(() => validateTranslations({ it: {} }, ['it', 'en'], 'it'), /Missing dictionary for en/);
});

test('a missing nested translation fails with its exact key', () => {
  assert.throws(
    () => validateTranslations({ it: { form: { submit: 'Invia' } }, en: { form: {} } }, ['it', 'en'], 'it'),
    /en:form.submit missing translation key/,
  );
});

test('an unexpected key is rejected rather than silently ignored', () => {
  assert.throws(
    () => validateTranslations({ it: {}, en: { extra: 'x' } }, ['it', 'en'], 'it'),
    /en:extra unexpected translation key/,
  );
});

test('a mismatched translation type identifies the field', () => {
  assert.throws(
    () => validateTranslations({ it: { title: 'Titolo' }, en: { title: 1 } }, ['it', 'en'], 'it'),
    /en:title expected string, received number/,
  );
});

test('missing array content reports the list', () => {
  assert.throws(
    () => validateTranslations({ it: { items: ['a', 'b'] }, en: { items: ['a'] } }, ['it', 'en'], 'it'),
    /en:items expected 2 items, received 1/,
  );
});

test('adding a language requires a dictionary before generation', () => {
  assert.throws(() => validateTranslations(setupMessages, ['it', 'en', 'ar'], 'it'), /Missing dictionary for ar/);
});

test('a disabled dictionary is rejected', () => {
  assert.throws(() => validateTranslations(setupMessages, ['it'], 'it'), /Dictionary en is not an enabled language/);
});

test('default language must be enabled', () => {
  assert.throws(() => validateTranslations(setupMessages, ['it', 'en'], 'ar'), /Default language ar is not enabled/);
});

test('public contact values form valid URLs', () => {
  assert.match(siteConfig.whatsapp.number, /^\d+$/);
  assert.equal(new URL(siteConfig.url).hostname, 'fabioegypt.com');
  for (const url of Object.values(siteConfig.social)) {
    assert.equal(new URL(url).protocol, 'https:');
  }
});
