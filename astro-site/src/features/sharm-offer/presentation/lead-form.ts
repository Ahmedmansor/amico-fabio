import {offerMessage,validateOfferInput,type OfferCampaign} from '../domain/campaign';
import {siteConfig} from '../../../shared/config/site';
import {trackOfferLead} from '../../../shared/analytics/lead';
const form=document.getElementById('lsh-booking-form') as HTMLFormElement;
const message:OfferCampaign['message']=JSON.parse(document.getElementById('offer-message')!.textContent!);
form.addEventListener('submit',event=>{
 event.preventDefault();
 const values={name:(document.getElementById('lsh-name') as HTMLInputElement).value,date:(document.getElementById('lsh-date') as HTMLInputElement).value,people:(document.getElementById('lsh-people') as HTMLInputElement).value};
 const result=validateOfferInput(values);
 for(const [field,error]of Object.entries(result.errors))document.getElementById(`lsh-${field}-error`)!.classList.toggle('visible',error);
 if(!result.valid)return;
 const url=`https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(offerMessage(values,message))}`;
 trackOfferLead();window.open(url,'_blank','noopener,noreferrer');
});
