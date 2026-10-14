export interface NotFoundText {title:string;description:string;home:string;tours:string}
export function validateNotFound(text:NotFoundText,locale:string):NotFoundText {
 for(const key of ['title','description','home','tours'] as const)if(typeof text[key]!=='string'||!text[key].trim())throw new Error(`[404:${locale}] Missing ${key}.`);
 return text;
}
