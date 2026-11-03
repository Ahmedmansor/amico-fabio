import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { getCatalog } from '../src/shared/data/catalog.mjs';
import { createConfiguredProvider,readCatalogSettings } from '../src/shared/data/provider.mjs';
import { normalizeSheetRows } from '../src/shared/data/sheet-rows.mjs';
import { parseCsv } from '../src/shared/domain/csv.ts';
import { isActive } from '../src/shared/domain/offers.ts';

const settings=readCatalogSettings(),requests=[];
const trackedFetch=async(input,options)=>{requests.push(String(input));return fetch(input,options);};
const provider=createConfiguredProvider(settings,trackedFetch);
if(process.argv.includes('--capture-sheets-baseline')){
  assert.equal(provider.name,'Google Sheets','Capture requires an explicit Sheets build first.');
  const pages={};
  for(const file of fs.readdirSync('dist',{recursive:true}).filter(name=>name.endsWith('.html'))){
    const html=fs.readFileSync(path.join('dist',file),'utf8');
    pages[file.replaceAll('\\','/')]={html,sha256:createHash('sha256').update(html).digest('hex')};
  }
  fs.mkdirSync('supabase/local',{recursive:true});
  fs.writeFileSync('supabase/local/sheets-build.json',JSON.stringify({provider:'sheets',pages}));
  console.log(`Saved exact Google Sheets baseline: ${Object.keys(pages).length} HTML pages.`);
  process.exit(0);
}
assert.equal(provider.name,'Supabase','This verifier requires the explicitly selected Supabase provider.');
const manifest=JSON.parse(fs.readFileSync('supabase/import/manifest.json','utf8'));
const sources={};
for(const name of Object.keys(manifest.sources)){
  const body=fs.readFileSync(`supabase/local/${name}.csv`,'utf8');
  assert.equal(createHash('sha256').update(body).digest('hex'),manifest.sources[name].sha256,`${name}: Expected the reviewed source snapshot.`);
  sources[name]=normalizeSheetRows(name,parseCsv(body,name));
}
const [actual,expected]=await Promise.all([getCatalog(provider),getCatalog({read:async name=>sources[name]})]);
const offer=({source,...row})=>({...row,metadata:{featured:isActive(source.featured),badge_it:source.badge_it||'',badge_en:source.badge_en||'',badge_key:source.badge_key||''}});
const normalized=catalog=>({trips:catalog.trips.map(offer),packages:catalog.packages.map(offer),
  addons:catalog.addons.map(({source,...row})=>row),
  settings:catalog.settings.filter(row=>row.key==='promo_banner').map(({source,...row})=>row)});
assert.deepEqual(normalized(actual),normalized(expected),'Every normalized price, text, asset, flag, badge, minimum and relation must match.');
console.log('Live Supabase vs reviewed Sheets snapshot: every normalized catalog field, price and package relation matches.');

