import it from './content/it.json' with { type: 'json' };
import en from './content/en.json' with { type: 'json' };
import { defaultLocale, supportedLocales } from '../../../shared/config/languages.ts';
import { validateTranslations } from '../../../shared/i18n/validate.ts';
import { getTrips } from '../../tours/data/trips.mjs';
import { getPackages } from '../../packages/data/packages.mjs';
import { toExploreCard, categoryLabel, cardBadge, validateExploreMessages } from '../domain/explore.ts';
const dictionaries = { it, en };
export function getExploreMessages(locale) {
  validateTranslations(dictionaries, supportedLocales, defaultLocale);
  return validateExploreMessages(dictionaries[locale],locale);
}
export async function getExploreCards(provider) {
  const [trips, packages] = await Promise.all([getTrips(provider), getPackages(provider)]);
  const cards = [...trips.map((trip,index) => toExploreCard(trip, 'trip',index)), ...packages.map((item,index) => toExploreCard(item, 'package',trips.length + index))];
  for (const locale of supportedLocales) {
    const messages = getExploreMessages(locale);
    for (const card of cards) { categoryLabel(card.category, messages); cardBadge(card, locale, messages); }
  }
  return cards;
}
