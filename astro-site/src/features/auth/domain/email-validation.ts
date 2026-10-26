/**
 * Email validation, disposable domain detection, and typo suggestion.
 * Pure domain functions: no DOM, network, environment variables, or third-party dependencies.
 */

export interface EmailTypoSuggestion {
  original: string;
  suggested: string;
  suggestedDomain: string;
}

export type EmailValidationOutcome =
  | {
      ok: true;
      normalizedEmail: string;
      localPart: string;
      domain: string;
      suggestion: EmailTypoSuggestion | null;
    }
  | {
      ok: false;
      reason: 'invalid-format' | 'disposable-domain';
      suggestion?: EmailTypoSuggestion | null;
    };

/**
 * Common domain typo mapping.
 * Crucial rule: typo suggestions are presented for explicit user confirmation only;
 * they MUST NEVER automatically or silently rewrite user input.
 */
const DOMAIN_TYPO_MAP: Readonly<Record<string, string>> = Object.freeze({
  // Gmail typos
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gmaili.com': 'gmail.com',

  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.it': 'hotmail.it',
  'hotmaill.it': 'hotmail.it',
  'hotmil.it': 'hotmail.it',
  'hotmail.ti': 'hotmail.it',

  // Outlook typos
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outluk.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'putlook.com': 'outlook.com',
  'outloo.it': 'outlook.it',
  'outlok.it': 'outlook.it',

  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.it': 'yahoo.it',
  'yahooo.it': 'yahoo.it',
  'yahoo.ti': 'yahoo.it',

  // Italian providers typos (common mistypes from Italian users)
  'liberoo.it': 'libero.it',
  'liber.it': 'libero.it',
  'libero.com': 'libero.it', // Libero uses .it; typing .com is a frequent error
  'libero.ti': 'libero.it',
  'livero.it': 'libero.it',
  'virgilioo.it': 'virgilio.it',
  'virgilio.com': 'virgilio.it', // Virgilio uses .it
  'virgili.it': 'virgilio.it',
  'virgilo.it': 'virgilio.it',
  'tiscalii.it': 'tiscali.it',
  'tiscali.com': 'tiscali.it',

  // iCloud typos
  'icpoud.com': 'icloud.com',
  'iclod.com': 'icloud.com',
  'icluod.com': 'icloud.com',
  'icloud.con': 'icloud.com',

  // Proton typos
  'protonmial.com': 'protonmail.com',
  'protonmai.com': 'protonmail.com',
  'proton.con': 'proton.me',
});

/**
 * Maintained list of known temporary / disposable email services.
 * Note: validation cannot guarantee all disposable domains are detected or prove mailbox existence.
 * Legitimate Italian providers and private domains are strictly excluded from this list.
 */
const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'spam4.me',
  'tempmail.com',
  'temp-mail.org',
  'tempmail.net',
  'tempail.com',
  'tempmailaddress.com',
  '10minutemail.com',
  '10minutemail.net',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'dispostable.com',
  'getairmail.com',
  'nada.ltd',
  'mohmal.com',
  'crazymailing.com',
  'fakemailgenerator.com',
  'maildrop.cc',
  'inboxkitten.com',
  'burnermail.io',
  'emailondeck.com',
  'disposablemail.com',
  'generator.email',
  'mytemp.email',
  'dropmail.me',
  'getnada.com',
  'abvmail.com',
  'temp-mail.io',
  'minuteinbox.com',
  'tmailor.com',
  'internxt.com',
]);

/**
 * Whitelist of known legitimate Italian and global email providers
 * to safeguard against accidental false positives.
 */
const LEGITIMATE_WHITELIST: ReadonlySet<string> = new Set([
  // Italian providers
  'libero.it',
  'virgilio.it',
  'alice.it',
  'tin.it',
  'tim.it',
  'tiscali.it',
  'fastwebnet.it',
  'poste.it',
  'postecert.it',
  'email.it',
  'aruba.it',
  'pec.it',

  // Global webmail & business providers
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.it',
  'hotmail.com',
  'hotmail.it',
  'live.com',
  'live.it',
  'msn.com',
  'yahoo.com',
  'yahoo.it',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'gmx.de',
  'mail.com',
]);

/**
 * Check if domain or any of its parent domain segments belongs to the disposable list.
 */
export function isDisposableDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().trim();
  if (LEGITIMATE_WHITELIST.has(normalized)) return false;
  if (DISPOSABLE_DOMAINS.has(normalized)) return true;

  // Check parent domains (e.g. sub.mailinator.com -> mailinator.com)
  const parts = normalized.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DISPOSABLE_DOMAINS.has(parent)) return true;
  }

  return false;
}

/**
 * Suggest a correction if the domain matches a known common typo.
 * Returns null if no typo pattern is found.
 */
export function suggestEmailCorrection(email: string): EmailTypoSuggestion | null {
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();

  const suggestedDomain = DOMAIN_TYPO_MAP[domain];
  if (!suggestedDomain || suggestedDomain === domain) return null;

  return {
    original: email,
    suggested: `${local}@${suggestedDomain}`,
    suggestedDomain,
  };
}

/**
 * Validates an email address syntax, length, character set, and disposable domain status.
 * Accepts legitimate Italian providers, private domains, and internationalized domains.
 */
export function validateEmailAddress(input: string): EmailValidationOutcome {
  if (typeof input !== 'string') return { ok: false, reason: 'invalid-format' };
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 254 || /\s/.test(trimmed)) {
    return { ok: false, reason: 'invalid-format' };
  }

  const at = trimmed.lastIndexOf('@');
  if (at < 1 || trimmed.indexOf('@') !== at) {
    return { ok: false, reason: 'invalid-format' };
  }

  const local = trimmed.slice(0, at);
  if (
    local.length > 64 ||
    /[<>()[\]\\,;:"]/.test(local) ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..')
  ) {
    return { ok: false, reason: 'invalid-format' };
  }

  const domainRaw = trimmed.slice(at + 1);
  if (/[/:?#\\%]/.test(domainRaw)) {
    return { ok: false, reason: 'invalid-format' };
  }

  let domain: string;
  try {
    const parsed = new URL(`https://${domainRaw}/`);
    domain = parsed.hostname;
    if (parsed.port || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      return { ok: false, reason: 'invalid-format' };
    }
  } catch {
    return { ok: false, reason: 'invalid-format' };
  }

  if (
    !domain.includes('.') ||
    domain.length > 253 ||
    !domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
  ) {
    return { ok: false, reason: 'invalid-format' };
  }

  const normalizedDomain = domain.toLowerCase();
  const normalizedEmail = `${local}@${normalizedDomain}`;
  const suggestion = suggestEmailCorrection(normalizedEmail);

  if (isDisposableDomain(normalizedDomain)) {
    return {
      ok: false,
      reason: 'disposable-domain',
      suggestion,
    };
  }

  return {
    ok: true,
    normalizedEmail,
    localPart: local,
    domain: normalizedDomain,
    suggestion,
  };
}
