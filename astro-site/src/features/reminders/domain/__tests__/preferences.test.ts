import {describe,it,expect} from 'vitest';
import {parsePreferenceChange,reminderConsentVersion} from '../preferences';
const valid={requestId:'00000000-0000-4000-8000-000000000001',enabled:true,locale:'en',wordingVersion:reminderConsentVersion};
describe('explicit reminder consent commands',()=>{
  it('accepts a current explicit opt-in without deriving consent from identity or favorites',()=>{
    expect(parsePreferenceChange(valid)).toEqual({ok:true,value:valid});
    expect(parsePreferenceChange({})).toEqual({ok:false,reason:'invalid-input'});
  });
  it('requires the displayed current wording for a grant',()=>{
    expect(parsePreferenceChange({...valid,wordingVersion:'old-copy'})).toEqual({ok:false,reason:'outdated-consent'});
  });
  it('allows withdrawal with stale wording so old pages cannot block opting out',()=>{
    expect(parsePreferenceChange({...valid,enabled:false,wordingVersion:'old-copy'})).toEqual({ok:true,value:{...valid,enabled:false}});
  });
  it('rejects ownership, recipient and audit-time injection as well as implicit truthy opt-in',()=>{
    for(const extra of [{userId:'other'},{email:'person@example.test'},{acceptedAt:'2026-10-24'},{source:'signup'}])
      expect(parsePreferenceChange({...valid,...extra})).toEqual({ok:false,reason:'invalid-input'});
    for(const enabled of [undefined,'true',1,null])expect(parsePreferenceChange({...valid,enabled})).toEqual({ok:false,reason:'invalid-input'});
  });
});
