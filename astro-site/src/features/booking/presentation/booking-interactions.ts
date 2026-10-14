import {calculateTotal,nextPax,validateBookingForm,bookingMessage,type BookingState,type BookingPrices,type BookingAddon} from '../domain/booking';
import {siteConfig} from '../../../shared/config/site';
const config=JSON.parse(document.getElementById('booking-config')!.textContent!) as {id:string;title:string;kind:BookingState['kind'];prices:BookingPrices;addons:BookingAddon[];locale:string;copy:Record<string,string>;errors:Record<string,string>;labels:Record<string,string>};
const state:BookingState={id:config.id,title:config.title,kind:config.kind,adults:config.prices.minPax,children:0,selectedAddons:[],formData:{name:'',date:'',nation:''}};
const form=document.getElementById('trip-booking-form')!;
const modal=document.getElementById('invoice-modal')!;
const field=(id:string)=>document.getElementById(`inp-${id}`) as HTMLInputElement;
function update(){document.getElementById('count-adults')!.textContent=String(state.adults);document.getElementById('count-children')!.textContent=String(state.children);document.getElementById('live-total-price')!.textContent=`€${calculateTotal(state,config.prices,config.addons)}`;}
form.querySelectorAll<HTMLElement>('[data-pax]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.pax as 'adults'|'children';state[type]=nextPax(state[type],Number(button.dataset.change),type==='adults'?config.prices.minPax:0);update();}));
form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{state.selectedAddons=input.checked?[...state.selectedAddons,input.value]:state.selectedAddons.filter(id=>id!==input.value);update();}));
const date=field('date');date.min=new Date().toISOString().split('T')[0];
if(typeof date.showPicker==='function')for(const event of ['click','focus'])date.addEventListener(event,()=>{try{date.showPicker();}catch{}});
const picker=document.getElementById('nation-picker')!,list=document.getElementById('nation-list')!;
const options=document.getElementById('country-options') as HTMLTemplateElement;list.appendChild(options.content.cloneNode(true));
picker.addEventListener('click',()=>list.classList.toggle('hidden'));
document.addEventListener('click',event=>{if(!(event.target as HTMLElement).closest('#nation-picker,#nation-list'))list.classList.add('hidden');});
list.querySelectorAll<HTMLButtonElement>('[data-nationality]').forEach(button=>button.addEventListener('click',()=>{field('nation').value=button.dataset.nationality!;const selected=document.getElementById('nation-selected')!;selected.replaceChildren(...Array.from(button.childNodes).map(node=>node.cloneNode(true)));selected.classList.add('text-white');list.classList.add('hidden');}));
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function invoice(){
 const l=config.labels;const row=(label:string,value:string)=>`<div class="flex justify-between"><span class="text-gray-400">${escape(label)}</span><span class="text-white">${escape(value)}</span></div>`;
 const extras=state.selectedAddons.map(id=>config.addons.find(addon=>addon.id===id)!);
 document.getElementById('invoice-content')!.innerHTML=`<div class="space-y-2"><div class="flex justify-between border-b border-gray-700 pb-2"><span class="text-gray-400">${escape(l.trip)}</span><span class="text-white font-bold text-right">${escape(state.title)}</span></div>${row(l.name,state.formData.name)}${row(l.nation,state.formData.nation)}${row(l.date,state.formData.date)}${row(l.pax,`${state.adults} ${l.adults}, ${state.children} ${l.children}`)}${extras.length?`<div class="border-t border-gray-700 pt-2 mt-2"><p class="text-gold text-xs uppercase mb-1">${l.extras}</p><ul class="list-disc pl-4 text-xs text-gray-400">${extras.map(addon=>`<li>+ ${escape(addon.labels[config.locale])} (€${addon.price})</li>`).join('')}</ul></div>`:''}<div class="flex justify-between items-center bg-gray-800 p-3 rounded mt-4"><span class="text-gold font-bold">${l.total}</span><span class="text-2xl text-white font-bold">€${calculateTotal(state,config.prices,config.addons)}</span></div></div>`;
 modal.classList.remove('hidden');
}
const submit=document.getElementById('btn-submit-booking') as HTMLButtonElement;
submit.addEventListener('click',()=>{
 state.formData={name:field('name').value.trim(),date:date.value.trim(),nation:field('nation').value.trim()};const errors=validateBookingForm(state.formData);
 for(const [name,error]of Object.entries(errors)){const target=name==='nation'?picker:field(name);const message=document.getElementById(`err-${name}`)!;message.textContent=error?(config.errors[`required_${name}`]||config.errors.required_field):'';message.classList.toggle('hidden',!error);target.classList.toggle('border-red-500',error);}
 submit.disabled=true;submit.classList.add('opacity-70');setTimeout(()=>{submit.disabled=false;submit.classList.remove('opacity-70');},1200);
 const first=Object.entries(errors).find(([,error])=>error);if(first){const target=first[0]==='nation'?picker:field(first[0]);target.focus();target.scrollIntoView({behavior:'smooth',block:'center'});return;}invoice();
});
document.getElementById('cancel-invoice')!.addEventListener('click',()=>modal.classList.add('hidden'));
document.getElementById('confirm-invoice')!.addEventListener('click',()=>{const message=bookingMessage(state,config.prices,config.addons,config.copy,config.locale);window.open(`https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');modal.classList.add('hidden');});
update();
