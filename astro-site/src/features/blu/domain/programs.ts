import type {BluLocale} from './campaign';

export const bluProgramIds=['sharm_confidential','dolce_vita_family','mille_e_una_notte','indiana_jones_adventure'] as const;
interface ProgramSource {id:string;location:string;poster:string;text:Record<string,{title:string;short_desc:string;[field:string]:unknown}>}
export interface BluProgram {id:string;title:string;description:string;duration:string;poster:string;stops:{label:string;title:string;description:string}[]}

function text(value:unknown,context:string):string {
 if(typeof value!=='string'||!value.trim())throw new Error(`[blu:${context}] Missing required program text.`);
 if(/[€$£]|\bEUR\b/i.test(value))throw new Error(`[blu:${context}] Monetary amounts are excluded from this campaign.`);
 return value.trim();
}

/** Projects approved itinerary copy only; provider prices/source rows never enter the view. */
export function mapBluPrograms(records:readonly ProgramSource[],locale:BluLocale):BluProgram[]{
 return bluProgramIds.map(id=>{
  const matches=records.filter(record=>record.id===id);
  if(matches.length!==1)throw new Error(`[blu:${id}] Missing or duplicate published program.`);
  const record=matches[0],copy=record.text[locale];
  if(record.location!=='sharm')throw new Error(`[blu:${id}] Program location must be Sharm.`);
  if(!copy)throw new Error(`[blu:${id}:${locale}] Missing program translation.`);
  if(!record.poster.trim())throw new Error(`[blu:${id}] Missing program poster association.`);
  if(!Array.isArray(copy.program)||!copy.program.length)throw new Error(`[blu:${id}:${locale}:program] Missing itinerary.`);
  const stops=copy.program.map((value,index)=>{
   if(!value||typeof value!=='object')throw new Error(`[blu:${id}:${locale}:program.${index}] Invalid stop.`);
   const stop=value as Record<string,unknown>,context=`${id}:${locale}:program.${index}`;
   return {label:text(stop.time,`${context}.time`),title:text(stop.activity,`${context}.activity`),description:text(stop.details,`${context}.details`)};
  });
  return {id,title:text(copy.title,`${id}:${locale}:title`),description:text(copy.short_desc,`${id}:${locale}:short_desc`),duration:text(copy.duration,`${id}:${locale}:duration`),poster:record.poster,stops};
 });
}
