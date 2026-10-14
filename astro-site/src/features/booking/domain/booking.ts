export interface BookingPrices {adult:number;child:number;minPax:number}
export interface BookingAddon {id:string;price:number;labels:Record<string,string>}
export interface BookingState {id:string;title:string;kind:'trip'|'package';adults:number;children:number;selectedAddons:string[];formData:{name:string;date:string;nation:string}}
export function calculateTotal(state:Pick<BookingState,'adults'|'children'|'selectedAddons'>,prices:BookingPrices,addons:readonly BookingAddon[]) {
  const pax=state.adults+state.children;
  return state.adults*prices.adult+state.children*prices.child+state.selectedAddons.reduce((total,id)=>{const addon=addons.find(item=>item.id===id);if(!addon)throw new Error(`[booking] Unknown selected addon ${id}.`);return total+addon.price*pax;},0);
}
export function nextPax(current:number,change:number,min:number){return Math.max(min,current+change);}
export function validateBookingForm(form:BookingState['formData']) {return {name:!form.name.trim(),date:!form.date.trim(),nation:!form.nation.trim()};}
export function bookingMessage(state:BookingState,prices:BookingPrices,addons:readonly BookingAddon[],copy:Record<string,string>,locale:string) {
  const extras=state.selectedAddons.map(id=>{const addon=addons.find(item=>item.id===id);if(!addon)throw new Error(`[booking] Unknown selected addon ${id}.`);return addon.labels[locale];}).join(', ');
  const replacements:Record<string,string>={
    '{greeting}':copy.greeting.replace('{name}',state.formData.name),'{trip}':state.title,'{package}':state.title,
    '{date}':state.formData.date,'{nation}':state.formData.nation||'N/A','{guests}':`${state.adults} ${copy.adults_word}, ${state.children} ${copy.children_word}`,
    '{extras}':extras||'N/A','{total}':`€${calculateTotal(state,prices,addons)}`,
    '{check_availability}':state.kind==='package'?copy.package_check_availability:copy.check_availability,
    '{details_heading}':state.kind==='package'?copy.package_details_heading:copy.details_heading,
    ...Object.fromEntries(['trip_label','package_label','date_label','nation_label','guests_label','extras_label','total_label','waiting_confirmation'].map(key=>[`{${key}}`,copy[key]]))
  };
  let result=state.kind==='package'?copy.package_message:copy.full_message;
  for(const [key,value]of Object.entries(replacements))result=result.split(key).join(value);
  return result;
}
