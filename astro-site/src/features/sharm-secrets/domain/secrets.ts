export interface GuideCard { name?: string; title?: string; desc: string; img: string; extra_title?: string; extra_desc?: string }
export interface GalleryItem { cap: string; img: string }
export interface GuideContent {
  nav_index: string; nav_lang: string;
  page1: { headline:string; subtitle:string; content:string; hero_img:string; extra_title:string; extra_desc:string };
  page2: { headline:string; intro:string; services:GuideCard[] };
  page3: { headline:string; intro:string; rules:GuideCard[] };
  page4: { alert:string; list_title:string; intro:string; items:{title:string;desc:string;icon:string}[] };
  page5: { alert:string; highlight:string; body:string; closing:string; img:string };
  page6: { title:string; intro:string; items:GalleryItem[] };
}
export interface GuidePage { seo:{title:string;description:string}; labels:{closeIndex:string;closeGallery:string;heroAlt:string;farshaAlt:string;logoAlt:string}; content:GuideContent }
export function guideImageLinks(content:GuideContent): {key:string;src:string}[] {
  const links:{key:string;src:string}[]=[];
  function visit(value:unknown,key:string) {
    if(typeof value==='string'&&(key.endsWith('.img')||key.endsWith('.hero_img')))links.push({key,src:value});
    else if(value&&typeof value==='object')for(const [child,item]of Object.entries(value))visit(item,`${key}.${child}`);
  }
  visit(content,'secrets');return links;
}
export function guideIndex(content:GuideContent) {
  return [content.page1.headline,content.page2.headline,content.page3.headline,content.page4.list_title,content.page5.highlight,content.page6.title].map((label,index)=>({id:`page${index+1}`,label:`${index+1} · ${label}`}));
}
export function validateGuide(page:GuidePage,locale:string,availableImages:readonly string[]):GuidePage {
  function required(value:unknown,key:string) {
    if(typeof value==='string'){if(!value.trim())throw new Error(`[sharm-secrets:${locale}] Missing required text ${key}.`);}
    else if(Array.isArray(value)){if(!value.length)throw new Error(`[sharm-secrets:${locale}] Empty list ${key}.`);value.forEach((item,index)=>required(item,`${key}.${index}`));}
    else if(value&&typeof value==='object')for(const [child,item]of Object.entries(value))required(item,`${key}.${child}`);
    else throw new Error(`[sharm-secrets:${locale}] Invalid field ${key}.`);
  }
  function valueAt(path:string):unknown {return path.split('.').reduce<unknown>((value,key)=>value&&typeof value==='object'?(value as Record<string,unknown>)[key]:undefined,page);}
  for(const key of ['seo.title','seo.description',...['closeIndex','closeGallery','heroAlt','farshaAlt','logoAlt'].map(key=>`labels.${key}`),'content.nav_index','content.nav_lang',...['headline','subtitle','content','hero_img','extra_title','extra_desc'].map(key=>`content.page1.${key}`),...['headline','intro'].flatMap(key=>[`content.page2.${key}`,`content.page3.${key}`]),...['alert','list_title','intro'].map(key=>`content.page4.${key}`),...['alert','highlight','body','closing','img'].map(key=>`content.page5.${key}`),'content.page6.title','content.page6.intro'])required(valueAt(key),key);
  for(const [key,fields]of [['content.page2.services',['desc','img']],['content.page3.rules',['title','desc','img']],['content.page4.items',['title','desc','icon']],['content.page6.items',['cap','img']]] as const){
    const items=valueAt(key);
    if(!Array.isArray(items)||!items.length)throw new Error(`[sharm-secrets:${locale}] Missing required list ${key}.`);
    items.forEach((item,index)=>{for(const field of fields)required(item[field],`${key}.${index}.${field}`);if(key==='content.page2.services')required(item.title||item.name,`${key}.${index}.title/name`);});
  }
  required(page,'page');
  if(page.content.page3.rules.length!==10)throw new Error(`[sharm-secrets:${locale}] Expected 10 commandments.`);
  const images=new Set(availableImages);
  for(const {key,src}of guideImageLinks(page.content))if(!images.has(src))throw new Error(`[sharm-secrets:${locale}] Missing linked image ${key}: ${src}.`);
  return page;
}
export function validateGuideImageIdentity(expected:GuideContent,actual:GuideContent,locale:string):void {
  const original=guideImageLinks(expected),translated=guideImageLinks(actual);
  const mismatch=original.find((item,index)=>item.key!==translated[index]?.key||item.src!==translated[index]?.src);
  if(original.length!==translated.length||mismatch)throw new Error(`[sharm-secrets:${locale}] Unmatched translated image links: ${mismatch?.key||translated[original.length]?.key||'secrets.images'}.`);
}
export function gallerySelection(items:readonly GalleryItem[],index:number):GalleryItem {
  if(!Number.isInteger(index)||!items[index])throw new Error(`[sharm-secrets] Unknown gallery index ${index}.`);
  return items[index];
}
