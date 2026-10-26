/**
 * DNS-based email domain verification.
 * Resolves MX records via DNS-over-HTTPS (DoH) with RFC 5321 fallback to A/AAAA records.
 * Distinguishes nonexistent domains (NXDOMAIN) from temporary DNS failures (SERVFAIL/timeout).
 */

export interface DnsVerificationResult {
  readonly status: 'valid' | 'nonexistent-domain' | 'no-mail-exchange' | 'temporary-dns-failure';
  readonly retryable: boolean;
  readonly mxHosts?: readonly string[];
  readonly errorDetail?: string;
}

export interface DnsVerificationOptions {
  readonly dohEndpoint?: string;
  readonly timeoutMs?: number;
  readonly fetcher?: typeof fetch;
}

const DEFAULT_DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
const DEFAULT_TIMEOUT_MS = 3000;

interface DohResponse {
  readonly Status?: number;
  readonly Answer?: readonly {
    readonly name: string;
    readonly type: number;
    readonly data: string;
  }[];
}

// DNS RCODE constants
const RCODE_NOERROR = 0;
const RCODE_NXDOMAIN = 3;

// DNS Type constants
const TYPE_A = 1;
const TYPE_MX = 15;
const TYPE_AAAA = 28;

export async function verifyEmailDomainDns(
  domain: string,
  options?: DnsVerificationOptions
): Promise<DnsVerificationResult> {
  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain || normalizedDomain.includes(' ') || !normalizedDomain.includes('.')) {
    return { status: 'nonexistent-domain', retryable: false, errorDetail: 'Malformed domain' };
  }

  const dohEndpoint = options?.dohEndpoint ?? DEFAULT_DOH_ENDPOINT;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetcher = options?.fetcher ?? fetch;

  async function queryDoh(type: 'MX' | 'A'): Promise<{ status: number; answers: DohResponse['Answer'] }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${dohEndpoint}?name=${encodeURIComponent(normalizedDomain)}&type=${type}`;
      const response = await fetcher(url, {
        method: 'GET',
        headers: { Accept: 'application/dns-json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`DoH server error: HTTP ${response.status}`);
      }

      const json = (await response.json()) as DohResponse;
      return { status: json.Status ?? -1, answers: json.Answer ?? [] };
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    // 1. Query MX records
    const mxResult = await queryDoh('MX');

    if (mxResult.status === RCODE_NXDOMAIN) {
      return { status: 'nonexistent-domain', retryable: false, errorDetail: 'Domain does not exist (NXDOMAIN)' };
    }

    if (mxResult.status === RCODE_NOERROR) {
      const mxAnswers = mxResult.answers?.filter((a) => a.type === TYPE_MX) ?? [];
      if (mxAnswers.length > 0) {
        const mxHosts = mxAnswers.map((a) => a.data.trim());
        // RFC 7505: "Null MX" record (preference 0, exchange ".") indicates domain does not accept email
        const isNullMx = mxHosts.some((host) => host === '0 .' || host.endsWith(' .'));
        if (isNullMx) {
          return { status: 'no-mail-exchange', retryable: false, errorDetail: 'Domain explicitly rejects email (Null MX)' };
        }
        return { status: 'valid', retryable: false, mxHosts };
      }

      // RFC 5321 fallback: If no MX record exists, query address records (A / AAAA)
      const aResult = await queryDoh('A');
      if (aResult.status === RCODE_NOERROR) {
        const aAnswers = aResult.answers?.filter((a) => a.type === TYPE_A || a.type === TYPE_AAAA) ?? [];
        if (aAnswers.length > 0) {
          return { status: 'valid', retryable: false, mxHosts: [normalizedDomain] };
        }
      }

      return { status: 'no-mail-exchange', retryable: false, errorDetail: 'No MX or address records found for domain' };
    }

    // Any other DNS status (SERVFAIL, REFUSED, etc.) is considered a temporary failure
    return {
      status: 'temporary-dns-failure',
      retryable: true,
      errorDetail: `DNS query returned RCODE ${mxResult.status}`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      status: 'temporary-dns-failure',
      retryable: true,
      errorDetail: `DNS resolution failed temporarily: ${detail}`,
    };
  }
}
