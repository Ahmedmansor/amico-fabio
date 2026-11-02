import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const origin='https://amico-fabio-iyzo.vercel.app';
const results=[];
for(const locale of ['es','pt']){
 for(const route of ['egypt/','login/']){
  const response=await fetch(`${origin}/${locale}/${route}`,{signal:AbortSignal.timeout(10000)});
  const html=await response.text();
  assert.equal(response.status,200);assert.ok(html.includes(`lang="${locale}"`));
  assert.match(html,/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/);
  if(route==='egypt/')for(const slug of ['cairo','luxor','aswan','sharm-el-sheikh'])assert.ok(html.includes(`/${locale}/egypt/${slug}/`));
  results.push({locale,route,status:response.status,language:true,noindex:true});
 }
 const excluded=await fetch(`${origin}/${locale}/blog/`,{signal:AbortSignal.timeout(10000)});
 assert.equal(excluded.status,404);results.push({locale,route:'blog/',status:404,excluded:true});
}
await writeFile('qa/i18n/published-pages.json',JSON.stringify({origin,results},null,2)+'\n');
console.log(JSON.stringify({publishedPages:4,excludedBlogListings:2,pass:true}));
