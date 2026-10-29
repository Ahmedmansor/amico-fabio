export interface OfferTestimonial {
  videoId: string;
  title: string;
  image: string;
}

export function validateTestimonials(items: OfferTestimonial[]): OfferTestimonial[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (!/^\d+$/.test(item.videoId) || !item.title?.trim() || !item.image?.trim()) {
      throw new Error(`[sharm-offer:video:${item.videoId}] Missing title/image or invalid Vimeo ID.`);
    }
    if (seen.has(item.videoId)) throw new Error(`[sharm-offer:video:${item.videoId}] Duplicate Vimeo ID.`);
    seen.add(item.videoId);
  }
  if (!items.length) throw new Error('[sharm-offer:videos] Missing testimonials.');
  return items;
}
