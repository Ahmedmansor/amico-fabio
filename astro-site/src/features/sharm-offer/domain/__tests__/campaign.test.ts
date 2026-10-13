import {describe,it,expect} from 'vitest';
import campaign from '../../data/content/it.json';
import {validateCampaign,validateCampaignRoutes,validateOfferInput,offerMessage} from '../campaign';
import {legacyForm} from './legacy-form.mjs';
describe('Italian campaign publication and required source content',()=>{
 it('publishes only the approved Italian route',()=>{expect(validateCampaign(campaign,['it','en'],Object.values(campaign.images))).toBe(campaign);expect(campaign.locales).toEqual(['it']);expect(campaign.path).toBe('/offerta-sharm/');});
 it('rejects missing copy and linked images with campaign/field context',()=>{const bad=structuredClone(campaign);delete (bad.copy as Record<string,string>)[bad.requiredCopy[0]];expect(()=>validateCampaign(bad,['it','en'],Object.values(bad.images))).toThrow(/offerta-sharm.*copy\./);expect(()=>validateCampaign(campaign,['it','en'],[])).toThrow(/images\./);});
 it('rejects unpublished/unknown languages and duplicate campaign identities/routes',()=>{expect(()=>validateCampaign({...campaign,locale:'en'},['it','en'],Object.values(campaign.images))).toThrow(/locale/);expect(()=>validateCampaignRoutes([campaign,campaign])).toThrow(/Duplicate/);expect(()=>validateCampaignRoutes([campaign,{id:'other',path:campaign.path}])).toThrow(/Duplicate/);});
});
describe('legacy form business behavior and WhatsApp messages',()=>{
 for(const people of ['1','2','30','2.9'])it(`preserves the legacy result for travelers=${people}`,()=>{
  const input={name:'  Mario & Rossi 👋  ',date:'2026-12-31',people};const legacy=legacyForm(input);
  expect(validateOfferInput(input).valid).toBe(true);expect(offerMessage(input,campaign.message)).toBe(new URL(legacy.url!).searchParams.get('text'));
  expect(legacy.events).toEqual([['event','generate_lead',{currency:'EUR',value:1,event_category:'Booking',event_label:'WhatsApp_Sharm_Offer'}]]);
 });
 for(const input of [{name:' ',date:'2026-12-31',people:'2'},{name:'Mario',date:'',people:'2'},{name:'Mario',date:'2026-12-31',people:'0'},{name:'Mario',date:'2026-12-31',people:'31'},{name:'Mario',date:'2026-12-31',people:'abc'}])it(`rejects ${JSON.stringify(input)} exactly like legacy`,()=>{expect(validateOfferInput(input).valid).toBe(false);expect(legacyForm(input).url).toBeUndefined();expect(()=>offerMessage(input,campaign.message)).toThrow(/Invalid lead/);});
});
