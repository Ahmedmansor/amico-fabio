import {describe,it,expect} from 'vitest';
import {calculateTotal,bookingMessage,nextPax,validateBookingForm,type BookingState} from '../booking';
import {mapTrips} from '../../../tours/domain/tours';
import itText from '../../../tours/data/content/it.json';import enText from '../../../tours/data/content/en.json';
import {getSharedMessages} from '../../../../shared/i18n/shared';
import {fixtureRows} from '../../../../../qa/data/fixtures.mjs';
import {mapAddons} from '../addons';
import {legacyBooking} from './legacy-booking.mjs';
const records=mapTrips(fixtureRows('Trips_Prices'),{it:itText,en:enText},['it','en']);
const allAddonRows=fixtureRows('Trip_Addons').filter(row=>records.some(trip=>trip.id===row.trip_id));
const addons=mapAddons(allAddonRows,records.map(r=>r.id),['it','en']);
describe('real trip totals and bilingual WhatsApp parity',()=>{
 for(const trip of records)for(const locale of ['it','en'] as const)it(`${trip.id}/${locale}: counts, extras, total and full message match legacy`,()=>{
  const linked=addons.filter(a=>a.tripId===trip.id),prices={adult:trip.prices.adult,child:trip.prices.child,minPax:trip.minPax};
  for(const children of [0,2]){
   const state:BookingState={id:trip.id,title:trip.text[locale].title,kind:'trip',adults:trip.minPax,children,selectedAddons:linked.map(a=>a.id),formData:{name:'Mario & <Rossi> 👋',date:'2026-12-31',nation:'Italian'}};
   const legacy=legacyBooking(state,trip.source,linked,getSharedMessages(locale).global.whatsapp,locale);
   expect(calculateTotal(state,prices,linked)).toBe(legacy.amount);expect(bookingMessage(state,prices,linked,getSharedMessages(locale).global.whatsapp,locale)).toBe(legacy.message);
  }
 });
 it('charges every addon per traveler including children',()=>{expect(calculateTotal({adults:2,children:1,selectedAddons:['extra']},{adult:10,child:5,minPax:1},[{id:'extra',price:3,labels:{it:'Test',en:'Test'}}])).toBe(34);});
 it('retains explicitly zero prices and zero minimum and rejects unknown addons',()=>{expect(calculateTotal({adults:2,children:1,selectedAddons:[]},{adult:0,child:0,minPax:0},[])).toBe(0);expect(nextPax(0,-1,0)).toBe(0);expect(()=>calculateTotal({adults:1,children:0,selectedAddons:['unknown']},{adult:1,child:0,minPax:1},[])).toThrow(/Unknown selected addon/);});
 it('clamps traveler changes at the existing minimum and validates original required fields',()=>{expect(nextPax(1,-1,1)).toBe(1);expect(nextPax(1,1,1)).toBe(2);expect(validateBookingForm({name:' ',date:'',nation:''})).toEqual({name:true,date:true,nation:true});expect(validateBookingForm({name:'Mario',date:'2026-12-31',nation:'Italian'})).toEqual({name:false,date:false,nation:false});});
});
