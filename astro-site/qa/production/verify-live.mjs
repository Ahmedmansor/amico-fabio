// Public release smoke checks only; never submits Auth, consent or booking forms.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const origin='https://fabioegypt.com';
const rows=[],assets=new Set();
const get=async route=>{
  const response=await fetch(new URL(route,origin),{signal:AbortSignal.timeout(30000),cache:'no-store'});
  const body=await response.text();return {response,body};
};
const {response:markerResponse,body:marker}=await get('/release.json');
assert.equal(markerResponse.status,200,'Production release marker is not published yet');
const release=JSON.parse(marker);assert.equal(release.sourceCommit,'75ceba8fb639ba953db835d815144d55fed59663');
for(const locale of ['it','en','es','pt','de']) {
  for(const route of [`/${locale}/`,`/${locale}/login/`,`/${locale}/wishlist/`]) {
    const {response,body}=await get(route);assert.equal(response.status,200,route);
    assert.ok(body.includes(`<html lang="${locale}"`),route+' language');
    assert.ok(body.includes(`rel="canonical" href="${origin}${route}"`),route+' canonical');
    if(route===`/${locale}/`)assert.doesNotMatch(body,/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/);
    const menu=body.match(/<div\b[^>]*class="[^"]*currency-options[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(menu,route+' currency menu');assert.doesNotMatch(menu,/<p\b/);
    assert.equal((menu.match(/data-currency=/g)||[]).length,3);
    if(route.endsWith('/login/')) {
      const match=[...body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].find(x=>x[1].includes('id="login-config"'));
      assert.ok(match);const {config}=JSON.parse(match[2]);assert.equal(config.siteOrigin,origin);
      for(const key of ['googleEnabled','emailEnabled','passwordEnabled'])assert.equal(config[key],true);
    }
    assert.doesNotMatch(body,/\[FIXTURE\]|data-fixture(?:[\s=>]|$)|https:\/\/amico-fabio-iyzo\.vercel\.app/);
    for(const match of body.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+)(?:[?#][^"]*)?"/g))assets.add(match[1]);
    rows.push({route,status:response.status,language:locale,currencyOptions:3,menuNotice:false});
  }
}
for(const route of ['/it/tours/ras_mohammed_bus_half_day/','/en/packages/il_grande_blu/','/offerta-sharm/','/welcome/']){
  const {response,body}=await get(route);assert.equal(response.status,200,route);assert.match(body,/<(?:main|h1)\b/,route+' content');
  rows.push({route,status:response.status});
}
const sitemap=await get('/sitemap.xml');assert.equal(sitemap.response.status,200);
assert.equal((sitemap.body.match(/<loc>/g)||[]).length,230);
const robots=await get('/robots.txt');assert.ok(robots.body.includes(`${origin}/sitemap.xml`));
const sampled=[...assets].slice(0,8);
for(const asset of sampled){const response=await fetch(new URL(asset,origin),{method:'HEAD',signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,asset);}
const missing=await get('/__astro_release_not_found__/');assert.equal(missing.response.status,404);
await writeFile(new URL('./live.json',import.meta.url),JSON.stringify({origin,release,rows,sitemapUrls:230,assetsChecked:sampled,unknownRouteStatus:404,realEmailsSent:0,authenticatedUserTests:false},null,2)+'\n');
console.log(`Live production: ${rows.length} public page checks, 230 sitemap URLs, ${sampled.length} assets, currency menu and 404 passed; no account/email/form submissions.`);
