import {getOfferCampaign} from './campaign';
import type {OfferCampaign} from '../domain/campaign';
import {validateTestimonials} from '../domain/testimonials';

// Existing campaign videos; shared by the campaign and main-site home.
const references = [
  ['1214756632', 'VideoTestimonials.text.2', 'VideoTestimonials.image.10'],
  ['1214757531', 'VideoTestimonials.text.5', 'VideoTestimonials.image.11'],
  ['1214758552', 'VideoTestimonials.text.8', 'VideoTestimonials.image.12'],
  ['1214760129', 'VideoTestimonials.text.11', 'VideoTestimonials.image.13'],
  ['1214757761', 'VideoTestimonials.text.14', 'VideoTestimonials.image.14'],
  ['1214758307', 'VideoTestimonials.text.17', 'VideoTestimonials.image.15'],
] as const;

export function getOfferTestimonials(campaign: OfferCampaign = getOfferCampaign()) {
  return validateTestimonials(references.map(([videoId, titleKey, imageKey]) => ({
    videoId, title: campaign.copy[titleKey], image: campaign.images[imageKey],
  })));
}
