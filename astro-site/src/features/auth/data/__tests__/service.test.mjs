import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAuthConfig } from '../config.ts';
import { createAuthService } from '../service.ts';
import { accountSession } from '../profile.ts';

const env = { PUBLIC_AUTH_ENABLED: '1', PUBLIC_AUTH_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', PUBLIC_AUTH_SITE_URL: 'http://127.0.0.1:4322', PUBLIC_AUTH_GOOGLE_ENABLED: '1', PUBLIC_AUTH_EMAIL_ENABLED: '1', PUBLIC_AUTH_RESEND_SECONDS: '75' };
const config = readAuthConfig(env);
const session = { user: { id: 'test-user' } };
const sessionView = { userId: 'test-user', profile: { displayName: null, email: null, avatarUrl: null } };
function setup(overrides = {}, now = () => 1000) {
  const calls = [];
  const auth = {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user: session.user }, error: null }),
    signInWithOtp: async input => { calls.push(input); return { error: null }; },
    signInWithOAuth: async input => { calls.push(input); return { data: { url: `${config.url}/auth/v1/authorize?provider=google` }, error: null }; },
    verifyOtp: async input => { calls.push(input); return { data: { session }, error: null }; },
    exchangeCodeForSession: async input => { calls.push(input); return { data: { session }, error: null }; },
    signOut: async input => { calls.push(input); return { error: null }; },
    ...overrides,
  };
  return { service: createAuthService({ auth }, config, now), calls };
}

test('Auth is off by default; enabled config rejects secrets and missing operational settings', () => {
  assert.equal(readAuthConfig({}), null);
  assert.equal(readAuthConfig({ ...env, PUBLIC_AUTH_ENABLED: '0' }), null);
  for (const changes of [ { PUBLIC_AUTH_ENABLED: 'true' }, { PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_fake' },
    { PUBLIC_AUTH_SITE_URL: 'http://external.test' }, { PUBLIC_AUTH_RESEND_SECONDS: '' },
    { PUBLIC_AUTH_RESEND_SECONDS: '0' }, { PUBLIC_AUTH_EMAIL_ENABLED: '0', PUBLIC_AUTH_GOOGLE_ENABLED: '0' } ]) {
    assert.throws(() => readAuthConfig({ ...env, ...changes }));
  }
});
test('invalid mail never reaches provider; valid private mail gets a safe callback and no consent metadata', async () => {
  const { service, calls } = setup();
  assert.deepEqual(await service.requestMagicLink('bad', 'it'), { ok: false, reason: 'invalid-email' });
  assert.equal(calls.length, 0);
  assert.equal((await service.requestMagicLink('Mario+Tour@LIBERO.IT', 'it', '//evil.test')).ok, true);
  assert.equal(calls[0].email, 'Mario+Tour@libero.it');
  assert.equal(calls[0].options.emailRedirectTo, 'http://127.0.0.1:4322/it/auth/callback/?next=%2Fit%2Fwishlist%2F');
  assert.equal(calls[0].options.shouldCreateUser, true);
  assert.equal('data' in calls[0].options, false);
  assert.deepEqual(await service.requestMagicLink('a@b.it', 'it'), { ok: false, reason: 'rate-limited' });
  assert.equal(calls.length, 1);
});
test('concurrent requests cannot double-send and failed requests do not start a success cooldown', async () => {
  let resolve;
  const { service } = setup({ signInWithOtp: () => new Promise(done => { resolve = done; }) });
  const first = service.requestMagicLink('a@b.it', 'en');
  assert.deepEqual(await service.requestMagicLink('a@b.it', 'en'), { ok: false, reason: 'busy' });
  resolve({ error: { status: 429 } });
  assert.deepEqual(await first, { ok: false, reason: 'rate-limited' });
  assert.equal(service.remainingCooldown(), 0);
});
test('Google uses PKCE SDK URL generation with safe return and never automatically navigates', async () => {
  const { service, calls } = setup();
  assert.equal((await service.googleUrl('en', '/en/wishlist/')).ok, true);
  assert.equal(calls[0].provider, 'google');
  assert.equal(calls[0].options.skipBrowserRedirect, true);
  const unsafe = setup({ signInWithOAuth: async () => ({ data: { url: 'https://evil.test/' }, error: null }) });
  assert.equal((await unsafe.service.googleUrl('it')).ok, false);
});
test('callback verifies hash without a code verifier; used/expired links never become success', async () => {
  const { service, calls } = setup();
  assert.deepEqual(await service.completeCallback({ kind: 'email', tokenHash: 'fake_hash' }), { ok: true, value: sessionView });
  assert.deepEqual(calls[0], { token_hash: 'fake_hash', type: 'email' });
  const failed = setup({ verifyOtp: async () => ({ data: { session: null }, error: { code: 'otp_expired' } }) });
  assert.deepEqual(await failed.service.completeCallback({ kind: 'email', tokenHash: 'used' }), { ok: false, reason: 'invalid-link' });
  assert.deepEqual(await failed.service.completeCallback({ kind: 'invalid' }), { ok: false, reason: 'invalid-link' });
});
test('restores and verifies an existing identity and signs out this browser only', async () => {
  const { service, calls } = setup();
  assert.deepEqual(await service.currentSession(), { ok: true, value: sessionView });
  await service.signOut();
  assert.deepEqual(calls[0], { scope: 'local' });
  const mismatch = setup({ getUser: async () => ({ data: { user: { id: 'other' } }, error: null }) });
  assert.equal((await mismatch.service.currentSession()).ok, false);
});
test('session listener dispatches after SDK callback and can unsubscribe', async () => {
  let callback, unsubscribed = false;
  const { service } = setup({ onAuthStateChange(listener) { callback = listener; return { data: { subscription: { unsubscribe() { unsubscribed = true; } } } }; } });
  const states = [];
  const stop = service.subscribe(value => states.push(value));
  callback('INITIAL_SESSION', session);
  await Promise.resolve();
  assert.deepEqual(states, []); // Restoration must use the verified getUser result.
  callback('SIGNED_IN', session);
  assert.deepEqual(states, []);
  await Promise.resolve();
  assert.deepEqual(states, [sessionView]);
  stop();
  assert.equal(unsubscribed, true);
});

test('profile uses fresh verified-user fields; metadata is display only and cannot choose identity/email', async () => {
  const user = { id: 'test-user', email: 'qa@example.test', user_metadata: { full_name: '<b>QA Name</b>', avatar_url: 'https://lh3.googleusercontent.com/a/example', email: 'spoof@example.test', user_id: 'other', role: 'admin' } };
  const { service } = setup({ getUser: async () => ({ data: { user }, error: null }) });
  const result = await service.currentSession();
  assert.deepEqual(result, { ok: true, value: { userId: 'test-user', profile: { displayName: '<b>QA Name</b>', email: 'qa@example.test', avatarUrl: 'https://lh3.googleusercontent.com/a/example' } } });
  assert.equal('role' in result.value, false);
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', 'http://lh3.googleusercontent.com/a', 'https://evil.test/a', 'https://lh3.googleusercontent.com.evil.test/a', 'https://user:pass@lh3.googleusercontent.com/a']) {
    assert.equal(accountSession({ id: 'test', user_metadata: { picture: url } }).profile.avatarUrl, null);
  }
});
