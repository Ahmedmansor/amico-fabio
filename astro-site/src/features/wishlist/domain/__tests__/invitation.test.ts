import {describe,expect,it} from 'vitest';
import {invitationDismissalMilliseconds,invitationSuppressed} from '../invitation';
describe('optional sign-in invitation suppression',()=>{
  it('allows first invitation and respects exactly seven days after Not now',()=>{
    expect(invitationSuppressed(null,100)).toBe(false);
    expect(invitationSuppressed(100,100)).toBe(true);
    expect(invitationSuppressed(100,100+invitationDismissalMilliseconds-1)).toBe(true);
    expect(invitationSuppressed(100,100+invitationDismissalMilliseconds)).toBe(false);
  });
  it('does not re-prompt when the browser clock moves backwards',()=>{
    expect(invitationSuppressed(1000,100)).toBe(true);
  });
  it('rejects corrupt timestamps without manufacturing elapsed time',()=>{
    for(const value of [-1,NaN,Infinity,1.5])expect(()=>invitationSuppressed(value,100)).toThrow();
    expect(()=>invitationSuppressed(null,-1)).toThrow();
  });
});
