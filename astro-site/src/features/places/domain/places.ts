import type { Locale } from '../../../shared/config/languages';
import type { BlogIndexRecord } from '../../blog/domain/validation';

export interface PlaceRecord extends BlogIndexRecord {
  placeId: string; kind: 'country'|'region'|'city'|'landmark'; parentPlaceId?: string;
  description: string; heroAlt:string;heroCaption?:string; relatedPackageIds: string[];
}
export const placeUrl = (place: Pick<PlaceRecord,'lang'|'slug'|'kind'>) => place.kind === 'country' ? `/${place.lang}/egypt/` : `/${place.lang}/egypt/${place.slug}/`;

export function validatePlaces(records: readonly PlaceRecord[]) {
  const byLocale = new Map<string,PlaceRecord>();
  for(const place of records){
    const key=`${place.lang}/${place.placeId}`;
    if(byLocale.has(key))throw new Error(`[places:${place.sourcePath}] Duplicate placeId ${key}.`);
    byLocale.set(key,place);
    if(place.kind==='country' && (place.placeId!=='egypt'||place.parentPlaceId))throw new Error(`[places:${place.sourcePath}] Egypt is the country root and cannot have a parent.`);
    if(place.kind!=='country'&&!place.parentPlaceId)throw new Error(`[places:${place.sourcePath}] A non-country guide requires parentPlaceId.`);
  }
  for(const place of records){
    const seen=new Set([place.placeId]);let next=place.parentPlaceId;
    while(next){
      const parent=byLocale.get(`${place.lang}/${next}`);
      if(!parent)throw new Error(`[places:${place.sourcePath}] Unknown same-language parentPlaceId ${next}.`);
      if(seen.has(next))throw new Error(`[places:${place.sourcePath}] Cyclic parentPlaceId ${next}.`);
      if(parent.kind==='landmark')throw new Error(`[places:${place.sourcePath}] A landmark cannot be a parent.`);
      seen.add(next);next=parent.parentPlaceId;
    }
  }
}

export function placeAncestors(place: PlaceRecord, published: readonly PlaceRecord[]): PlaceRecord[] {
  const result:PlaceRecord[]=[];let parent=place.parentPlaceId;
  while(parent){const record=published.find(item=>item.lang===place.lang&&item.placeId===parent);if(!record)throw new Error(`[places:${place.sourcePath}] Parent ${parent} is not published.`);result.unshift(record);parent=record.parentPlaceId;}
  return result;
}
export function placeAlternates(place: PlaceRecord, published: readonly PlaceRecord[]): Partial<Record<Locale,string>> {
  const equivalents=published.filter(item=>item.placeId===place.placeId);
  return equivalents.length>1?Object.fromEntries(equivalents.map(item=>[item.lang,placeUrl(item)])):{};
}
