import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { supportedLocales, type Locale } from '../../../shared/config/languages';
const id=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date=z.union([z.date(),z.iso.date(),z.iso.datetime({offset:true})]).transform(value=>value instanceof Date?value.toISOString():value);
export function placesSchema({image}:SchemaContext){return z.object({
  id,placeId:id,kind:z.enum(['country','region','city','landmark']),parentPlaceId:id.optional(),
  lang:z.enum(supportedLocales as [Locale,...Locale[]]),title:z.string().trim().min(5).max(140),description:z.string().trim().min(50).max(160),
  pubDate:date,updatedDate:date.optional(),authorId:id.optional(),
  heroImage:image(),heroAlt:z.string().trim().min(5),heroCaption:z.string().optional(),
  linkKeywords:z.array(z.string().trim().min(2)).default([]),relatedTripIds:z.array(z.string().min(1)).default([]),relatedPackageIds:z.array(z.string().min(1)).default([]),
  draft:z.boolean().default(false),fixture:z.boolean().default(false),
}).strict().superRefine((value,ctx)=>{
  if(!value.draft&&!value.fixture&&!value.authorId)ctx.addIssue({code:'custom',path:['authorId'],message:'A real guide requires an approved authorId.'});
  if(value.updatedDate&&Date.parse(value.updatedDate)<Date.parse(value.pubDate))ctx.addIssue({code:'custom',path:['updatedDate'],message:'updatedDate cannot precede pubDate.'});
  for(const field of ['relatedTripIds','relatedPackageIds'] as const)if(new Set(value[field]).size!==value[field].length)ctx.addIssue({code:'custom',path:[field],message:'Related IDs must be distinct.'});
});}
