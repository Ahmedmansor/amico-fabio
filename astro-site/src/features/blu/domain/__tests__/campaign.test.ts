import {describe,it,expect} from 'vitest';
import {buildBluMessage,buildBluWhatsApp,canEnhanceMotion,smoothFrameSample,validateCampaign} from '../campaign';
import {getBluCampaign} from '../../data/campaign';

describe('blu campaign',()=>{
 it('publishes matching IT/EN content and six stable experiences including Sandy',()=>{
  for(const locale of ['it','en']) {
   const campaign=getBluCampaign(locale);
   expect(campaign.experiences).toHaveLength(6);
   expect(new Set(campaign.experiences.map(item=>item.id)).size).toBe(6);
   expect(campaign.experiences.at(-1)?.id).toBe('sandy');
   expect(campaign.path).toBe(`/${locale}/blu/`);
  }
  expect(()=>getBluCampaign('es')).toThrow('not published');
 });
 it('fails required empty text and missing message associations',()=>{
  expect(()=>validateCampaign({...getBluCampaign('it').copy,heroTitle:''},'it')).toThrow('heroTitle');
  expect(()=>validateCampaign({...getBluCampaign('en').copy,waDefaultMsg:'Hi'},'en')).toThrow('passphrase');
 });
 it('encodes exact translated WhatsApp text and selected experience',()=>{
  const {copy}=getBluCampaign('it');
  const message=buildBluMessage(copy.waDefaultMsg,copy.selectedLabel,copy.card4Title);
  const url=new URL(buildBluWhatsApp('201063239261',message));
  expect(url.searchParams.get('text')).toBe(`${copy.waDefaultMsg}\n${copy.selectedLabel}: ${copy.card4Title}`);
  expect(buildBluMessage(copy.waDefaultMsg,copy.selectedLabel)).toBe(copy.waDefaultMsg);
  expect(()=>buildBluWhatsApp('fake',message)).toThrow('contact');
 });
 it('keeps reduced-motion/save-data and weak hardware lite independent of viewport',()=>{
  const strong={reducedMotion:false,saveData:false,cores:8,memory:8};
  expect(canEnhanceMotion('auto',strong)).toBe(true);
  expect(canEnhanceMotion('auto',{...strong,cores:2})).toBe(false);
  expect(canEnhanceMotion('auto',{...strong,memory:2})).toBe(false);
  expect(canEnhanceMotion('full',{...strong,reducedMotion:true})).toBe(false);
  expect(canEnhanceMotion('full',{...strong,saveData:true})).toBe(false);
  expect(canEnhanceMotion('lite',strong)).toBe(false);
  expect(canEnhanceMotion('auto',{reducedMotion:false,saveData:false})).toBe(true);
 });
 it('requires a smooth bounded sample and rejects sustained jank',()=>{
  expect(smoothFrameSample(Array(30).fill(16.7))).toBe(true);
  expect(smoothFrameSample(Array(30).fill(40))).toBe(false);
  expect(smoothFrameSample([16,17])).toBe(false);
  expect(smoothFrameSample([...Array(26).fill(16),...Array(4).fill(50)])).toBe(true);
 });
});
