import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {verifyEmailDomainDns} from '../dns-verification.ts';

describe('verifyEmailDomainDns', () => {
  it('identifies domain with valid MX records', async () => {
    const mockFetcher = async (url) => {
      if (url.includes('type=MX')) {
        return new Response(JSON.stringify({
          Status: 0,
          Answer: [
            {name: 'gmail.com', type: 15, data: '5 gmail-smtp-in.l.google.com.'},
            {name: 'gmail.com', type: 15, data: '10 alt1.gmail-smtp-in.l.google.com.'}
          ]
        }), {status: 200});
      }
      return new Response(JSON.stringify({Status: 0, Answer: []}), {status: 200});
    };

    const result = await verifyEmailDomainDns('gmail.com', {fetcher: mockFetcher});
    assert.equal(result.status, 'valid');
    assert.equal(result.retryable, false);
    assert.ok(result.mxHosts?.length === 2);
  });

  it('falls back to A record when no MX record exists (RFC 5321)', async () => {
    const mockFetcher = async (url) => {
      if (url.includes('type=MX')) {
        return new Response(JSON.stringify({Status: 0, Answer: []}), {status: 200});
      }
      if (url.includes('type=A')) {
        return new Response(JSON.stringify({
          Status: 0,
          Answer: [{name: 'legacy-host.org', type: 1, data: '192.0.2.1'}]
        }), {status: 200});
      }
      return new Response(JSON.stringify({Status: 0, Answer: []}), {status: 200});
    };

    const result = await verifyEmailDomainDns('legacy-host.org', {fetcher: mockFetcher});
    assert.equal(result.status, 'valid');
    assert.equal(result.retryable, false);
    assert.deepEqual(result.mxHosts, ['legacy-host.org']);
  });

  it('rejects nonexistent domain (NXDOMAIN)', async () => {
    const mockFetcher = async () => {
      return new Response(JSON.stringify({Status: 3, Answer: []}), {status: 200});
    };

    const result = await verifyEmailDomainDns('nonexistent-domain-xyz123.com', {fetcher: mockFetcher});
    assert.equal(result.status, 'nonexistent-domain');
    assert.equal(result.retryable, false);
  });

  it('rejects domain with explicit Null MX (RFC 7505)', async () => {
    const mockFetcher = async () => {
      return new Response(JSON.stringify({
        Status: 0,
        Answer: [{name: 'no-email.test', type: 15, data: '0 .'}]
      }), {status: 200});
    };

    const result = await verifyEmailDomainDns('no-email.test', {fetcher: mockFetcher});
    assert.equal(result.status, 'no-mail-exchange');
    assert.equal(result.retryable, false);
  });

  it('treats network timeouts and SERVFAIL as retryable temporary failure', async () => {
    const mockFetcher = async () => {
      throw new Error('Connection timed out');
    };

    const result = await verifyEmailDomainDns('unstable-dns.test', {fetcher: mockFetcher});
    assert.equal(result.status, 'temporary-dns-failure');
    assert.equal(result.retryable, true);
    assert.ok(result.errorDetail?.includes('timed out'));
  });

  it('treats DoH server HTTP error as retryable temporary failure', async () => {
    const mockFetcher = async () => {
      return new Response('Internal Server Error', {status: 500});
    };

    const result = await verifyEmailDomainDns('example.com', {fetcher: mockFetcher});
    assert.equal(result.status, 'temporary-dns-failure');
    assert.equal(result.retryable, true);
  });
});
