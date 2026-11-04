import {describe,it,expect} from 'vitest';
import {catalogSlug,catalogPath,catalogAlternates,validateCatalogRoutes,catalogSection,catalogAliases} from '../catalog-routes';
const record={id:'stable-id',slug:'legacy_id',text:{it:{title:'Titolo',route_slug:'titolo-italiano'},en:{title:'Title',route_slug:'english-title'}}};
describe('localized catalog identity and routes',()=>{
  it('keeps stable IDs and legacy slugs independent from titles and languages',()=>{
    expect(catalogPath(record,'it','tours')).toBe('/it/escursioni/titolo-italiano/');
    expect(catalogPath(record,'en','packages')).toBe('/en/packages/english-title/');
    expect(catalogSlug({...record,text:{...record.text,it:{...record.text.it,title:'Edited title'}}},'it')).toBe('titolo-italiano');
    expect(record.id).toBe('stable-id');expect(record.slug).toBe('legacy_id');
    expect(catalogAlternates(record,['it','en'],'tours')).toEqual({it:'/it/escursioni/titolo-italiano/',en:'/en/tours/english-title/'});
  });
  it('localizes both sections and preserves both previous URL forms without self-redirects',()=>{
    for(const [locale,tours,packages] of [['it','escursioni','pacchetti'],['en','tours','packages'],['es','excursiones','paquetes'],['pt','excursoes','pacotes'],['de','ausfluege','reisepakete']]){
      expect(catalogSection(locale,'tours')).toBe(tours);expect(catalogSection(locale,'packages')).toBe(packages);
    }
    expect(catalogAliases(record,'it','tours')).toEqual(['/it/tours/legacy_id/','/it/tours/titolo-italiano/']);
    expect(catalogAliases(record,'en','tours')).toEqual(['/en/tours/legacy_id/']);
    expect(()=>catalogSection('unknown','tours')).toThrow(/Unsupported locale/);
  });
  it('fails on missing language slugs and unsafe/noncanonical route segments',()=>{
    for(const route_slug of [undefined,'','../bad','Mixed-Case','a_b','a?b','a/b','a%2fb','-bad','bad-'])
      expect(()=>catalogSlug({...record,text:{it:{title:'Title',route_slug}}},'it')).toThrow(/stable-id:it.*route_slug/);
    expect(()=>catalogSlug(record,'de')).toThrow(/stable-id:de/);
  });
  it('rejects collisions between translations or another record legacy alias',()=>{
    expect(()=>validateCatalogRoutes([record,{...record,id:'other',slug:'other-id'}],'Tours')).toThrow(/Duplicate route_slug/);
    expect(()=>validateCatalogRoutes([record,{...record,id:'other',slug:'titolo-italiano',text:{it:{title:'Other',route_slug:'other-title'}}}],'Tours')).toThrow(/conflicts with other/);
    expect(()=>validateCatalogRoutes([record],'Tours')).not.toThrow();
  });
});
