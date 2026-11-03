import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const origin='https://amico-fabio-iyzo.vercel.app';
const snapshot=JSON.parse(await readFile(new URL('../../.astro/blog/index.json',import.meta.url),'utf8'));
const demos=snapshot.records.filter(record=>record.demo&&!record.draft);
assert.equal(demos.length,12,'Expected the existing six IT and six EN demo posts');
const listings=new Map();
for(const locale of ['it','en']){
 const response=await fetch(`${origin}/${locale}/blog/`),html=await response.text();
 assert.equal(response.status,200);assert.match(html,/<meta name="robots" content="noindex, follow"/);
 listings.set(locale,html);
}
const results=[];
for(const post of demos){
 const path=`/${post.lang}/blog/${post.slug}/`,response=await fetch(origin+path),html=await response.text();
 assert.equal(response.status,200,path);assert.match(html,/<meta name="robots" content="noindex, follow"/);
 assert.ok(listings.get(post.lang).includes(path),`Demo absent from listing: ${path}`);
 results.push({path,status:200,noindex:true,inListing:true});
}
const guides=[];
for(const locale of ['it','en']){
 const path=`/${locale}/egypt/aswan/`,response=await fetch(origin+path),html=await response.text();
 assert.equal(response.status,200,path);assert.ok(html.includes('data-nationality-select'));
 assert.match(html,/<meta name="robots" content="noindex, follow"/);guides.push({path,status:200,noindex:true});
}
const sitemap=await fetch(origin+'/sitemap.xml').then(response=>response.text());
assert.ok(!sitemap.includes('<loc>'),'Noindex demo preview must keep sitemap empty');
await writeFile(new URL('./demo-restoration.json',import.meta.url),JSON.stringify({origin,sourceCommit:process.env.QA_SOURCE_COMMIT,posts:results,guides,sitemapEmpty:true},null,2)+'\n');
console.log(JSON.stringify({posts:results.length,guides:guides.length,noindex:true,sitemapEmpty:true,pass:true}));
