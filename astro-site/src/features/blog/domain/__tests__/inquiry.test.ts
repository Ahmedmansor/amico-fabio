import { describe, expect, it } from 'vitest';
import { inquiryMessage, validateInquiry, whatsappInquiryUrl, type InquiryCopy } from '../inquiry';
import type { BlogInquiry } from '../models';

const nationalities = new Set(['Italy', 'United Kingdom']);
const input: BlogInquiry = { name: 'Demo visitor', nationality: 'Italy', date: '2026-10-28', adults: 2, children: 0, message: '' };
const copy: InquiryCopy = { greeting: 'Hello', name: 'Name', nationality: 'Nationality', date: 'Date', adults: 'Adults', children: 'Children',
  destination: 'Destination', message: 'Message', sourceArticle: 'Article', journal: 'Journal', undecided: 'Not decided',
  destinationLabels: { cairo: 'Cairo', luxor: 'Luxor', aswan: 'Aswan', sharm: 'Sharm' } };
const source = { articleId: 'demo-id', title: 'Demo article', url: 'https://example.invalid/en/blog/demo/?utm_source=demo#section' };

describe('local inquiry validation', () => {
  it('accepts the local current day, valid counts and an undecided destination', () => {
    expect(validateInquiry(input, '2026-10-28', nationalities)).toEqual({});
  });
  it('rejects blank/long names and unknown nationality without inventing contact checks', () => {
    expect(validateInquiry({ ...input, name: ' ', nationality: 'unknown' }, '2026-10-28', nationalities)).toMatchObject({ name: 'required', nationality: 'required' });
    expect(validateInquiry({ ...input, name: 'a'.repeat(121) }, '2026-10-28', nationalities).name).toBe('tooLong');
  });
  it('rejects impossible and past dates, but accepts leap day', () => {
    expect(validateInquiry({ ...input, date: '2026-02-30' }, '2026-01-01', nationalities).date).toBe('invalidDate');
    expect(validateInquiry({ ...input, date: '2026-10-27' }, '2026-10-28', nationalities).date).toBe('invalidDate');
    expect(validateInquiry({ ...input, date: '2028-02-29' }, '2028-02-28', nationalities).date).toBeUndefined();
    expect(() => validateInquiry(input, 'bad', nationalities)).toThrow('captured local date');
  });
  it('rejects fractional/negative/unsafe counts and oversized messages', () => {
    expect(validateInquiry({ ...input, adults: 0, children: -1 }, '2026-10-28', nationalities)).toMatchObject({ adults: 'invalidAdults', children: 'invalidChildren' });
    expect(validateInquiry({ ...input, adults: 1.5, children: Infinity, message: 'x'.repeat(2001) }, '2026-10-28', nationalities)).toMatchObject({ adults: 'invalidAdults', children: 'invalidChildren', message: 'tooLong' });
  });
});

describe('WhatsApp message contract', () => {
  it('includes entered details and a clean article context, with no invented total', () => {
    const message = inquiryMessage({ ...input, destination: 'cairo', message: 'A question' }, source, copy);
    expect(message).toContain('Adults: 2\nChildren: 0\nDestination: Cairo');
    expect(message).toContain('Message: A question');
    expect(message).toContain('Article: Demo article\nhttps://example.invalid/en/blog/demo/');
    expect(message).not.toMatch(/utm_source|#section|€|total|confirmed/i);
  });
  it('uses supplied localized labels and keeps whitespace/accents/newlines safely encoded once', () => {
    const message = inquiryMessage({ ...input, name: "D'Angelo & città", message: '50% + mare?\nSeconda riga #1' }, source, { ...copy, greeting: 'Ciao', name: 'Nome', undecided: 'Non deciso' });
    const url = new URL(whatsappInquiryUrl('201000000000', message));
    expect(url.searchParams.get('text')).toBe(message);
    expect(message).toContain("Nome: D'Angelo & città");
    expect(message).toContain('Destination: Non deciso');
    expect(message).toContain('50% + mare?\nSeconda riga #1');
  });
  it('uses a page source for listing inquiries and rejects unsafe source/number config', () => {
    expect(inquiryMessage(input, { title: 'Journal', url: 'https://example.invalid/it/blog/' }, copy)).toContain('Journal: Journal');
    expect(() => inquiryMessage(input, { ...source, url: 'javascript:alert(1)' }, copy)).toThrow('public HTTPS');
    expect(() => whatsappInquiryUrl('+20 wrong', 'demo')).toThrow('international digits');
  });
});
