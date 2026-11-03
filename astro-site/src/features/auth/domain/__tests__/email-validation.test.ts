import { describe, expect, it } from 'vitest';
import {
  isDisposableDomain,
  suggestEmailCorrection,
  validateEmailAddress,
} from '../email-validation';

describe('Email validation and disposable domain rules', () => {
  it('accepts legitimate Italian email providers without false positives', () => {
    const italianProviders = [
      'libero.it',
      'virgilio.it',
      'alice.it',
      'tin.it',
      'tim.it',
      'tiscali.it',
      'fastwebnet.it',
      'poste.it',
      'postecert.it',
      'aruba.it',
    ];

    for (const domain of italianProviders) {
      expect(isDisposableDomain(domain)).toBe(false);
      const res = validateEmailAddress(`mario.rossi@${domain}`);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.normalizedEmail).toBe(`mario.rossi@${domain}`);
        expect(res.domain).toBe(domain);
      }
    }
  });

  it('accepts legitimate private, corporate and international domains', () => {
    const validEmails = [
      'tour-lead@my-agency.travel',
      'info@fabioegypt.com',
      'booking.team@desert-safari.eg',
      'mario+vip@consulting.co.uk',
      'o\'connor@irish-tours.ie',
      'contact@bÃ¼cher.de'.replace('Ã¼', 'ü'), // IDN support
    ];

    for (const email of validEmails) {
      const res = validateEmailAddress(email);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.normalizedEmail).toContain('@');
      }
    }
  });

  it('blocks known disposable email domains', () => {
    const disposables = [
      'test@mailinator.com',
      'temp@guerrillamail.com',
      'user@sharklasers.com',
      'anon@10minutemail.com',
      'fake@tempmail.com',
      'test@yopmail.com',
      'trash@trashmail.com',
      'sub@temp.mailinator.com', // subdomain of disposable
    ];

    for (const email of disposables) {
      const res = validateEmailAddress(email);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toBe('disposable-domain');
      }
    }
  });

  it('rejects malformed syntax, invalid lengths, and whitespace', () => {
    const malformed = [
      '',
      '   ',
      'mario',
      'mario@',
      '@libero.it',
      'mario libero.it',
      'mario@ libero.it',
      'mario @libero.it',
      'mario@@libero.it',
      'mario..rossi@libero.it',
      '.mario@libero.it',
      'mario.@libero.it',
      'mario@libero..it',
      'mario@-libero.it',
      'mario@libero.it:80',
      'mario@libero.it/path',
      'mario@libero.it?query=1',
      'mario@libero.it#hash',
      `${'a'.repeat(65)}@libero.it`, // local part > 64 chars
      `mario@${'a'.repeat(255)}.it`, // total / domain exceeds limits
      'mario<script>@libero.it',
      'mario(comment)@libero.it',
      'mario[tag]@libero.it',
    ];

    for (const email of malformed) {
      const res = validateEmailAddress(email);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toBe('invalid-format');
      }
    }
  });

  it('suggests typo corrections without automatically modifying input', () => {
    const typos: [string, string][] = [
      ['mario@gmial.com', 'mario@gmail.com'],
      ['mario@gamil.com', 'mario@gmail.com'],
      ['mario@gmai.com', 'mario@gmail.com'],
      ['mario@gmail.con', 'mario@gmail.com'],
      ['mario@hotmial.com', 'mario@hotmail.com'],
      ['mario@hotmial.it', 'mario@hotmail.it'],
      ['mario@outloo.com', 'mario@outlook.com'],
      ['mario@yaho.com', 'mario@yahoo.com'],
      ['mario@yaho.it', 'mario@yahoo.it'],
      ['mario@liberoo.it', 'mario@libero.it'],
      ['mario@virgilioo.it', 'mario@virgilio.it'],
      ['mario@icpoud.com', 'mario@icloud.com'],
    ];

    for (const [input, expectedSuggestion] of typos) {
      const res = validateEmailAddress(input);
      expect(res.ok).toBe(true);
      if (res.ok) {
        // Crucial: normalizedEmail is NOT modified to the suggested address
        expect(res.normalizedEmail).toBe(input.toLowerCase());
        expect(res.suggestion).not.toBeNull();
        expect(res.suggestion?.suggested).toBe(expectedSuggestion);
      }
    }
  });

  it('returns null suggestion for correct domains or unknown domains', () => {
    const correct = [
      'mario@gmail.com',
      'mario@hotmail.it',
      'mario@outlook.com',
      'mario@libero.it',
      'mario@virgilio.it',
      'user@unfamiliar-custom-domain.tours',
    ];

    for (const email of correct) {
      expect(suggestEmailCorrection(email)).toBeNull();
      const res = validateEmailAddress(email);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.suggestion).toBeNull();
      }
    }
  });
});
