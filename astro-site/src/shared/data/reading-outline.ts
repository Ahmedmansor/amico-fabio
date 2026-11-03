import {htmlToHast} from 'satteri';
export interface ReadingHeading {depth:number;slug:string;text:string}
interface Node {type:string;tagName?:string;value?:string;properties?:Record<string,unknown>;children?:Node[]}
export function readingOutline(html:string):ReadingHeading[]{
  const result:ReadingHeading[]=[],ids=new Set<string>();
  const text=(node:Node):string=>node.type==='text'?node.value??'':(node.children??[]).map(text).join('');
  function visit(node:Node,excluded=false){
    const properties=node.properties??{};
    excluded ||= Object.hasOwn(properties,'dataNoAutolink')||Object.hasOwn(properties,'data-no-autolink');
    if(!excluded&&(node.tagName==='h2'||node.tagName==='h3')){
      const slug=String(properties.id??'');if(!slug||ids.has(slug))throw new Error(`[editorial] Missing or duplicate reading anchor: ${slug}.`);
      ids.add(slug);result.push({depth:Number(node.tagName[1]),slug,text:text(node)});
    }
    for(const child of node.children??[])visit(child,excluded);
  }
  visit(htmlToHast(html) as Node);return result;
}
