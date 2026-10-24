import { describe,it,expect } from 'vitest';
import { buildEmailCatalog,validateEmailCatalog,type EmailCatalogItem } from '../catalog';
const origin='https://preview.example.test';
function item(kind: EmailCatalogItem['kind']='trip'): EmailCatalogItem {
  const route=kind==='trip'?'tours':'packages';
  return {kind,id:'stable_id',slug:'public-slug',adult_price:0,
    localized:{it:{title:'Titolo',url:`${origin}/it/${route}/public-slug/`},en:{title:'Title',url:`${origin}/en/${route}/public-slug/`}},
    image:{url:`${origin}/_astro/poster.jpg`,width:640,height:400}};
}
const build=(items: EmailCatalogItem[])=>buildEmailCatalog(items,origin,'2026-10-24T00:00:00Z','test');
describe('published email catalog contract',()=>{
  it('keeps explicit free prices, language equivalents and kind-specific identity',()=>{
    const manifest=build([item(),item('package')]);
    expect(manifest.items).toHaveLength(2);expect(manifest.items[0].adult_price).toBe(0);
    expect(manifest.environment).toBe('test');expect(manifest.currency).toBe('EUR');
  });
  it('rejects duplicate IDs/slugs within the same kind',()=>{
    expect(()=>build([item(),item()])).toThrow(/Duplicate/);
    expect(()=>build([item(),{...item(),id:'another'}])).toThrow(/Duplicate/);
  });
  it('rejects missing translations and modified or external page URLs',()=>{
    for(const title of ['',undefined]){const entry=item();entry.localized.en.title=title as string;expect(()=>build([entry])).toThrow(/title/);}
    const entry=item();entry.localized.en.url='https://other.test/en/tours/public-slug/';expect(()=>build([entry])).toThrow(/URL/);
  });
  it('rejects invalid prices rather than falling back to invented amounts',()=>{
    for(const adult_price of [-1,NaN,Infinity,'10',undefined]) expect(()=>build([{...item(),adult_price:adult_price as number}])).toThrow(/adult_price/);
  });
  it('rejects mismatched image origins and missing dimensions',()=>{
    expect(()=>build([{...item(),image:{...item().image,url:'https://other.test/poster.jpg'}}])).toThrow(/origin/);
    expect(()=>build([{...item(),image:{...item().image,height:0}}])).toThrow(/dimensions/);
  });
  it('rejects unsupported versions, unsafe origins, missing timestamp and malformed data',()=>{
    expect(()=>validateEmailCatalog({...build([]),schema_version:2})).toThrow(/contract/);
    expect(()=>buildEmailCatalog([], 'http://public.test', '2026-10-24','test')).toThrow(/HTTPS/);
    expect(()=>buildEmailCatalog([],origin,'bad-date','test')).toThrow(/generated_at/);
    expect(()=>validateEmailCatalog(null)).toThrow(/manifest/);
  });
});
