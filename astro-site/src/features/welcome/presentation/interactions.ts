import {catalogMessage,successfulSubmission,type WelcomeCampaign} from '../domain/welcome';
import {siteConfig} from '../../../shared/config/site';
import {trackCatalogLead} from '../../../shared/analytics/lead';
const campaign=JSON.parse(document.getElementById('welcome-config')!.textContent!) as WelcomeCampaign;
const form=document.getElementById('contactForm') as HTMLFormElement,button=document.getElementById('submitBtn') as HTMLButtonElement,label=button.querySelector('span')!,original=label.textContent;
form.addEventListener('submit',async event=>{
 event.preventDefault();if(button.disabled||!form.reportValidity())return;
 button.disabled=true;label.textContent=campaign.pending;button.classList.remove('animate-pulse-btn');button.classList.add('opacity-75','cursor-not-allowed');
 const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),20000);
 try {
  const response=await fetch(campaign.scriptUrl,{method:'POST',body:new FormData(form),signal:controller.signal});
  const result=await response.json();
  if(!successfulSubmission(response.ok,result))throw new Error('Submission unsuccessful');
  trackCatalogLead();
  const name=(form.elements.namedItem('Name') as HTMLInputElement).value;
  location.href=`https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(catalogMessage(name,campaign.message))}`;
 }catch{
  alert(campaign.error);button.disabled=false;label.textContent=original;button.classList.add('animate-pulse-btn');button.classList.remove('opacity-75','cursor-not-allowed');
 }finally{clearTimeout(timeout);}
});
