import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { getTrips } from '../../tours/data/trips.mjs';
import { getPackages } from '../../packages/data/packages.mjs';
import { supportedLocales, type Locale } from '../../../shared/config/languages';
import type { Offer } from '../../../shared/domain/offers';
import { buildEmailCatalog, type EmailCatalog, type EmailCatalogItem } from '../domain/catalog';

const posters=import.meta.glob<ImageMetadata>('/src/shared/assets/catalog/**/poster.webp',{eager:true,import:'default'});

/** Public published catalog only; never loads Auth, customer tables or mail secrets. */
export async function getEmailCatalog(origin: string,generatedAt: string,environment: EmailCatalog['environment']) {
  const [trips,packages]=await Promise.all([getTrips(),getPackages()]);
  async function map(offer: Offer,kind: EmailCatalogItem['kind']): Promise<EmailCatalogItem> {
    const poster=posters[offer.poster];
    if(!poster) throw new Error(`[email-catalog:${kind}:${offer.id}] Missing linked image ${offer.poster}.`);
    const width=Math.min(640,poster.width);
    const image=await getImage({src:poster,width,format:'jpeg'});
    return {kind,id:offer.id,slug:offer.slug,adult_price:offer.prices.adult,
      localized:Object.fromEntries(supportedLocales.map(locale=>[locale,{
        title:offer.text[locale].title,url:new URL(`/${locale}/${kind==='trip'?'tours':'packages'}/${offer.slug}/`,origin).href,
      }])) as Record<Locale,{title:string;url:string}>,
      image:{url:new URL(image.src,origin).href,width:Number(image.attributes.width),height:Number(image.attributes.height)},
    };
  }
  const items=await Promise.all([
    ...trips.map((item: Offer)=>map(item,'trip')),
    ...packages.map((item: Offer)=>map(item,'package')),
  ]);
  return buildEmailCatalog(items,origin,generatedAt,environment);
}
