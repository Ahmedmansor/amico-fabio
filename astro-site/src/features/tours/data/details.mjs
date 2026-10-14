import fs from 'node:fs';import {resolve} from 'node:path';
import {getTrips} from './trips.mjs';
import counts from './content/gallery-counts.json' with {type:'json'};
import {supportedLocales} from '../../../shared/config/languages.ts';
import {galleryPaths,validateTourDetails} from '../domain/details.ts';
export async function getTourPages() {
 const trips=await getTrips();
 return trips.flatMap(trip=>{const gallery=galleryPaths(trip,counts[trip.id]||0);const available=gallery.filter(src=>fs.existsSync(resolve(src.slice(1))));return supportedLocales.map(locale=>validateTourDetails(trip,locale,gallery,available));});
}
