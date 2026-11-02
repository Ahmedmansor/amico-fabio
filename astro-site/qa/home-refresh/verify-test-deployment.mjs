import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const origin='https://amico-fabio-iyzo.vercel.app',results=[];
for(const locale of ['it','en'])for(const [route,marker] of [
 ['','hero-slide-slot'],['wishlist/','wishlist-card-photo'],['tailor-your-trip/','data-nationality-select'],
 ['tours/ras_mohammed_white_island_vip/','product-section-nav'],['login/','data-login-page']
]){
 const url=`${origin}/${locale}/${route}`,response=await fetch(url),html=await response.text();
 assert.equal(response.status,200,url);
 assert.match(html,/<meta name="robots" content="noindex, follow"/);
 assert.ok(html.includes(marker),url+' missing '+marker);
 const row={path:`/${locale}/${route}`,status:response.status,noindex:true,marker};
 if(route==='login/'){
  const config=JSON.parse(html.match(/<script\b(?=[^>]*\bid="login-config")[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(config.config.siteOrigin,origin);assert.equal(config.config.googleEnabled,true);
  assert.equal(config.config.passwordEnabled,true);assert.equal(config.marketingEnabled,false);
  row.authPreserved=true;row.marketingActivationOff=true;
 }
 results.push(row);
}
await writeFile(new URL('./test-deployment.json',import.meta.url),JSON.stringify({origin,sourceCommit:process.env.QA_SOURCE_COMMIT,results,liveEmailsSent:0},null,2)+'\n');
console.log(JSON.stringify({origin,cases:results.length,pass:true,marketingActivationOff:true}));
