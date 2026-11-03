import type {Offer,OfferText} from '../../../shared/domain/offers.ts';
export interface TripText extends OfferText {duration:string;highlights:string[];full_description:string;program:{time:string;activity:string;details:string}[];includes:string[];not_included:string[];important_notes:string;seo_tags:string[]}
export interface TourPage {trip:Offer;locale:string;text:TripText;gallery:string[]}
export function galleryPaths(trip:Offer,metadataCount:number) {
  const requested=parseInt(trip.source.img_count||'0',10);const count=requested>0?requested:metadataCount;
  return [trip.poster,...Array.from({length:Math.max(0,count-1)},(_,index)=>trip.poster.replace('poster.webp',`${index+1}.webp`))];
}
export function validateTourDetails(trip:Offer,locale:string,gallery:string[],availableImages:readonly string[]):TourPage {
 const text=trip.text[locale] as TripText,context=`[tour:${trip.id}:${locale}]`;
 for(const field of ['title','short_desc','duration','full_description','important_notes'] as const)if(typeof text[field]!=='string'||!text[field].trim())throw new Error(`${context} Missing required ${field}.`);
 for(const field of ['highlights','includes','not_included','program','seo_tags'] as const){if(!Array.isArray(text[field])||!text[field].length)throw new Error(`${context} Missing required ${field}.`);}
 for(const field of ['highlights','includes','not_included','seo_tags'] as const)text[field].forEach((value,index)=>{if(typeof value!=='string'||!value.trim())throw new Error(`${context} Missing ${field}.${index}.`);});
 text.program.forEach((step,index)=>{for(const field of ['time','activity','details'] as const)if(typeof step[field]!=='string'||!step[field].trim())throw new Error(`${context} Missing program.${index}.${field}.`);});
 gallery.forEach((src,index)=>{if(!availableImages.includes(src))throw new Error(`${context} Missing gallery.${index}: ${src}.`);});
 return {trip,locale,text,gallery};
}
