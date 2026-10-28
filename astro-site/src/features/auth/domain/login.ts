import { validateEmailAddress } from './email-validation.ts';
import type { AuthResult } from './auth.ts';

/** Signup/recovery admission only; password login must still work for existing
 * accounts whose provider was subsequently blocked. Never rewrite identity. */
export function emailSendingGate(email: string, captchaRequired: boolean, token?: string): AuthResult<string> {
  const check = validateEmailAddress(email);
  if (!check.ok) return { ok: false, reason: check.reason === 'disposable-domain' ? 'disposable-domain' : 'invalid-email' };
  if (check.suggestion) return { ok: false, reason: 'email-typo' };
  if (captchaRequired && (!token?.trim() || token.length > 2048)) return { ok: false, reason: 'captcha-required' };
  return { ok: true, value: check.normalizedEmail };
}

/** Match the activation password policy; don't trim or otherwise alter passwords. */
export function validNewPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 12 && password.length <= 128;
}

export function passwordsMatch(password:string,confirmation:string):boolean{
  return typeof password==='string'&&password.length>0&&password===confirmation;
}
export function normalizePersonName(input:unknown):string|null{
  if(typeof input!=='string')return null;
  const name=input.trim().replace(/\s+/g,' ');
  return name.length>0&&name.length<=80&&!/[\u0000-\u001f\u007f-\u009f<>]/.test(name)?name:null;
}
export interface SignupDetails {firstName:string;lastName:string;passwordConfirmation:string}

export const emailCodeLength=6;
export function normalizeEmailCode(input:string):string|null{
  if(typeof input!=='string'||input.length>32)return null;
  const code=input.replace(/\s/g,'');
  return new RegExp(`^\\d{${emailCodeLength}}$`).test(code)?code:null;
}
