import {describe,expect,it} from 'vitest';
import {invitationDismissalMilliseconds,invitationSuppressed,invitationThresholdCount,canShowGuestInvitation} from '../invitation';

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

describe('progressive engagement invitation threshold',()=>{
  it('requires at least invitationThresholdCount items before offering sign-in to guests',()=>{
    expect(invitationThresholdCount).toBe(2);
    expect(canShowGuestInvitation(0,null,100)).toBe(false);
    expect(canShowGuestInvitation(1,null,100)).toBe(false);
    expect(canShowGuestInvitation(2,null,100)).toBe(true);
    expect(canShowGuestInvitation(3,null,100)).toBe(true);
  });
  it('respects 7-day suppression even when threshold is met',()=>{
    expect(canShowGuestInvitation(2,100,100)).toBe(false);
    expect(canShowGuestInvitation(3,100,100+invitationDismissalMilliseconds-1)).toBe(false);
    expect(canShowGuestInvitation(2,100,100+invitationDismissalMilliseconds)).toBe(true);
  });
  it('rejects invalid counts or corrupt timestamps',()=>{
    for(const value of [-1,NaN,Infinity,1.5])expect(()=>canShowGuestInvitation(value,null,100)).toThrow();
  });
});
