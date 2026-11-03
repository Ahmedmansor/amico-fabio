export interface HomeJourney {
  whyTitle:string; why:{title:string;text:string}[];
  stepsTitle:string; steps:{title:string;text:string}[];
  videoTitle:string; videoIntro:string; videoLanguage:string; playVideo:string; closeVideo:string;
  videoConsent:string; manageVideoConsent:string; openOnVimeo:string; videoTitles:Record<string,string>;
  previousReview:string; nextReview:string; pauseReviews:string; resumeReviews:string; reviewControls:string; posterIntro:string;
}
export interface HomeContent {
  journey: HomeJourney;
  seo: { title: string; description: string };
  hero: { vip_title: string; vip_desc: string; vip_btn: string };
  global: { brand_title: string; vip_experiences: string; who_is_fabio_btn: string; who_is_fabio_content: string; discover: string; locations: { sharm: string; cairo: string; luxor_aswan: string } };
  reviews: { title: string; subtitle: string; facebook_btn: string; items: { name: string; date: string; text: string; rating: number; source: string }[] };
}
export function validateHome(content: HomeContent): HomeContent {
  const required = [content.seo.title, content.seo.description, content.hero.vip_title, content.hero.vip_desc, content.hero.vip_btn, content.global.brand_title, content.global.vip_experiences, content.global.who_is_fabio_btn, content.global.who_is_fabio_content, content.global.discover, ...Object.values(content.global.locations), content.reviews.title, content.reviews.subtitle, content.reviews.facebook_btn];
  if (required.some(value => typeof value !== 'string' || !value.trim())) throw new Error('[home] Missing required translated section content.');
  const journey=content.journey;
  if(!journey || journey.why?.length!==3 || journey.steps?.length!==4 || !journey.videoTitles ||
    [journey.whyTitle,journey.stepsTitle,journey.videoTitle,journey.videoIntro,journey.videoLanguage,journey.playVideo,journey.closeVideo,journey.videoConsent,journey.manageVideoConsent,journey.openOnVimeo,journey.previousReview,journey.nextReview,journey.pauseReviews,journey.resumeReviews,journey.reviewControls,journey.posterIntro,...Object.values(journey.videoTitles),...journey.why.flatMap(item=>[item.title,item.text]),...journey.steps.flatMap(item=>[item.title,item.text])].some(value=>typeof value!=='string'||!value.trim())) {
    throw new Error('[home] Missing required journey content.');
  }
  if (!content.reviews.items.length) throw new Error('[home] Missing reviews.');
  for (const review of content.reviews.items) {
    if (!review.name?.trim() || !review.text?.trim() || !review.date?.trim() || !Number.isFinite(review.rating)) throw new Error(`[home] Invalid review: ${review.name}.`);
  }
  return content;
}
// Same rating clamp as the legacy reviews renderer.
export function reviewRating(value: number): number { return Number.isFinite(value) ? Math.max(0, Math.min(5, Math.round(value))) : 0; }
