import {it,expect} from 'vitest';
import {mapTrips} from '../tours';import {galleryPaths,validateTourDetails} from '../details';
import itText from '../../data/content/it.json';import enText from '../../data/content/en.json';import counts from '../../data/content/gallery-counts.json';import {fixtureRows} from '../../../../../qa/data/fixtures.mjs';
const trips=mapTrips(fixtureRows('Trips_Prices'),{it:itText,en:enText},['it','en']);
it('all 22 published tours have valid bilingual details and original gallery counts',()=>{for(const trip of trips){const gallery=galleryPaths(trip,(counts as Record<string,number>)[trip.id]);expect(gallery[0]).toBe(trip.poster);for(const locale of ['it','en'])expect(validateTourDetails(trip,locale,gallery,gallery).text.title).toBe(trip.text[locale].title);}});
it('missing content and gallery links identify the trip, language and field',()=>{const trip=structuredClone(trips[0]);trip.text.it.duration='';expect(()=>validateTourDetails(trip,'it',[trip.poster],[trip.poster])).toThrow(/tour:ras_mohammed_white_island_vip:it.*duration/);expect(()=>validateTourDetails(trips[0],'en',[trip.poster],[])).toThrow(/gallery.0/);});
