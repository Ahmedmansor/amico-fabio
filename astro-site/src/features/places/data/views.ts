import {catalogSlug} from "../../../shared/domain/catalog-routes";
import {getCollection,render,type CollectionEntry} from 'astro:content';
import {getTrips} from '../../tours/data/trips.mjs';
import {getPackages} from '../../packages/data/packages.mjs';
import {readingOutline} from '../../../shared/data/reading-outline';
import {placeUrl,placeAncestors,placeAlternates,type PlaceRecord} from '../domain/places';

export async function getPlaceViews(){
  const entries=await getCollection('places');
  const records=entries.map(entry=>({...entry.data,slug:entry.filePath!.replaceAll('\\','/').split('/').at(-2)!,sourcePath:entry.filePath!})) as PlaceRecord[];
  const [trips,packages]=entries.length?await Promise.all([getTrips(),getPackages()]):[[],[]];
  return entries.map((entry,index)=>{
    const place=records[index],alternates=placeAlternates(place,records);
    const products=[...place.relatedTripIds.map(id=>{const item=trips.find(t=>t.id===id);if(!item)throw new Error(`[places:${place.placeId}] Missing published tour ${id}`);return {kind:'tour' as const,id,title:item.text[place.lang].title,poster:item.poster,url:`/${place.lang}/tours/${catalogSlug(item,place.lang)}/`};}),
      ...place.relatedPackageIds.map(id=>{const item=packages.find(t=>t.id===id);if(!item)throw new Error(`[places:${place.placeId}] Missing published package ${id}`);return {kind:'package' as const,id,title:item.text[place.lang].title,poster:item.poster,url:`/${place.lang}/packages/${catalogSlug(item,place.lang)}/`};})];
    return {entry,place,hero:entry.data.heroImage,outline:readingOutline(entry.rendered?.html??''),ancestors:placeAncestors(place,records),
      children:records.filter(item=>item.lang===place.lang&&item.parentPlaceId===place.placeId),
      related:entries.filter((_item,i)=>records[i].lang===place.lang&&records[i].placeId!==place.placeId&&records[i].parentPlaceId===place.parentPlaceId).slice(0,3).map(item=>({title:item.data.title,url:placeUrl({...item.data,slug:item.filePath!.replaceAll('\\','/').split('/').at(-2)!}),image:item.data.heroImage})),
      products,alternates,navigation:Object.keys(alternates).length?alternates:{[place.lang]:placeUrl(place)},url:placeUrl(place)};
  });
}
export async function renderPlace(entry:CollectionEntry<'places'>){return render(entry);}
