import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogPlainText,catalogStructuredData,serializeCatalogStructuredData} from '../catalog-seo.ts';

const input={kind:'tour',locale:'en',slug:'existing-slug',title:'Sea &amp; <b>desert</b>',description:'A <em>day</em> out.',adultPrice:0,
  program:[{time:'08:00',activity:'Hotel pickup',details:'Transfer from your hotel.'}]};
const context={site:'https://fabioegypt.com',assetOrigin:'https://preview.example',image:{src:'/poster.jpg',width:1200,height:800},homeLabel:'Home',tripsLabel:'Trips'};
test('catalog graph uses the final price, canonical locale, visible itinerary and preview image host',()=>{
  const graph=catalogStructuredData(input,context)['@graph'];
  assert.equal(graph[0].inLanguage,'en');assert.equal(graph[0].url,'https://fabioegypt.com/en/tours/existing-slug/');
  assert.equal(graph[1].name,'Sea & desert');assert.equal(graph[1].offers.price,0);assert.equal(graph[1].offers.priceCurrency,'EUR');
  assert.equal(graph[1].image.url,'https://preview.example/poster.jpg');
  assert.equal(graph[1].itinerary.itemListElement[0].item.description,'08:00: Transfer from your hotel.');
  assert.equal(graph[2].itemListElement[2].item,graph[0].url);
  for(const key of ['aggregateRating','review','availability','startDate','priceValidUntil'])assert.ok(!JSON.stringify(graph).includes(`"${key}"`));
});
test('packages link existing included tours in the same language, without losing their route namespace',()=>{
  const graph=catalogStructuredData({...input,kind:'package',locale:'pt',included:[{slug:'actual-tour',title:'Excursão'}]},context)['@graph'];
  assert.equal(graph[0].url,'https://fabioegypt.com/pt/packages/existing-slug/');
  assert.equal(graph[1].subTrip[0].url,'https://fabioegypt.com/pt/tours/actual-tour/');
});
test('HTML and character references become plain metadata without unsafe inline scripts',()=>{
  assert.equal(catalogPlainText(' A&nbsp;<strong>trip</strong> &#38; &#x26; '),'A trip & &');
  const value={name:'</script><script>alert(1)</script>'};
  const serialized=serializeCatalogStructuredData(value);
  assert.ok(!serialized.includes('<'));assert.deepEqual(JSON.parse(serialized),value);
});
test('invalid prices fail instead of publishing misleading offer markup',()=>{
  for(const adultPrice of [-1,NaN,Infinity])assert.throws(()=>catalogStructuredData({...input,adultPrice},context),/Invalid adultPrice/);
});
