import type { Locale } from '../../../shared/config/languages';
import { getBookingCountries } from '../../booking/data/countries';

export function getNationalityOptions(locale: Locale) {
  return getBookingCountries().map(country => ({ value: country.v, label: country.t, colors:country.c, pattern:country.p }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}
