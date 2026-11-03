import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {getTrips} from '../../src/features/tours/data/trips.mjs';
import {getPackages} from '../../src/features/packages/data/packages.mjs';
import {supportedLocales} from '../../src/shared/config/languages.ts';
import {catalogPath,catalogSlug,catalogAliases,catalogSections} from '../../src/shared/domain/catalog-routes.ts';
// Read the same build-time provider as the build, never customer/Auth data.
const groups=[['tours',await getTrips()],['packages',await getPackages()]];
const read=path=>readFile(`dist${path}index.html`,'utf8');
const sitemap=await readFile('dist/sitemap.xml','utf8');
const manifest=JSON.parse(await readFile('dist/tours-manifest.json','utf8'));
const canonicalPaths=new Set(),aliases=new Set(),results=[];
for(const [kind,records] of groups)for(const record of records)for(const locale of supportedLocales){
  const path=catalogPath(record,locale,kind),html=await read(path),canonical=`https://fabioegypt.com${path}`;
  canonicalPaths.add(path);
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`),path);
  assert.ok(html.includes('data-catalog-schema'),path);
  assert.ok(html.includes(`data-price-eur="${record.prices.adult}"`),path+' price');
  const schema=JSON.parse(html.match(/data-catalog-schema[^>]*>([^<]+)<\/script>/)[1]);
  const trip=schema['@graph'].find(node=>node['@type']==='TouristTrip');
  assert.equal(trip.url,canonical);assert.equal(trip.offers.price,record.prices.adult);
  for(const other of supportedLocales){
    const target=catalogPath(record,other,kind);
    assert.ok(html.includes(`hreflang="${other}" href="https://fabioegypt.com${target}"`),path+' hreflang '+other);
    assert.ok(html.includes(`href="${target}" data-lang="${other}"`),path+' switch '+other);
  }
  const legacy=`/${locale}/${kind}/${record.slug}/`;
  for(const alias of catalogAliases(record,locale,kind)){
    aliases.add(alias);const redirect=await read(alias);
    assert.ok(redirect.includes(`http-equiv="refresh" content="0;url=${path}"`),alias);
    assert.ok(redirect.includes(`rel="canonical" href="${canonical}"`));
    assert.ok(redirect.includes('content="noindex, follow"'));
    assert.ok(redirect.includes('property="og:image"'));
    assert.ok(!sitemap.includes(`<loc>https://fabioegypt.com${alias}</loc>`));
  }
  const item=manifest.items.find(item=>item.kind===(kind==='tours'?'trip':'package')&&item.id===record.id);
  assert.equal(item.localized[locale].canonical_url,new URL(path,manifest.origin).href);
  assert.equal(item.localized[locale].url,new URL(legacy,manifest.origin).href);
  results.push({id:record.id,locale,kind,path,legacy,slug:catalogSlug(record,locale)});
}
let links=0;
async function visit(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
  const file=`${folder}/${entry.name}`;if(entry.isDirectory()){await visit(file);continue;}
  if(!file.endsWith('.html'))continue;const html=await readFile(file,'utf8');
  if(/http-equiv="refresh"/.test(html))continue;
  for(const match of html.matchAll(/<a\b[^>]*href="(\/[^"?#]+\/[^"?#]+\/[^"?#]+\/)"/g)){
    const section=match[1].split('/')[2];
    if(!new Set(['tours','packages',...Object.values(catalogSections).flatMap(value=>Object.values(value))]).has(section))continue;
    assert.ok(canonicalPaths.has(match[1]),`${file}: noncanonical catalog link ${match[1]}`);links++;
  }
}}
await visit('dist');
await writeFile('qa/seo/localized-routes.json',JSON.stringify({pages:results.length,aliases:aliases.size,links,results},null,2)+'\n');
console.log(`Localized catalog verified: ${results.length} pages, ${aliases.size} preserved aliases, ${links} canonical internal links; 5-language switchers/hreflang, prices, schema and backward-compatible email manifest passed.`);
