import type { HastPluginEntry } from 'satteri';
import {getMarkdownContext} from '../../data/markdown-context';
import {resolveEditorialReference} from '../../../../shared/domain/editorial-targets';

export function referencePlugin(readContext=getMarkdownContext):HastPluginEntry{return ({fileURL})=>{
  const context=readContext(fileURL);if(!context?.targets)return null;
  return {name:'fabio-editorial-references',element:{filter:['a'],visit(node){
    const href=node.properties.href;if(typeof href!=='string')return;
    let resolved:string;
    try{resolved=resolveEditorialReference(href,context.targets!,context.current.lang);}
    catch(error){throw new Error(`[editorial:${context.current.sourcePath}] ${(error as Error).message}`,{cause:error});}
    if(resolved!==href)return {...node,properties:{...node.properties,href:resolved}};
  }}};
};}
