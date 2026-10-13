import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import it from '../../data/content/it.json' with { type: 'json' };
import en from '../../data/content/en.json' with { type: 'json' };
import { validateHome, reviewRating } from '../home.ts';
test('both home dictionaries preserve all original section text, biography and reviews', () => {
  const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../../../../../../assets/js/image_paths.js', import.meta.url), 'utf8'), context);
  for (const [locale, content] of Object.entries({ it, en })) {
    vm.runInContext(fs.readFileSync(new URL(`../../../../../../assets/lang/global-${locale}.js`, import.meta.url), 'utf8'), context);
    const legacy = context.window[locale === 'it' ? 'i18nIt' : 'i18nEn'];
    validateHome(content);
    assert.deepEqual(content.hero, JSON.parse(JSON.stringify(legacy.hero)));
    assert.deepEqual(content.reviews, JSON.parse(JSON.stringify(legacy.reviews)));
    for (const key of Object.keys(content.global)) assert.deepEqual(content.global[key], JSON.parse(JSON.stringify(legacy.global[key])));
  }
});
test('missing section text and invalid reviews fail before rendering', () => {
  const missing = structuredClone(it); missing.global.who_is_fabio_content = '';
  assert.throws(() => validateHome(missing), /Missing required/);
  const invalid = structuredClone(it); invalid.reviews.items[0].text = '';
  assert.throws(() => validateHome(invalid), /Invalid review/);
});
test('ratings retain the original renderer clamp', () => {
  assert.equal(reviewRating(5), 5); assert.equal(reviewRating(6), 5);
  assert.equal(reviewRating(-1), 0); assert.equal(reviewRating(NaN), 0); assert.equal(reviewRating(3.6), 4);
});
