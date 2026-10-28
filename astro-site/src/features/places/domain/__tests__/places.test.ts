import {expect,it} from 'vitest';
import {validatePlaces,placeAncestors,placeUrl,type PlaceRecord} from '../places';
import {validateTargets,resolveEditorialReference,automaticTargets,type EditorialTarget} from '../../../../shared/domain/editorial-targets';
const place=(placeId:string,kind:PlaceRecord['kind'],parentPlaceId?:string)=>({placeId,kind,parentPlaceId,lang:'en',slug:placeId,sourcePath:`en/${placeId}/index.md`}) as PlaceRecord;
it('validates a same-language hierarchy and resolves ordered ancestors',()=>{
  const root=place('egypt','country'),city=place('cairo','city','egypt'),site=place('giza-pyramids','landmark','cairo');
  expect(()=>validatePlaces([site,city,root])).not.toThrow();expect(placeAncestors(site,[root,site,city])).toEqual([root,city]);expect(placeUrl(root)).toBe('/en/egypt/');
});
it('rejects unknown, cyclic and landmark parents and duplicate place identities',()=>{
  expect(()=>validatePlaces([place('luxor','city','missing')])).toThrow('Unknown');
  expect(()=>validatePlaces([place('a','city','b'),place('b','city','a')])).toThrow('Cyclic');
  expect(()=>validatePlaces([place('a','landmark','b'),place('b','landmark','a')])).toThrow('landmark cannot');
  expect(()=>validatePlaces([place('egypt','country'),place('egypt','country')])).toThrow('Duplicate');
});
const target=(kind:EditorialTarget['kind'],id:string,aliases:string[]=[])=>({kind,id,lang:'en',title:id,url:`/en/${kind}/${id}/`,aliases,source:`${kind}/${id}`}) as EditorialTarget;
it('resolves all four explicit kinds using locale and stable IDs',()=>{
  const targets=['post','place','tour','package'].map(kind=>target(kind as EditorialTarget['kind'],'id'));
  for(const item of targets)expect(resolveEditorialReference(`${item.kind}:id`,targets,'en')).toBe(item.url);
  expect(()=>resolveEditorialReference('place:id',targets,'it')).toThrow('untranslated');
  expect(()=>resolveEditorialReference('tour:missing',targets,'en')).toThrow('Unknown');
  expect(resolveEditorialReference('/en/blog/ordinary/',targets,'en')).toBe('/en/blog/ordinary/');
});
it('rejects cross-kind ambiguous aliases with both owners, deduplicating aliases on one target',()=>{
  expect(()=>validateTargets([target('post','article',['Luxor']),target('place','luxor',[' luxor '])])).toThrow(/place\/luxor.*post\/article/);
  const targets=[target('place','luxor',['Luxor','LUXOR']),target('post','article',['article'])];
  expect(()=>validateTargets(targets)).not.toThrow();expect(automaticTargets(targets,{kind:'post',id:'article',lang:'en'})).toEqual([{id:'place:luxor',keyword:'luxor',url:'/en/place/luxor/'}]);
});
