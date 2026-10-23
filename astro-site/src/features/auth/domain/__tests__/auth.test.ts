import { describe, expect, it } from 'vitest';
import { cooldownRemaining, normalizeEmail, parseCallback, safeReturnPath } from '../auth';

describe('Auth input and callback rules', () => {
  it('accepts Italian, private and international domains; preserves mailbox identity', () => {
    for (const domain of ['libero.it', 'virgilio.it', 'outlook.com', 'yahoo.it', 'my-private.business']) {
      expect(normalizeEmail(`  Mario.Rossi+Tour@${domain.toUpperCase()}  `)).toBe(`Mario.Rossi+Tour@${domain}`);
    }
    expect(normalizeEmail("o'connor@fabioegypt.com")).toBe("o'connor@fabioegypt.com");
    expect(normalizeEmail('name@bücher.de')).toBe('name@xn--bcher-kva.de');
    expect(normalizeEmail('name@gmail.con')).toBe('name@gmail.con'); // Never silently correct.
  });
  it('rejects malformed email and URL tricks before a send request', () => {
    for (const email of ['', 'a', 'a@@b.it', 'a b@c.it', '.a@b.it', 'a..b@c.it', 'a@-b.it',
      'a@b.it:443', 'a@b.it/path', 'a@b.it?x', 'a@b.it#x', 'a@localhost', `${'a'.repeat(65)}@b.it`]) {
      expect(normalizeEmail(email), email).toBeNull();
    }
  });
  it('only allows exact reviewed return paths', () => {
    const allowed = ['/it/wishlist/', '/en/wishlist/'];
    expect(safeReturnPath('/en/wishlist/', allowed, allowed[0])).toBe('/en/wishlist/');
    for (const path of ['https://evil.test', '//evil.test', '/%2fevil.test', '/\\evil.test', '/it/wishlist/?next=x', '/it/auth/callback/', null]) {
      expect(safeReturnPath(path, allowed, allowed[0])).toBe('/it/wishlist/');
    }
  });
  it('accepts email hash on a new browser without an originating verifier', () => {
    expect(parseCallback('', '#token_hash=example_hash&type=email')).toEqual({ kind: 'email', tokenHash: 'example_hash' });
    expect(parseCallback('?code=oauth_code', '')).toEqual({ kind: 'google', code: 'oauth_code' });
  });
  it('rejects missing, ambiguous, exposed or unsupported callback credentials', () => {
    for (const [query, hash] of [ ['', ''], ['?token_hash=x', '#type=email'], ['?error=denied', ''],
      ['?code=a&code=b', ''], ['?code=a', '#token_hash=x&type=email'], ['', '#token_hash=x&type=recovery'],
      ['', '#token_hash=x&type=email&type=email'], ['', '#token_hash=x&token_hash=y&type=email'],
      ['', '#access_token=x&refresh_token=y'], ['', '#error=expired'] ]) {
      expect(parseCallback(query, hash)).toEqual({ kind: 'invalid' });
    }
  });
  it('uses the configured cooldown and handles clock rollback without an endless countdown', () => {
    expect(cooldownRemaining(null, 0, 75)).toBe(0);
    expect(cooldownRemaining(1000, 2000, 75)).toBe(74);
    expect(cooldownRemaining(1000, 76000, 75)).toBe(0);
    expect(cooldownRemaining(1000, -2000, 75)).toBe(75);
  });
});
