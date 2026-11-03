import type {CurrencyRates} from '../domain/currency';

// Owner-approved fixed rates, 2026-11-02, including the owner's buffer.
// Units of target currency for 1 EUR. Changes require a static rebuild/deploy.
export const currencyRates: CurrencyRates = {EUR: 1, USD: 1.12, GBP: 0.88};
export const currencyRateRevision = '2026-11-02';
