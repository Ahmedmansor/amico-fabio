import {getImage} from 'astro:assets';
import type {ImageMetadata} from 'astro';
export interface ShareImage {src:string;width:number;height:number;type:string;alt:string}
export async function getShareImage(poster:ImageMetadata,alt:string):Promise<ShareImage>{
 if(!poster||!alt.trim())throw new Error('[SEO] Missing poster or localized share image description.');
 const result=await getImage({src:poster,width:Math.min(1200,poster.width),format:'jpeg'});
 return {src:result.src,width:Number(result.attributes.width),height:Number(result.attributes.height),type:'image/jpeg',alt};
}
