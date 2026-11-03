export interface OfferCampaign {
  id:string;locale:string;locales:string[];path:string;
  copy:Record<string,string>;images:Record<string,string>;requiredCopy:string[];
  seo:{title:string;description:string;keywords:string;ogTitle:string;ogDescription:string;twitterDescription:string};
  message:{heading:string;name:string;date:string;people:string;closing:string};
}
export function validateCampaign(campaign:OfferCampaign,languages:readonly string[],availableImages:readonly string[]) {
  const label=`[campaign:${campaign.id}]`;
  if(!campaign.id||!campaign.path.startsWith('/')||!campaign.path.endsWith('/'))throw new Error(`${label} Invalid id/path.`);
  if(!campaign.locales.length||new Set(campaign.locales).size!==campaign.locales.length)throw new Error(`${label} Empty/duplicate locales.`);
  if(!campaign.locales.includes(campaign.locale)||campaign.locales.some(locale=>!languages.includes(locale)))throw new Error(`${label} Unknown or unpublished locale ${campaign.locale}.`);
  for(const key of campaign.requiredCopy)if(!campaign.copy[key]?.trim())throw new Error(`${label} Missing required copy.${key}.`);
  for(const [key,value]of Object.entries({...campaign.seo,...campaign.message}))if(!value?.trim())throw new Error(`${label} Missing metadata/message field ${key}.`);
  for(const [key,src]of Object.entries(campaign.images))if(!availableImages.includes(src))throw new Error(`${label} Missing linked image images.${key}: ${src}.`);
  return campaign;
}
export function validateCampaignRoutes(campaigns:readonly Pick<OfferCampaign,'id'|'path'>[]) {
  const ids=new Set<string>(),paths=new Set<string>();
  for(const campaign of campaigns){if(ids.has(campaign.id)||paths.has(campaign.path))throw new Error(`[campaign:${campaign.id}] Duplicate id/path ${campaign.path}.`);ids.add(campaign.id);paths.add(campaign.path);}
}
export interface OfferInput {name:string;date:string;people:string}
export function validateOfferInput(input:OfferInput) {
  const name=input.name.trim(),people=parseInt(input.people,10);
  const errors={name:!name,date:!input.date,people:!people||people<1||people>30};
  return {name,date:input.date,people,errors,valid:!Object.values(errors).some(Boolean)};
}
export function offerMessage(input:OfferInput,copy:OfferCampaign['message']) {
  const checked=validateOfferInput(input);
  if(!checked.valid)throw new Error('[sharm-offer] Invalid lead fields.');
  const [year,month,day]=checked.date.split('-');
  return [copy.heading,'',`${copy.name} ${checked.name}`,`${copy.date} ${day}/${month}/${year}`,`${copy.people} ${checked.people}`,'',copy.closing].join('\n');
}
