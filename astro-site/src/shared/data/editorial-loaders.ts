import {catalogPath} from "../domain/catalog-routes";
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob, type Loader, type LoaderContext } from 'astro/loaders';
import { articlePathParts, validatePostIndex, getAutomaticLinkPhrases, type BlogIndexRecord } from '../../features/blog/domain/validation';
import { isPublished } from '../../features/blog/domain/publication';
import type { PublicationPolicy } from '../../features/blog/domain/models';
import { authors } from '../../features/blog/data/authors';
import { placeUrl, validatePlaces, placeAncestors, type PlaceRecord } from '../../features/places/domain/places';
import { validateTargets, type EditorialTarget } from '../domain/editorial-targets';
import { supportedLocales } from '../config/languages';

/** Two native collections share one complete metadata pass before either renders. */
export function editorialLoaders(policy:PublicationPolicy):{blog:Loader;places:Loader}{
  type Name='blog'|'places';
  const contexts=new Map<Name,LoaderContext>();
  const ready=new Set<Name>();let queued=Promise.resolve();
  let refreshTimer:ReturnType<typeof setTimeout>|undefined;
  const metadataPasses=new Map<Name,()=>Promise<void>>();
  function snapshot(context:LoaderContext,path:string,value:unknown){const file=new URL(`.astro/${path}/index.json`,context.config.root);mkdirSync(dirname(fileURLToPath(file)),{recursive:true});writeFileSync(file,JSON.stringify(value));}
  function records(name:Name){const context=contexts.get(name)!;const base=new URL(`src/content/${name}/`,context.config.root);
    return context.store.values().map(entry=>{const path=articlePathParts(decodeURIComponent(new URL(entry.filePath!,context.config.root).pathname.slice(base.pathname.length)));return {...entry.data,...path,id:entry.id,sourcePath:`${path.lang}/${path.slug}/index.md`};}).sort((a,b)=>a.sourcePath.localeCompare(b.sourcePath));}
  async function finish(){
    const posts=records('blog') as BlogIndexRecord[],places=records('places') as PlaceRecord[];
    const {getTrips}=await import('../../features/tours/data/trips.mjs');
    const {getPackages}=await import('../../features/packages/data/packages.mjs');
    // One build-time read through each owning interface; the catalog provider caches reads.
    const [trips,packages]=await Promise.all([getTrips(),getPackages()]);
    const references={authorIds:new Set(Object.keys(authors)),tripIds:new Set<string>(trips.map(t=>t.id))};
    validatePostIndex(posts,policy,references);validatePostIndex(places,policy,references);validatePlaces(places);
    for(const place of places)for(const id of place.relatedPackageIds)if(!packages.some(item=>item.id===id))throw new Error(`[places:${place.sourcePath}] Unknown or unpublished relatedPackageIds ${id}.`);
    const publishedPlaces=places.filter(place=>isPublished(place,policy));
    for(const place of publishedPlaces)placeAncestors(place,publishedPlaces);
    const targets:EditorialTarget[]=[
      ...posts.filter(post=>isPublished(post,policy)).map(post=>({kind:'post' as const,id:post.id,lang:post.lang,title:post.title,url:`/${post.lang}/blog/${post.slug}/`,aliases:getAutomaticLinkPhrases(post),source:`blog/${post.sourcePath}`})),
      ...publishedPlaces.map(place=>({kind:'place' as const,id:place.placeId,lang:place.lang,title:place.title,url:placeUrl(place),aliases:[place.title,...place.linkKeywords],source:`places/${place.sourcePath}`})),
      ...supportedLocales.flatMap(lang=>[
        ...trips.map(trip=>({kind:'tour' as const,id:trip.id,lang,title:trip.text[lang].title,url:catalogPath(trip,lang,'tours'),aliases:[],source:`catalog tour:${trip.id}`})),
        ...packages.map(item=>({kind:'package' as const,id:item.id,lang,title:item.text[lang].title,url:catalogPath(item,lang,'packages'),aliases:[],source:`catalog package:${item.id}`})),
      ]),
    ];validateTargets(targets);
    const context=contexts.get('blog')!;
    snapshot(context,'blog',{policy,records:posts});snapshot(context,'places',{policy,records:places.map(place=>({...place,route:placeUrl(place)}))});
    snapshot(context,'editorial',{policy,targets,blog:posts,places});
    for(const name of ['blog','places'] as const){const ctx=contexts.get(name)!;const index=name==='blog'?posts:places;
      for(const entry of ctx.store.values()){
        const record=index.find(record=>record.id===entry.id)!;
        if(!isPublished(record,policy)){ctx.store.delete(entry.id);continue;}
        const rendered=await ctx.renderMarkdown(entry.body??'',{fileURL:new URL(entry.filePath!,ctx.config.root)});
        const {deferredRender:_,...metadata}=entry;
        ctx.store.set({...metadata,rendered,assetImports:[...new Set([...(entry.assetImports??[]),...(rendered.metadata?.imagePaths??[])])],digest:ctx.generateDigest({body:entry.body,html:rendered.html})});
      }
    }
  }
  function loader(name:Name):Loader{return {name:`fabio-editorial-${name}`,async load(context){
    contexts.set(name,context);const base=new URL(`src/content/${name}/`,context.config.root);
    const identity=new Map<string,string>();
    const native=glob({base,pattern:'**/index.md',deferRender:true,generateId({entry,data}){
      const path=articlePathParts(entry);if(data.lang!==path.lang)throw new Error(`[${name}:${entry}] lang must match directory.`);
      const id=String(data.id??'');if(!id)throw new Error(`[${name}:${entry}] Missing id.`);
      const previous=identity.get(id);if(previous&&previous!==entry)throw new Error(`[${name}:${entry}] Duplicate id ${id}; already owned by ${previous}.`);
      identity.set(id,entry);return id;
    }});
    async function metadata(){identity.clear();await native.load({...context,watcher:undefined});}
    metadataPasses.set(name,metadata);
    await metadata();ready.add(name);
    if(ready.size===2)await finish();
    if(context.watcher){context.watcher.add(fileURLToPath(base));
      const refresh=(path:string)=>{if(!path.replaceAll('\\','/').startsWith(fileURLToPath(base).replaceAll('\\','/'))||!path.endsWith('index.md'))return;
        clearTimeout(refreshTimer);
        refreshTimer=setTimeout(()=>{queued=queued.then(async()=>{for(const collection of ['blog','places'] as const)await metadataPasses.get(collection)!();await finish();}).catch(error=>{context.logger.error(`[editorial] ${error.message}`);});},100);
      };
      for(const event of ['add','change','unlink'])context.watcher.on(event,refresh);
    }
  }};}
  return {blog:loader('blog'),places:loader('places')};
}
