import type { BlogInquiry } from './models';
import { destinations, type Destination } from './taxonomy';

export type InquiryError = 'required' | 'tooLong' | 'invalidDate' | 'invalidAdults' | 'invalidChildren';
export type InquiryErrors = Partial<Record<keyof BlogInquiry, InquiryError>>;
export interface InquirySource { articleId?: string; title: string; url: string; destination?: Destination }
export interface InquiryCopy {
  greeting: string; name: string; nationality: string; date: string; adults: string; children: string;
  destination: string; message: string; sourceArticle: string; journal: string; undecided: string;
  destinationLabels: Record<Destination, string>;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** Validation is local only: it prepares an inquiry, not a priced reservation. */
export function validateInquiry(input: BlogInquiry, today: string, nationalities: ReadonlySet<string>): InquiryErrors {
  if (!isCalendarDate(today)) throw new Error('[blog] A valid captured local date is required.');
  const errors: InquiryErrors = {};
  if (!input.name.trim()) errors.name = 'required';
  else if (input.name.trim().length > 120) errors.name = 'tooLong';
  if (!nationalities.has(input.nationality)) errors.nationality = 'required';
  if (!isCalendarDate(input.date) || input.date < today) errors.date = 'invalidDate';
  if (!Number.isSafeInteger(input.adults) || input.adults < 1) errors.adults = 'invalidAdults';
  if (!Number.isSafeInteger(input.children) || input.children < 0) errors.children = 'invalidChildren';
  if (input.destination && !destinations.includes(input.destination)) errors.destination = 'required';
  if (input.message.trim().length > 2000) errors.message = 'tooLong';
  return errors;
}

export function inquiryMessage(input: BlogInquiry, source: InquirySource, copy: InquiryCopy): string {
  const url = new URL(source.url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('[blog] Inquiry source must be a public HTTPS URL.');
  url.search = ''; url.hash = '';
  return [copy.greeting, '',
    `${copy.name}: ${input.name.trim()}`,
    `${copy.nationality}: ${input.nationality}`,
    `${copy.date}: ${input.date}`,
    `${copy.adults}: ${input.adults}`,
    `${copy.children}: ${input.children}`,
    `${copy.destination}: ${input.destination ? copy.destinationLabels[input.destination] : copy.undecided}`,
    ...(input.message.trim() ? ['', `${copy.message}: ${input.message.trim()}`] : []),
    '', `${source.articleId ? copy.sourceArticle : copy.journal}: ${source.title}`, url.href,
  ].join('\n');
}

export function whatsappInquiryUrl(number: string, message: string): string {
  if (!/^\d{7,15}$/.test(number)) throw new Error('[blog] WhatsApp number must be international digits only.');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
