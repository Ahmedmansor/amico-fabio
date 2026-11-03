import {mkdir,access,writeFile,copyFile} from 'node:fs/promises';
import en from './demo-articles-en.mjs';
import it from './demo-articles-it.mjs';
const root=new URL('../../src/content/blog/',import.meta.url),art=new URL('../../src/features/blog/data/assets/',import.meta.url);
const sets={en,it};
for(const [lang,posts]of Object.entries(sets))for(const post of posts){try{await access(new URL(`${lang}/${post.slug}/index.md`,root));throw new Error(`Refusing to overwrite ${lang}/${post.slug}`);}catch(error){if(error.code!=='ENOENT')throw error;}}
for(const [lang,posts]of Object.entries(sets))for(const [index,post]of posts.entries()){
  const directory=new URL(`${lang}/${post.slug}/`,root);await mkdir(directory,{recursive:true});
  for(const [filename,source]of [['hero.webp',post.hero],['detail-1.webp',post.image1],['detail-2.webp',post.image2]])await copyFile(new URL(source==='hero'?'egypt-illustration.webp':`interests/${source}.webp`,art),new URL(filename,directory));
  const meta={id:`${lang}-demo-${post.slug}`,title:post.title,description:post.description,pubDate:`2026-10-${28-index}`,lang,...(post.destination?{destination:post.destination}:{}),interests:post.interests,heroImage:'./hero.webp',heroAlt:lang==='en'?'AI-generated editorial illustration for this travel story':'Illustrazione editoriale generata con IA per questo racconto di viaggio',heroCaption:lang==='en'?'Illustrative artwork for the design preview.':'Immagine illustrativa per l’anteprima di design.',linkKeywords:post.keywords,relatedTripIds:[],featured:post.featured??false,draft:false,fixture:true,demo:true,faq:post.faq??[]};
  const image=(number)=>lang==='en'?`![AI-generated editorial travel illustration](./detail-${number}.webp "A visual pause along the journey.")`:`![Illustrazione editoriale di viaggio generata con IA](./detail-${number}.webp "Una pausa visiva lungo il viaggio.")`;
  let body=post.body.replace('{{image1}}',image(1)).replace('{{image2}}',image(2));
  for(const other of posts)if(other.slug!==post.slug)body=body.replaceAll(other.title,`[${other.title}](post:${lang}-demo-${other.slug})`);
  await writeFile(new URL('index.md',directory),`---\n${Object.entries(meta).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${body}\n`);
}
console.log('Created 6 EN and 6 IT original design-preview articles; no translation equivalence or production publication.');
