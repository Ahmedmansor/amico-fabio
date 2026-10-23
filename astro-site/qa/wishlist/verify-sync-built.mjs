import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const enabled=process.argv.includes('--enabled');
const directory=process.env.QA_DIST||'dist';
for(const locale of ['it','en'])for(const route of ['wishlist','explore','legal']){
  const html=await readFile(`${directory}/${locale}/${route}/index.html`,'utf8');
  const match=html.match(/<script[^>]*id="wishlist-config"[^>]*>([\s\S]*?)<\/script>/);
  assert.equal(!!match,enabled,`${locale}/${route}: account sync must be explicitly gated`);
  assert.equal(html.includes('data-wishlist-invitation'),enabled);
  if(enabled){
    const config=JSON.parse(match[1]);assert.equal(config.locale,locale);
    assert.ok(config.publishedIds.length>0);assert.equal(new Set(config.publishedIds).size,config.publishedIds.length);
    assert.ok(config.auth.publishableKey.startsWith('sb_publishable_'));
  }
  if(route==='wishlist')assert.equal(html.includes('data-wishlist-sync-retry'),enabled);
}
console.log(`Built wishlist gate: ${enabled?'enabled synthetic configuration':'disabled by default; no account bootstrap/retry UI'} verified for 6 main-site routes. Key values not printed.`);
