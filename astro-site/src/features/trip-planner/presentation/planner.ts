import {validateTripRequest,plannerMessage,type TripRequest,type PlannerField} from '../domain/planner';
import {whatsappInquiryUrl} from '../../blog/domain/inquiry';
import type {getSharedMessages} from '../../../shared/i18n/shared';
import {trackPlannerInquiry} from '../../../shared/analytics/lead';

const config=document.getElementById('trip-planner-config');
const form=document.querySelector<HTMLFormElement>('[data-trip-planner]');
if(config&&form){
 const {m,locale,nationalities,number}=JSON.parse(config.textContent!) as {m:ReturnType<typeof getSharedMessages>['planner'];locale:string;nationalities:string[];number:string};
 const countries=new Set(nationalities),review=document.querySelector<HTMLElement>('[data-planner-review]')!;
 const submit=form.querySelector<HTMLButtonElement>('[type=submit]')!,summary=review.querySelector<HTMLElement>('[data-planner-summary]')!,status=form.querySelector<HTMLElement>('[data-planner-status]')!;
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement;
 const touched=new Set<string>();let preparedUrl='';
 function read():TripRequest{
  const data=new FormData(form!),text=(name:string)=>String(data.get(name)??''),count=(name:string)=>text(name).trim()?Number(text(name)):NaN;
  return {name:text('name'),email:text('email'),nationality:text('nationality'),phone:text('phone'),arrival:text('arrival'),departure:text('departure'),adults:count('adults'),children:count('children'),infants:count('infants'),budget:text('budget'),currency:text('currency') as TripRequest['currency'],startCity:text('startCity'),finishCity:text('finishCity'),places:data.getAll('places').map(String),details:text('details')};
 }
 function update(showAll=false){
  const input=read(),errors=validateTripRequest(input,today,countries);
  (field('arrival') as HTMLInputElement).min=today;(field('departure') as HTMLInputElement).min=input.arrival||today;
  form!.querySelectorAll<HTMLElement>('[data-planner-error]').forEach(node=>{
   const name=node.dataset.plannerError as PlannerField,code=errors[name],visible=!!code&&(showAll||touched.has(name));
   node.hidden=!visible;node.textContent=visible?m.errors[code!]:'';
   field(name).setAttribute('aria-invalid',visible?'true':'false');
  });
  const valid=Object.keys(errors).length===0&&form!.checkValidity();submit.disabled=!valid;
  const message=valid?m.ready:m.formHelp;if(status.textContent!==message)status.textContent=message;
  return {input,valid};
 }
 form.addEventListener('input',()=>{preparedUrl='';update();});
 form.addEventListener('change',event=>{if(event.target instanceof HTMLElement&&event.target.getAttribute('name'))touched.add(event.target.getAttribute('name')!);preparedUrl='';update();});
 form.addEventListener('focusout',event=>{if(event.target instanceof HTMLElement&&event.target.getAttribute('name')){touched.add(event.target.getAttribute('name')!);update();}});
 form.addEventListener('submit',event=>{
  event.preventDefault();const {input,valid}=update(true);if(!valid){form.querySelector<HTMLElement>('[aria-invalid=true]')?.focus();return;}
  const message=plannerMessage(input,m);preparedUrl=whatsappInquiryUrl(number,message);
  // Review text, not an href containing personal data: enhanced link analytics
  // must never see a prepared WhatsApp URL as link_url.
  summary.replaceChildren();for(const line of message.split('\n')){
   if(!line)continue;const row=document.createElement('div');row.textContent=line;summary.append(row);
  }
  form.hidden=true;review.hidden=false;review.focus();review.scrollIntoView({block:'start',behavior:'auto'});
 });
 review.querySelector('[data-planner-edit]')!.addEventListener('click',()=>{
  preparedUrl='';review.hidden=true;form.hidden=false;field('details').focus();
 });
 function handoff(sameTab=false){if(!preparedUrl)return;trackPlannerInquiry(locale);if(sameTab)location.assign(preparedUrl);else window.open(preparedUrl,'_blank','noopener,noreferrer');}
 review.querySelector('[data-planner-handoff]')!.addEventListener('click',()=>handoff());
 review.querySelector('[data-planner-fallback]')!.addEventListener('click',event=>{event.preventDefault();handoff(true);});
 update();
}