const publicReadChecks={};
for(const [table,field,filter] of [['trips','is_active','eq.false'],['public_settings','key','neq.promo_banner']]){
  const url=new URL(`/rest/v1/${table}`,settings.CATALOG_SUPABASE_URL);
  url.searchParams.set('select',table==='trips'?'id':'key');url.searchParams.set(field,filter);
  const response=await trackedFetch(url,{headers:{apikey:settings.CATALOG_SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});
  assert.ok(response.ok,`${table}: public read probe HTTP ${response.status}`);
  const rows=await response.json();assert.deepEqual(rows,[],`${table}: unpublished/non-allowlisted data leaked.`);
  publicReadChecks[table]=rows.length;
}
assert.ok(requests.every(raw=>new URL(raw).origin===new URL(settings.CATALOG_SUPABASE_URL).origin));
console.log(`Publishable-key REST: ${requests.length} Supabase GET requests; no Google Sheets requests; private/inactive read probes returned zero rows.`);

// Provider metadata is intentionally absent from browser booking configuration.
function visibleBuild(html){
  return html.replace(/(<script\b[^>]*\bid="booking-config"[^>]*>)([\s\S]*?)(<\/script>)/g,(_,open,json,close)=>{
    const config=JSON.parse(json);config.addons=config.addons.map(({id,price,labels})=>({id,price,labels}));
    return open+JSON.stringify(config).replaceAll('<','\\u003c')+close;
  });
}
const baseline=JSON.parse(fs.readFileSync('supabase/local/sheets-build.json','utf8'));
const htmlFiles=fs.readdirSync('dist',{recursive:true}).filter(name=>name.endsWith('.html'));
assert.deepEqual(htmlFiles.map(file=>file.replaceAll('\\','/')).sort(),Object.keys(baseline.pages).sort());
const metadataOnlyChanges=[];
for(const file of htmlFiles){
  const name=file.replaceAll('\\','/'),html=fs.readFileSync(path.join('dist',file),'utf8');
  if(createHash('sha256').update(html).digest('hex')!==baseline.pages[name].sha256)metadataOnlyChanges.push(name);
  assert.equal(createHash('sha256').update(visibleBuild(html)).digest('hex'),createHash('sha256').update(visibleBuild(baseline.pages[name].html)).digest('hex'),`${name}: generated output changed beyond removed addon metadata.`);
  assert.ok(!html.includes('sb_publishable_')&&!html.includes('sb_secret_'),`${name}: API configuration leaked into HTML.`);
  const configJson=html.match(/<script\b[^>]*\bid="booking-config"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if(configJson)for(const addon of JSON.parse(configJson).addons)assert.deepEqual(Object.keys(addon).sort(),['id','labels','price']);
}
for(const file of fs.readdirSync('dist/_astro').filter(name=>name.endsWith('.js'))){
  const js=fs.readFileSync(`dist/_astro/${file}`,'utf8');
  assert.ok(!js.includes('docs.google.com/spreadsheets')&&!js.includes('supabase.co/rest/v1')&&!js.includes('sb_publishable_')&&!js.includes('sb_secret_'),`${file}: catalog access leaked into browser code.`);
}
console.log(`${htmlFiles.length} generated HTML pages match the Sheets build after removing provider-only addon metadata (${metadataOnlyChanges.length} pages); browser bundles contain no catalog endpoints or keys.`);
let testFlavor=null;
const testRoot='supabase/local/test-dist';
if(fs.existsSync(testRoot)){
  let pages=0;
  for(const file of fs.readdirSync(testRoot,{recursive:true}).filter(name=>name.endsWith('.html'))){
    const html=fs.readFileSync(path.join(testRoot,file),'utf8');
    if(file==='404.html'||/http-equiv="refresh"/i.test(html))continue;
    assert.ok(html.includes('name="robots" content="noindex, follow"'),`${file}: missing test noindex`);
    const image=html.match(/property="og:image" content="([^"]+)"/)?.[1];
    assert.equal(new URL(image).origin,'http://127.0.0.1:4322',`${file}: incorrect test asset origin`);
    assert.ok(fs.existsSync(path.join(testRoot,decodeURIComponent(new URL(image).pathname))));
    pages++;
  }
  assert.equal((fs.readFileSync(`${testRoot}/sitemap.xml`,'utf8').match(/<loc>/g)||[]).length,0);
  testFlavor={pages,noindex:true,sitemapUrls:0,assetOrigin:'http://127.0.0.1:4322'};
  console.log(`Isolated Supabase test flavor: ${pages} noindex pages, zero sitemap URLs, all social images on the test origin.`);
}
const report={verifiedAt:new Date().toISOString(),provider:'Supabase',keyType:'modern publishable',deployed:false,
  counts:{trips:actual.trips.length,packages:actual.packages.length,addons:actual.addons.length,settings:actual.settings.length,packageTrips:actual.packages.reduce((n,p)=>n+p.includedTripIds.length,0)},
  normalizedCatalogMatchesReviewedSheets:true,normalizedCatalogSha256:createHash('sha256').update(JSON.stringify(normalized(actual))).digest('hex'),
  requests:requests.map(raw=>{const url=new URL(raw);return url.pathname+url.search;}),publicReadChecks,
  staticHtmlPages:htmlFiles.length,matchingNormalizedHtmlPages:htmlFiles.length,metadataOnlyChanges,
  browserCatalogAccess:false,browserKeyExposure:false,testFlavor};
fs.writeFileSync('qa/supabase/provider-verification.json',JSON.stringify(report,null,2)+'\n');
