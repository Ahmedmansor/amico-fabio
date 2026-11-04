import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languageSuggestion,explicitLanguage} from '../preference.ts';
test('first visit uses the first supported browser language including regional tags',()=>{
  assert.deepEqual(languageSuggestion(null,['ar-EG','de-DE','en']),{locale:'de',kind:'suggestion'});
  assert.deepEqual(languageSuggestion(null,['pt-BR']),{locale:'pt',kind:'suggestion'});
  assert.equal(languageSuggestion(null,['it-IT','de']),null);
  assert.equal(languageSuggestion(null,['ar-EG']),null);
});
test('an explicit choice outranks browser hints and offers only a return link',()=>{
  assert.deepEqual(languageSuggestion('de',['en']),{locale:'de',kind:'return'});
  assert.equal(languageSuggestion('it',['de']),null);
});
test('untrusted or obsolete stored preferences cannot supply navigation targets',()=>{
  assert.equal(explicitLanguage('/evil/','fr'),null);
  assert.equal(explicitLanguage('invalid','en'),'en');
  assert.deepEqual(languageSuggestion('invalid',['es-ES']),{locale:'es',kind:'suggestion'});
});
