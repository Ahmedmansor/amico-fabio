import type {Package} from './packages';
import {validateTourDetails,type TourPage,type TripText} from '../../tours/domain/details.ts';
export interface PackagePage {package:Package;locale:string;text:TripText;gallery:string[];included:TourPage[]}
export function validatePackageDetails(record:Package,locale:string,gallery:string[],available:readonly string[],tours:readonly TourPage[]):PackagePage {
 let checked:TourPage;
 try {checked=validateTourDetails(record,locale,gallery,available);}catch(error){throw new Error(String((error as Error).message).replace('[tour:','[package:'));}
 const included=record.includedTripIds.map(id=>{const trip=tours.find(item=>item.trip.id===id&&item.locale===locale);if(!trip)throw new Error(`[package:${record.id}:${locale}] Unknown included trip ${id}.`);return trip;});
 return {package:record,locale,text:checked.text,gallery,included};
}
