import {describe,it,expect} from 'vitest';
import {parsePreferenceChange,parseEmailPreference,reminderConsentVersion} from '../preferences';
const valid={requestId:'00000000-0000-4000-8000-000000000001',enabled:true,locale:'en',wordingVersion:reminderConsentVersion};
describe('explicit reminder consent commands',()=>{
  it('accepts only complete confirmed preference state and consistent consent times',()=>{
    const row={enabled:true,locale:'it',wordingVersion:reminderConsentVersion,updatedAt:'2026-10-24T00:00:00Z',enabledSince:'2026-10-24T00:00:00Z'};
    expect(parseEmailPreference(row)).toEqual(row);
    expect(parseEmailPreference({...row,enabled:false,enabledSince:null})).toEqual({...row,enabled:false,enabledSince:null});
    for(const invalid of [null,[],{}, {...row,enabledSince:null},{...row,enabled:false},{...row,locale:'xx'},{...row,updatedAt:'invalid'},{...row,email:'private@example.test'}])
      expect(parseEmailPreference(invalid)).toBeNull();
  });
  it('accepts a current explicit opt-in without deriving consent from identity or favorites',()=>{
    expect(parsePreferenceChange(valid)).toEqual({ok:true,value:{...valid,consentLocale:valid.locale}});
    expect(parsePreferenceChange({})).toEqual({ok:false,reason:'invalid-input'});
  });
  it('requires the displayed current wording for a grant',()=>{
    expect(parsePreferenceChange({...valid,wordingVersion:'old-copy'})).toEqual({ok:false,reason:'outdated-consent'});
  });
  it('keeps displayed consent language distinct from selected correspondence language',()=>{
    expect(parsePreferenceChange({...valid,locale:'it',consentLocale:'en'})).toEqual({ok:true,value:{...valid,locale:'it',consentLocale:'en'}});
    expect(parsePreferenceChange({...valid,consentLocale:'de'}).ok).toBe(false);
  });
  it('allows withdrawal with stale wording so old pages cannot block opting out',()=>{
    expect(parsePreferenceChange({...valid,enabled:false,wordingVersion:'old-copy'})).toEqual({ok:true,value:{...valid,enabled:false,consentLocale:valid.locale}});
  });
  it('rejects ownership, recipient and audit-time injection as well as implicit truthy opt-in',()=>{
    for(const extra of [{userId:'other'},{email:'person@example.test'},{acceptedAt:'2026-10-24'},{source:'signup'}])
      expect(parsePreferenceChange({...valid,...extra})).toEqual({ok:false,reason:'invalid-input'});
    for(const enabled of [undefined,'true',1,null])expect(parsePreferenceChange({...valid,enabled})).toEqual({ok:false,reason:'invalid-input'});
  });
});
