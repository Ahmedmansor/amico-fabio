import {describe,it,expect} from 'vitest';
import {parseManagementCommand,parseManagementState,correspondenceManagementUrl} from '../management';
const requestId='00000000-0000-4000-8000-000000000001',token='a'.repeat(64);
describe('scoped correspondence capabilities',()=>{
  it('permits only read, unsubscribe and supported explicit language with revision',()=>{
    expect(parseManagementCommand({operation:'read'})).toEqual({operation:'read'});
    expect(parseManagementCommand({operation:'unsubscribe',requestId,consentLocale:'en'})).not.toBeNull();
    expect(parseManagementCommand({operation:'language',requestId,locale:'it',expectedRevision:0})).not.toBeNull();
    for(const command of [{operation:'subscribe',requestId},{operation:'read',userId:requestId},{operation:'unsubscribe',requestId,enabled:true},
      {operation:'language',requestId,locale:'de',expectedRevision:0},{operation:'language',requestId,locale:'en',expectedRevision:-1}])expect(parseManagementCommand(command)).toBeNull();
  });
  it('exposes only minimal confirmed state, no profile or account identifiers',()=>{
    expect(parseManagementState({enabled:false,locale:'en',revision:1})).not.toBeNull();
    expect(parseManagementState({enabled:false,locale:'en',revision:1,email:'private'})).toBeNull();
  });
  it('puts capability only in a localized fragment on a trusted explicit origin',()=>{
    const url=new URL(correspondenceManagementUrl('https://preview.example.test','it',token));
    expect(url.pathname).toBe('/it/email-preferences/');expect(url.search).toBe('');expect(url.hash).toBe('#token='+token);
    for(const origin of ['https://user:pass@example.test','https://example.test/path','http://remote.test'])
      expect(()=>correspondenceManagementUrl(origin,'en',token)).toThrow();
  });
});
