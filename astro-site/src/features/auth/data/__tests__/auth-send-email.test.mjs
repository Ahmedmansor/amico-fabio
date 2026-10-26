import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthSendEmailHandler, buildMagicLinkEmailContent} from '../auth-send-email-handler.ts';

describe('auth-send-email-handler', () => {
  const defaultSender = {name: 'Fabio Egypt', email: 'info@fabioegypt.com'};
  const validDns = async () => ({status: 'valid', retryable: false});

  it('builds localized email content in Italian by default', () => {
    const itContent = buildMagicLinkEmailContent({
      recipient: 'user@libero.it',
      confirmationUrl: 'https://fabioegypt.com/auth/v1/verify?token=123',
      locale: 'it'
    });
    assert.equal(itContent.subject, 'Il tuo link di accesso - Fabio Egypt');
    assert.ok(itContent.html.includes('Accedi ora'));
    assert.ok(itContent.text.includes('Accedi a Fabio Egypt'));
  });

  it('builds localized email content in English when locale is en', () => {
    const enContent = buildMagicLinkEmailContent({
      recipient: 'user@example.com',
      confirmationUrl: 'https://fabioegypt.com/auth/v1/verify?token=123',
      locale: 'en'
    });
    assert.equal(enContent.subject, 'Your sign-in link - Fabio Egypt');
    assert.ok(enContent.html.includes('Sign in now'));
    assert.ok(enContent.text.includes('Sign in to Fabio Egypt'));
  });

  it('successfully dispatches magic link via Brevo when all checks pass', async () => {
    let capturedBrevoBody = null;
    const mockFetcher = async (url, options) => {
      if (url.includes('api.brevo.com')) {
        capturedBrevoBody = JSON.parse(options.body);
        return new Response(JSON.stringify({messageId: 'msg-12345'}), {status: 201});
      }
      return new Response('Not found', {status: 404});
    };

    const handler = createAuthSendEmailHandler({
      apiKey: 'test-brevo-key',
      sender: defaultSender,
      verifyDns: validDns,
      checkRateLimit: async () => ({allowed: true}),
      fetcher: mockFetcher
    });

    const response = await handler({
      user: {email: 'mario.rossi@libero.it', user_metadata: {site_locale: 'it'}},
      email_data: {token_hash: 'hash-abc', email_action_type: 'magiclink', redirect_to: 'https://fabioegypt.com/auth/callback'}
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {});
    assert.ok(capturedBrevoBody);
    assert.equal(capturedBrevoBody.to[0].email, 'mario.rossi@libero.it');
    assert.equal(capturedBrevoBody.subject, 'Il tuo link di accesso - Fabio Egypt');
  });

  it('rejects disposable domains without making any DNS or Brevo calls', async () => {
    let dnsCalled = false;
    let brevoCalled = false;

    const handler = createAuthSendEmailHandler({
      apiKey: 'test-brevo-key',
      sender: defaultSender,
      verifyDns: async () => { dnsCalled = true; return {status: 'valid', retryable: false}; },
      fetcher: async () => { brevoCalled = true; return new Response('', {status: 201}); }
    });

    const response = await handler({
      user: {email: 'spammer@mailinator.com'},
      email_data: {token_hash: 'hash-abc'}
    });

    assert.equal(response.status, 403);
    assert.ok(response.body.error.message.includes('disposable'));
    assert.equal(dnsCalled, false);
    assert.equal(brevoCalled, false);
  });

  it('rejects nonexistent domains based on DNS NXDOMAIN without calling Brevo', async () => {
    let brevoCalled = false;

    const handler = createAuthSendEmailHandler({
      apiKey: 'test-brevo-key',
      sender: defaultSender,
      verifyDns: async () => ({status: 'nonexistent-domain', retryable: false}),
      fetcher: async () => { brevoCalled = true; return new Response('', {status: 201}); }
    });

    const response = await handler({
      user: {email: 'user@nonexistent-domain-404.xyz'},
      email_data: {token_hash: 'hash-abc'}
    });

    assert.equal(response.status, 400);
    assert.ok(response.body.error.message.includes('does not accept'));
    assert.equal(brevoCalled, false);
  });

  it('treats temporary DNS failures as retryable 503 error without calling Brevo', async () => {
    let brevoCalled = false;

    const handler = createAuthSendEmailHandler({
      apiKey: 'test-brevo-key',
      sender: defaultSender,
      verifyDns: async () => ({status: 'temporary-dns-failure', retryable: true}),
      fetcher: async () => { brevoCalled = true; return new Response('', {status: 201}); }
    });

    const response = await handler({
      user: {email: 'user@unstable-dns.test'},
      email_data: {token_hash: 'hash-abc'}
    });

    assert.equal(response.status, 503);
    assert.ok(response.body.error.message.includes('temporarily unavailable'));
    assert.equal(brevoCalled, false);
  });

  it('enforces rate limits and returns 429 with retry_after_seconds without calling Brevo', async () => {
    let brevoCalled = false;

    const handler = createAuthSendEmailHandler({
      apiKey: 'test-brevo-key',
      sender: defaultSender,
      verifyDns: validDns,
      checkRateLimit: async () => ({allowed: false, reason: 'cooldown_active', retry_after_seconds: 45}),
      fetcher: async () => { brevoCalled = true; return new Response('', {status: 201}); }
    });

    const response = await handler({
      user: {email: 'user@libero.it'},
      email_data: {token_hash: 'hash-abc'}
    });

    assert.equal(response.status, 429);
    assert.equal(response.body.error.retry_after_seconds, 45);
    assert.equal(brevoCalled, false);
  });

  it('maps Brevo 429 provider rate limit correctly', async () => {
    const mockFetcher = async () => new Response('Too many requests', {status: 429});

    const handler = createAuthSendEmailHandler({
      apiKey: 'test-brevo-key',
      sender: defaultSender,
      verifyDns: validDns,
      checkRateLimit: async () => ({allowed: true}),
      fetcher: mockFetcher
    });

    const response = await handler({
      user: {email: 'user@libero.it'},
      email_data: {token_hash: 'hash-abc'}
    });

    assert.equal(response.status, 429);
    assert.ok(response.body.error.message.includes('rate limit'));
  });
});
