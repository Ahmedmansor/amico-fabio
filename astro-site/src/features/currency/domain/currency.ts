export const currencyCodes = ['EUR', 'USD', 'GBP'] as const;
export type CurrencyCode = typeof currencyCodes[number];
export type CurrencyRates = Readonly<Record<CurrencyCode, number | null>>;

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && currencyCodes.some(code => code === value);
}

export function resolveCurrency(value: unknown, rates: CurrencyRates): CurrencyCode {
  return isCurrency(value) && rates[value] !== null ? value : 'EUR';
}

/** EUR is authoritative. Owner policy: ceil converted amounts to whole units. */
export function convertPrice(eur: number, currency: CurrencyCode, rates: CurrencyRates): number {
  if (!Number.isFinite(eur) || eur < 0) throw new Error('[currency] Invalid EUR amount.');
  const rate = rates[currency];
  if (rate === null || !Number.isFinite(rate) || rate <= 0 || rates.EUR !== 1) {
    throw new Error(`[currency] Missing or invalid ${currency} conversion rate.`);
  }
  if (currency === 'EUR') return eur;
  // Remove binary floating-point noise (25 * 1.12 is 28.000000000000004).
  return Math.ceil(Number((eur * rate).toFixed(10)));
}

export function formatPrice(eur: number, currency: CurrencyCode, rates: CurrencyRates, locale: string): string {
  return new Intl.NumberFormat(locale, {style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2})
    .format(convertPrice(eur, currency, rates));
}

export function currencyQuote(eur: number, currency: CurrencyCode, rates: CurrencyRates, locale: string, label: string): string {
  return currency === 'EUR' ? '' : `${label}: ${formatPrice(eur, currency, rates, locale)} (${currency})`;
}
