import type {Offer} from '../../../shared/domain/offers';
import type {TripText} from '../domain/details';
const icon=(name:string)=>`<img src="/assets/images/icons/${name}.svg" alt="" class="price-icon-img">`;
export const headlinePrice=(trip:Offer)=>trip.prices.adult;
export function pricesHtml(trip:Offer,hero=false) {
 const color=hero?'text-gold':'text-white';
 return `<span class="inline-flex items-center gap-2">${icon('person-male')}<span class="${color} font-bold">€${trip.prices.adult}</span></span>`;
}
export function breakdownHtml(trip:Offer,label:string) {
 const adult=pricesHtml(trip);const child=trip.prices.child>0?`${icon('child-svgrepo')}<span class="text-white font-bold">€${trip.prices.child}</span>`:'';
 return `<div class="flex items-center gap-2">${adult}</div>${child?`<div class="flex items-center gap-2">${child}</div>`:''}<div class="flex items-center gap-2">${icon('persons')}<span class="text-gray-300">${label}: ${trip.minPax}</span></div>`;
}
export function listHtml(items:string[],compact=false,cross=false){return items.map(item=>`<li class="flex items-start leading-relaxed border-b border-gray-100 pb-2 last:border-0">${compact?cross?'<span class="text-gray-400 mr-3 font-bold">×</span>':'<span class="text-gold mr-3 font-bold">✓</span>':'<span class="text-gold mr-3 text-xl">•</span>'}<span class="${compact?'text-gray-600 text-sm':'text-white font-medium'}">${item}</span></li>`).join('');}
export function programHtml(steps:TripText['program']) {return steps.map((step,index)=>`<div class="flex gap-4 mb-6 last:mb-0 relative"><div class="flex flex-col items-center"><div class="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center font-bold text-sm shadow-lg z-10">${index+1}</div>${index!==steps.length-1?'<div class="w-0.5 h-full bg-gray-100 absolute top-8"></div>':''}</div><div class="pb-2">${step.time?`<div class="text-sm text-gray-500 mb-1">${step.time}</div>`:''}${step.activity?`<div class="text-white font-semibold mb-1">${step.activity}</div>`:''}<p class="text-gray-300 leading-relaxed">${step.details}</p></div></div>`).join('');}
