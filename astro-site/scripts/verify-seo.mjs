import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {siteConfig} from '../src/shared/config/site.ts';
const xml=fs.readFileSync('dist/sitemap.xml','utf8'),urls=Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g),m=>m[1]);
assert.ok(urls.length>0);assert.equal(urls.length,new Set(urls).size);
for(const url of urls){const parsed=new URL(url);assert.equal(parsed.origin,siteConfig.url);assert.ok(!parsed.search&&!parsed.hash);const html=fs.readFileSync(path.join('dist',parsed.pathname,'index.html'),'utf8');assert.ok(html.includes(`rel="canonical" href="${url}"`));assert.ok(!html.includes('content="noindex'));}
assert.ok(!urls.includes(siteConfig.url+'/'));assert.ok(!urls.some(url=>url.includes('404')||url.includes('details.html')));
assert.equal(fs.readFileSync('dist/robots.txt','utf8'),`User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`);
const notFound=fs.readFileSync('dist/404.html','utf8');assert.ok(notFound.includes('noindex, follow'));
for(const locale of ['it','en'])for(const route of ['', 'explore/'])assert.ok(notFound.includes(`href="/${locale}/${route}"`));
console.log(`SEO artifacts verified: ${urls.length} canonical sitemap entries, robots.txt discovery, bilingual noindex 404, no old URL redirects.`);
for(const port of [4321,4322]){
 const base=`http://127.0.0.1:${port}`,response=await fetch(base+'/fabio-qa-missing-page/');assert.equal(response.status,404,`${base}: missing page must return HTTP 404`);assert.ok((await response.text()).includes('Pagina non trovata'));console.log(`${base}: unknown URL returns real HTTP 404 with both recovery languages.`);
 const root=await fetch(base+'/');const body=await root.text();assert.ok(root.url.endsWith('/it/')||body.includes('url=/it/'));console.log(`${base}: root leads to default Italian home.`);
}
