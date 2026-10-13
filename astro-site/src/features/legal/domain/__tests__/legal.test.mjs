import assert from 'node:assert/strict';
import { test } from 'node:test';
import it from '../../data/content/it.json' with { type: 'json' };
import en from '../../data/content/en.json' with { type: 'json' };
import { groupParagraphs, getDataChips, validateLegalPage, validateSectionIdentity } from '../legal.ts';

const icons = Object.fromEntries(it.sections.map(section => [section.id, `/icons/${section.id}.svg`]));
test('existing legal content validates in both languages with stable identities', () => {
  for (const [locale, page] of Object.entries({ it, en })) validateLegalPage(page, locale, icons);
  assert.doesNotThrow(() => validateSectionIdentity(it, en, 'en'));
});
test('consecutive bullet paragraphs form lists without changing source content', () => {
  const paragraphs = ['before', '• first', '• second', 'after', '• third'];
  const copy = [...paragraphs];
  assert.deepEqual(groupParagraphs(paragraphs), [
    { type: 'paragraph', text: 'before' }, { type: 'list', items: ['first', 'second'] },
    { type: 'paragraph', text: 'after' }, { type: 'list', items: ['third'] },
  ]);
  assert.deepEqual(paragraphs, copy);
});
test('data chips preserve the legacy parsing for real paragraphs', () => {
  assert.equal(getDataChips(it.sections.find(section => section.id === 'data_types').paragraphs)[0], 'Nome');
  assert.equal(getDataChips(en.sections.find(section => section.id === 'data_types').paragraphs)[0], 'Name');
  assert.deepEqual(getDataChips(['No colon']), []);
});
test('missing title reports the language and required field', () => {
  assert.throws(() => validateLegalPage({ ...it, title: '' }, 'it', icons), /it:title is required/);
});
test('duplicate section IDs are rejected', () => {
  assert.throws(() => validateLegalPage({ ...it, sections: [...it.sections, it.sections[0]] }, 'it', icons), /duplicate section ID intro/);
});
test('unknown table of contents references fail', () => {
  assert.throws(() => validateLegalPage({ ...it, toc: [...it.toc, { id: 'unknown', label: 'test' }] }, 'it', icons), /toc references unknown section unknown/);
});
test('sections missing from an index fail', () => {
  assert.throws(() => validateLegalPage({ ...it, toc: it.toc.slice(1) }, 'it', icons), /toc is missing section intro/);
});
test('missing image associations fail', () => {
  assert.throws(() => validateLegalPage(it, 'it', {}), /intro has no linked icon/);
});
test('missing paragraphs fail', () => {
  const page = structuredClone(it); page.sections[0].paragraphs = [];
  assert.throws(() => validateLegalPage(page, 'it', icons), /intro.paragraphs must not be empty/);
});
test('translation ID changes are rejected even if key structure matches', () => {
  const page = structuredClone(en); page.sections[0].id = 'changed';
  assert.throws(() => validateSectionIdentity(it, page, 'en'), /sections IDs or order do not match/);
});
