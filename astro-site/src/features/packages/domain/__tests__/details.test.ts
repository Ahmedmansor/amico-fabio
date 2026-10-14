import {it,expect} from 'vitest';
import {mapPackages} from '../packages';import {validatePackageDetails} from '../details';
import {mapTrips} from '../../../tours/domain/tours';import {validateTourDetails} from '../../../tours/domain/details';
import itText from '../../data/content/it.json';import enText from '../../data/content/en.json';
import tripIt from '../../../tours/data/content/it.json';import tripEn from '../../../tours/data/content/en.json';
import {fixtureRows} from '../../../../../qa/data/fixtures.mjs';
import {calculateTotal,bookingMessage,type BookingState} from '../../../booking/domain/booking';
import {legacyBooking} from '../../../booking/domain/__tests__/legacy-booking.mjs';
import {getSharedMessages} from '../../../../shared/i18n/shared';
const trips=mapTrips(fixtureRows('Trips_Prices'),{it:tripIt,en:tripEn},['it','en']);
const packages=mapPackages(fixtureRows('Packages'),trips,{it:itText,en:enText},['it','en']);
const pages=trips.flatMap(trip=>['it','en'].map(locale=>validateTourDetails(trip,locale,[trip.poster],[trip.poster])));
it('validates all 14 bilingual packages and retains ordered or empty trip lists',()=>{for(const record of packages)for(const locale of ['it','en']){const page=validatePackageDetails(record,locale,[record.poster],[record.poster],pages);expect(page.included.map(item=>item.trip.id)).toEqual(record.includedTripIds);}});
it('rejects missing package content, images and unknown included trip links with context',()=>{const record=structuredClone(packages[0]);record.text.it.duration='';expect(()=>validatePackageDetails(record,'it',[record.poster],[record.poster],pages)).toThrow(/package:.*:it.*duration/);expect(()=>validatePackageDetails(packages[0],'en',[record.poster],[],pages)).toThrow(/package:.*gallery/);expect(()=>validatePackageDetails(packages[0],'it',[record.poster],[record.poster],[])).toThrow(/Unknown included trip/);});
for(const record of packages)for(const locale of ['it','en'] as const)it(`${record.id}/${locale}: package total and complete WhatsApp message match legacy`,()=>{
 for(const children of [0,2]){const state:BookingState={id:record.id,title:record.text[locale].title,kind:'package',adults:record.minPax,children,selectedAddons:[],formData:{name:'Mario & Rossi',date:'2026-12-31',nation:'Italian'}},prices={...record.prices,minPax:record.minPax},copy=getSharedMessages(locale).global.whatsapp;
 const legacy=legacyBooking(state,record.source,[],copy,locale);expect(calculateTotal(state,prices,[])).toBe(legacy.amount);expect(bookingMessage(state,prices,[],copy,locale)).toBe(legacy.message);}
});
