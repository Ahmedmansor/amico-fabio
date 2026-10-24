import {describe,it,expect} from 'vitest';
import {buildEmailCatalog,type EmailCatalogItem} from '../catalog';
import {prepareWishlistEmail} from '../email';
const origin='https://preview.example.test';
function item(kind:EmailCatalogItem['kind'],id='same'):EmailCatalogItem{
  const namespace=kind==='trip'?'tours':'packages';
  return {kind,id,slug:id,adult_price:0,localized:{it:{title:'Titolo',url:`${origin}/it/${namespace}/${id}/`},en:{title:'Title',url:`${origin}/en/${namespace}/${id}/`}},image:{url:`${origin}/poster.jpg`,width:640,height:400}};
}
const catalog=buildEmailCatalog([item('trip'),item('package'),item('trip','another')],origin,'2026-10-24T00:00:00Z','test');
const input={catalog,expectedEnvironment:'test' as const,ids:['same','package:same'],locale:'en' as const,kind:'summary' as const};
describe('wishlist email selection',()=>{
  it('selects only saved items, deduplicates, preserves free prices and kind identity',()=>{
    const result=prepareWishlistEmail({...input,ids:['same','same','package:same']});
    expect(result.model?.items.map(item=>item.kind)).toEqual(['trip','package']);
    expect(result.model?.items[0].price).toBe(0);expect(result.model?.unsubscribeUrl).toBe(null);
  });
  it('reports missing/unpublished IDs and never invents cards',()=>{
    const result=prepareWishlistEmail({...input,ids:['missing','same']});
    expect(result.unavailableKeys).toEqual(['missing']);expect(result.model?.items).toHaveLength(1);
  });
  it('does not prepare an empty email when every saved item is unavailable',()=>{
    expect(prepareWishlistEmail({...input,ids:['missing']}).model).toBe(null);
  });
  it('includes all available saved items without a per-message card cap',()=>{
    const result=prepareWishlistEmail({...input,ids:['same','package:same','another']});
    expect(result.model?.items).toHaveLength(3);
    expect(result.model?.items.map(item=>item.url)).toContain(`${origin}/en/tours/another/`);
  });
  it('uses the selected language and does not silently cross environments',()=>{
    expect(prepareWishlistEmail({...input,locale:'it'}).model?.wishlistUrl).toBe(`${origin}/it/wishlist/`);
    expect(()=>prepareWishlistEmail({...input,expectedEnvironment:'production'})).toThrow(/environment/);
  });
  it('reminders require an unsubscribe link on the trusted site origin',()=>{
    expect(()=>prepareWishlistEmail({...input,kind:'reminder'})).toThrow(/unsubscribe/);
    expect(()=>prepareWishlistEmail({...input,kind:'reminder',unsubscribeUrl:'https://untrusted.test/stop/'})).toThrow(/origin/);
    const result=prepareWishlistEmail({...input,kind:'reminder',unsubscribeUrl:`${origin}/en/email-preferences/?token=example`});
    expect(result.model?.unsubscribeUrl).toContain('token=example');
  });
});
