import {getTrips} from '../../tours/data/trips.mjs';
import type {BluLocale} from '../domain/campaign';
// Existing, published catalog associations. Never expose prices in this campaign.
const relatedIds=['ras_mohammed_bus_half_day','ras_mohammed_white_island_vip','super_safari_5_senses'] as const;
export async function getBluRelatedTrips(locale: BluLocale) {
  const trips=await getTrips();
  return relatedIds.map(id=>{
    const trip=trips.find(record=>record.id===id);
    if(!trip) throw new Error(`[blu:${id}] Required related trip is missing or unpublished.`);
    if(trip.location!=='sharm') throw new Error(`[blu:${id}] Related trip must belong to Sharm.`);
    return {id:trip.id,title:trip.text[locale].title,poster:trip.poster};
  });
}
export type BluRelatedTrip=Awaited<ReturnType<typeof getBluRelatedTrips>>[number];
