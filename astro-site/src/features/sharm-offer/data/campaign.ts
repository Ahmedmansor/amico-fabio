import italian from './content/it.json' with {type:'json'};
import {validateCampaign,validateCampaignRoutes,type OfferCampaign} from '../domain/campaign.ts';
import {supportedLocales} from '../../../shared/config/languages.ts';
import {availableOfferImages} from './assets.mjs';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
export function getOfferCampaign():OfferCampaign {
  validateTranslations({it:italian.copy},italian.locales,italian.locale);
  validateCampaignRoutes([italian]);
  return validateCampaign(italian,supportedLocales,availableOfferImages(italian.images));
}
