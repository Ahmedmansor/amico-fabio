import {it,expect} from 'vitest';
import {validateNotFound} from '../not-found';
import itCopy from '../../../../shared/i18n/dictionaries/it.json';
import enCopy from '../../../../shared/i18n/dictionaries/en.json';
it('requires complete 404 recovery text in both languages',()=>{for(const [locale,text]of [['it',itCopy.notFound],['en',enCopy.notFound]] as const)expect(validateNotFound(text,locale)).toEqual(text);});
it('missing recovery links fail with locale and field',()=>{expect(()=>validateNotFound({...itCopy.notFound,home:''},'it')).toThrow(/404:it.*home/);});
