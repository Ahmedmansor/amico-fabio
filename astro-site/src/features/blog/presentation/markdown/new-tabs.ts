import {htmlToHast,type HastPluginEntry} from 'satteri';
import {getMarkdownContext} from '../../data/markdown-context';
const webLink=(href:unknown):href is string=>typeof href==='string'&&!!href&&!href.startsWith('#')&&!/^(?:mailto|tel|javascript|data):/i.test(href);

/** Reading links preserve the current article; same-page reading anchors do not. */
export function newTabPlugin(readContext=getMarkdownContext):HastPluginEntry{return ({fileURL})=>{
  if(!readContext(fileURL))return null;
  return {name:'fabio-editorial-new-tabs',element:{filter:['a'],visit(node){
    if(webLink(node.properties.href))return {...node,properties:{...node.properties,target:'_blank',rel:['noopener','noreferrer']}};
  }},raw(node){
    if(/<(?:script|style)\b/i.test(node.value))return;
    const value=node.value.replace(/<a\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi,tag=>{
      const root=htmlToHast(tag,{fragment:true});
      const anchor=root.type==='root'?root.children.find(child=>child.type==='element'&&child.tagName==='a'):undefined;
      if(anchor?.type!=='element'||!webLink(anchor.properties.href))return tag;
      return tag.replace(/\s+(?:target|rel)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/>$/,' target="_blank" rel="noopener noreferrer">');
    });
    if(value!==node.value)return {...node,value};
  }};
};}
