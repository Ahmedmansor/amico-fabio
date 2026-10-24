import { isLocale, type Locale } from '../../../shared/config/languages.ts';
import { favoriteKey, favoriteIdentity } from '../../wishlist/domain/wishlist.ts';
import { validateEmailCatalog, type EmailCatalogItem, type EmailCatalog } from './catalog.ts';

export type WishlistEmailKind='summary'|'reminder';
export interface WishlistEmailModel {
  locale: Locale;
  kind: WishlistEmailKind;
  origin: string;
  items: {kind:EmailCatalogItem['kind'];title:string;url:string;price:number;image:EmailCatalogItem['image']}[];
  remainingCount: number;
  wishlistUrl: string;
  privacyUrl: string;
  unsubscribeUrl: string | null;
}
export interface EmailCopy {
  summarySubject:string;reminderSubject:string;summaryTitle:string;reminderTitle:string;
  summaryIntro:string;reminderIntro:string;tours:string;packages:string;priceFrom:string;
  discover:string;viewFavorites:string;moreItems:string;summaryReason:string;reminderReason:string;
  unsubscribe:string;privacy:string;catalogNote:string;previewOnly:string;
}

/** No scheduling, consent assumptions or provider access: caller supplies context. */
export function prepareWishlistEmail(input: {
  catalog: unknown; expectedEnvironment: EmailCatalog['environment']; ids: readonly string[];
  locale: Locale; kind: WishlistEmailKind; cardLimit: number; unsubscribeUrl?: string;
}): {model: WishlistEmailModel|null;unavailableKeys:string[]} {
  const catalog=validateEmailCatalog(input.catalog);
  if(catalog.environment!==input.expectedEnvironment) throw new Error('[wishlist-email] Manifest environment mismatch.');
  if(!isLocale(input.locale) || !['summary','reminder'].includes(input.kind)) throw new Error('[wishlist-email] Invalid language or message kind.');
  if(!Number.isSafeInteger(input.cardLimit) || input.cardLimit<1) throw new Error('[wishlist-email] Explicit positive card limit required.');
  const keys=[...new Set(input.ids.map(key=>{const item=favoriteIdentity(key);return favoriteKey(item.kind,item.id);} ))];
  const byKey=new Map(catalog.items.map(item=>[favoriteKey(item.kind,item.id),item]));
  const unavailableKeys=keys.filter(key=>!byKey.has(key));
  const eligible=keys.flatMap(key=>{const item=byKey.get(key);return item?[item]:[];});
  if(!eligible.length)return {model:null,unavailableKeys};
  let unsubscribeUrl: string|null=null;
  if(input.kind==='reminder'){
    if(!input.unsubscribeUrl) throw new Error('[wishlist-email] Reminder requires an unsubscribe URL.');
    const url=new URL(input.unsubscribeUrl);
    if(url.origin!==catalog.origin || url.username || url.password || url.hash)
      throw new Error('[wishlist-email] Unsubscribe URL must use the approved site origin.');
    unsubscribeUrl=url.href;
  }
  const items=eligible.slice(0,input.cardLimit).map(item=>({kind:item.kind,
    title:item.localized[input.locale].title,url:item.localized[input.locale].url,
    price:item.adult_price,image:{...item.image},
  }));
  return {model:{locale:input.locale,kind:input.kind,origin:catalog.origin,items,
    remainingCount:eligible.length-items.length,
    wishlistUrl:new URL(`/${input.locale}/wishlist/`,catalog.origin).href,
    privacyUrl:new URL(`/${input.locale}/legal/`,catalog.origin).href,unsubscribeUrl,
  },unavailableKeys};
}
