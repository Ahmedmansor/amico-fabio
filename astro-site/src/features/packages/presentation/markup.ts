import type {TripText} from '../../tours/domain/details';
export {headlinePrice,pricesHtml,breakdownHtml} from '../../tours/presentation/markup';
export function listHtml(items:string[],bullet=false,iconType='') {
 const path=iconType==='check'?'M5 13l4 4L19 7':'M6 18L18 6M6 6l12 12';
 const icon=bullet&&iconType?`<svg class="w-4 h-4 text-${iconType==='check'?'green':'red'}-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"></path></svg>`:'';
 return items.map(item=>icon?`<li class="flex items-start gap-2">${icon}<span>${item}</span></li>`:`<li${!bullet?' style="list-style:none"':''}>${item}</li>`).join('');
}
export function programHtml(steps:TripText['program']){return steps.map(step=>`<div class="flex items-start gap-4 mb-4"><div class="text-gold font-bold min-w-[72px]">${step.time}</div><div><div class="text-white font-semibold">${step.activity}</div><div class="text-gray-400 text-sm">${step.details}</div></div></div>`).join('');}
export function modalProgramHtml(steps:TripText['program']){return steps.map(step=>`<div class="flex items-start gap-4"><div class="text-gold font-bold min-w-[70px] pt-1">${step.time}</div><div class="flex-1"><div class="text-white font-semibold text-base mb-1">${step.activity}</div><div class="text-gray-400 text-sm leading-relaxed">${step.details}</div></div></div>`).join('');}
