import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureRows,fixtureProvider } from '../../../../qa/data/fixtures.mjs';
import { createCatalogImport } from '../catalog-import.mjs';
import { createSupabaseProvider } from '../supabase.mjs';
import { createConfiguredProvider } from '../provider.mjs';
import { getCatalog } from '../catalog.mjs';
import { getTrips } from '../../../features/tours/data/trips.mjs';
const url='https://catalog-test.supabase.co',publishableKey='sb_publishable_test_fixture';
const settings={CATALOG_SUPABASE_URL:url,CATALOG_SUPABASE_PUBLISHABLE_KEY:publishableKey};
const tables=()=>createCatalogImport(Object.fromEntries(['Trips_Prices','Packages','Trip_Addons','Global_Settings'].map(name=>[name,fixtureRows(name)])));
function mock(tables,{cap=Infinity}={}){
  const calls=[];
  return {calls,fetchImpl:async(input,options)=>{
    const request=new URL(input);calls.push(request.href);
    assert.equal(request.origin,url);assert.equal(request.searchParams.has('apikey'),false);
    assert.equal(options.headers.apikey,publishableKey);assert.equal(options.headers.Authorization,undefined);
    const table=request.pathname.split('/').at(-1),all=tables[table].filter(row=>row.is_active!==false);
    if(table==='package_trips')all.sort((a,b)=>a.package_id.localeCompare(b.package_id)||a.position-b.position);
    else all.sort((a,b)=>a.source_order-b.source_order);
    const start=Number(request.searchParams.get('offset')),limit=Math.min(cap,Number(request.searchParams.get('limit')));
    const rows=all.slice(start,start+limit),range=rows.length?`${start}-${start+rows.length-1}/${all.length}`:`*/${all.length}`;
    return new Response(JSON.stringify(rows),{headers:{'content-range':range}});
  }};
}
const offer=({source,...item})=>({...item,metadata:{featured:String(source.featured).toLowerCase()==='true',badge_it:source.badge_it||'',badge_en:source.badge_en||'',badge_key:source.badge_key||''}});
const normalized=catalog=>({
  trips:catalog.trips.map(offer),packages:catalog.packages.map(offer),
  addons:catalog.addons.map(({source,...item})=>item),settings:catalog.settings.filter(item=>item.key==='promo_banner').map(({source,...item})=>item),
});
test('both providers produce identical complete catalogs, prices, texts, images and ordered relations',async()=>{
  const fixture=mock(tables(),{cap:2});
  const provider=createSupabaseProvider({url,publishableKey,fetchImpl:fixture.fetchImpl,pageSize:5});
  assert.deepEqual(normalized(await getCatalog(provider)),normalized(await getCatalog(fixtureProvider())));
  assert.ok(fixture.calls.filter(call=>new URL(call).pathname.endsWith('/trips')).length>1,'Server caps must not truncate pagination');
});
test('source/table reads share requests within a build; reset starts fresh requests',async()=>{
  const fixture=mock(tables()),provider=createSupabaseProvider({url,publishableKey,fetchImpl:fixture.fetchImpl});
  await Promise.all([provider.read('Trips_Prices'),provider.read('Trips_Prices')]);assert.equal(fixture.calls.length,1);
  provider.reset();await provider.read('Trips_Prices');assert.equal(fixture.calls.length,2);
});
test('Supabase errors never fall back to Sheets or expose key/response details',async()=>{
  const calls=[];
  const provider=createConfiguredProvider(settings,async(input)=>{calls.push(String(input));throw new Error(publishableKey);});
  await assert.rejects(getCatalog(provider),error=>/Supabase:.*Network/.test(error.message)&&!String(error).includes(publishableKey));
  assert.ok(calls.every(call=>call.startsWith(url)));
  const denied=createSupabaseProvider({url,publishableKey,fetchImpl:async()=>new Response('private failure '+publishableKey,{status:401})});
  await assert.rejects(denied.read('Trips_Prices'),error=>error.message==='[Supabase:trips] HTTP 401.');
});
test('missing pagination counts and changing totals fail rather than returning partial catalogs',async()=>{
  let provider=createSupabaseProvider({url,publishableKey,fetchImpl:async()=>new Response('[]')});
  await assert.rejects(provider.read('Trips_Prices'),/Missing exact pagination count/);
  const data=tables().trips.filter(row=>row.is_active);let calls=0;
  provider=createSupabaseProvider({url,publishableKey,pageSize:1,fetchImpl:async()=>new Response(JSON.stringify([data[calls]]),{headers:{'content-range':`${calls}-${calls++}/${calls===1?22:23}`}})});
  await assert.rejects(provider.read('Trips_Prices'),/Catalog changed during pagination/);
});
test('configuration accepts modern publishable keys and explicit rollback only',()=>{
  assert.equal(createConfiguredProvider({CATALOG_PROVIDER:'sheets'}).name,'Google Sheets');
  assert.throws(()=>createConfiguredProvider({CATALOG_PROVIDER:'invalid'}),/CATALOG_PROVIDER/);
  for(const key of ['sb_secret_forbidden','legacy-jwt',''])assert.throws(()=>createSupabaseProvider({url,publishableKey:key}),/modern sb_publishable_/);
  assert.throws(()=>createSupabaseProvider({url:'https://user:password@catalog-test.supabase.co',publishableKey}),/HTTPS project origin/);
});
test('final zero, separate slugs, missing fields and duplicate relationships retain shared validation',async()=>{
  let data=tables();data.trips[0].adult_price='0';data.trips[0].child_price='0';data.trips[0].slug='separate-slug';
  let fixture=mock(data),provider=createSupabaseProvider({url,publishableKey,fetchImpl:fixture.fetchImpl});
  const trip=(await getTrips(provider))[0];assert.equal(trip.slug,'separate-slug');assert.notEqual(trip.id,trip.slug);assert.deepEqual(trip.prices,{adult:0,child:0});assert.equal(trip.source.p_adult,undefined);
  data=tables();delete data.trips[0].adult_price;fixture=mock(data);provider=createSupabaseProvider({url,publishableKey,fetchImpl:fixture.fetchImpl});
  await assert.rejects(provider.read('Trips_Prices'),/ras_mohammed_white_island_vip.*adult_price/);
  data=tables();data.package_trips.push({...data.package_trips[0]});fixture=mock(data);provider=createSupabaseProvider({url,publishableKey,fetchImpl:fixture.fetchImpl});
  await assert.rejects(provider.read('Packages'),/Duplicate position/);
});
