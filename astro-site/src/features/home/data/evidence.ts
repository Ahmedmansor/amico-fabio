import type {Locale} from '../../../shared/config/languages';
import {getOfferCampaign} from '../../sharm-offer/data/campaign';
import {getOfferTestimonials} from '../../sharm-offer/data/testimonials';
import type {HomeContent} from '../domain/home';

export function getHomeEvidence(locale: Locale, copy: HomeContent['journey']) {
  const campaign = getOfferCampaign();
  const source = campaign.copy;
  const whyKeys = [["TrustBadges.text.0","TrustBadges.text.1"],["TrustBadges.text.2","TrustBadges.text.3"],["WhyChooseUs.text.5","WhyChooseUs.text.6"]];
  const stepKeys = [[2,3],[5,6],[8,9],[11,12]];
  return {
    whyTitle: locale === 'it' ? source['WhyChooseUs.text.0'] : copy.whyTitle,
    why: locale === 'it' ? whyKeys.map(([title,text]) => ({title:source[title],text:source[text]})) : copy.why,
    stepsTitle: locale === 'it' ? source['TimelineSteps.text.0'] : copy.stepsTitle,
    steps: locale === 'it' ? stepKeys.map(([title,text]) => ({title:source[`TimelineSteps.text.${title}`],text:source[`TimelineSteps.text.${text}`]})) : copy.steps,
    videoTitle: locale === 'it' ? source['VideoTestimonials.text.0'] : copy.videoTitle,
    videos: getOfferTestimonials(campaign).map(video => {
      const title = locale === 'it' ? video.title : copy.videoTitles[video.videoId];
      if (!title?.trim()) throw new Error(`[home:${locale}:video:${video.videoId}] Missing translated title.`);
      return {...video,title};
    }),
  };
}
