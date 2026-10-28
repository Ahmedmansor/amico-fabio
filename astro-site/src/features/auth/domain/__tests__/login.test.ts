import { describe, it, expect } from 'vitest';
import { emailSendingGate, validNewPassword } from '../login';
describe('email sending admission', () => {
  it('orders syntax, explicit typo, disposable and CAPTCHA before admission', () => {
    expect(emailSendingGate('bad', true)).toEqual({ok:false,reason:'invalid-email'});
    expect(emailSendingGate('person@gamil.com', true, 'token')).toEqual({ok:false,reason:'email-typo'});
    expect(emailSendingGate('person@playfine.com', true, 'token')).toEqual({ok:false,reason:'disposable-domain'});
    expect(emailSendingGate('person@libero.it', true)).toEqual({ok:false,reason:'captcha-required'});
    expect(emailSendingGate('Mario+Trip@PRIVATE.IT', true, 'token')).toEqual({ok:true,value:'Mario+Trip@private.it'});
  });
  it('bounds the password without altering it', () => {
    expect(validNewPassword('short')).toBe(false);
    expect(validNewPassword('a'.repeat(129))).toBe(false);
    expect(validNewPassword(' a long password ')).toBe(true);
  });
});
