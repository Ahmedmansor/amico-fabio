import { describe, it, expect } from 'vitest';
import { emailSendingGate, validNewPassword, normalizeEmailCode,normalizePersonName,passwordsMatch } from '../login';
describe('email sending admission', () => {
  it('accepts international display names and requires an exact repeated password',()=>{
    expect(normalizePersonName('  Abdel   Rahman ')).toBe('Abdel Rahman');
    for(const name of ['أحمد','O’Connor','李'])expect(normalizePersonName(name)).toBe(name);
    for(const name of ['', '  ', '<script>', 'x'.repeat(81)])expect(normalizePersonName(name)).toBeNull();
    expect(passwordsMatch('long password','long password')).toBe(true);
    expect(passwordsMatch('long password','long password ')).toBe(false);
    expect(passwordsMatch('','')).toBe(false);
  });
  it('accepts numeric email codes without dropping leading zeros and rejects malformed codes',()=>{
    expect(normalizeEmailCode('000 123')).toBe('000123');
    for(const value of ['123','1234567','12345678','abcdef','12345678901','<123456>'])expect(normalizeEmailCode(value)).toBeNull();
  });
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
  it('does not treat alternate registered provider domains as proven typos',()=>{
    for(const domain of ['libero.com','virgilio.com','tiscali.com','gmail.co'])expect(emailSendingGate(`person@${domain}`,true,'token').ok).toBe(true);
    expect(emailSendingGate('person@icoud.com',true,'token')).toEqual({ok:false,reason:'email-typo'});
  });
});
