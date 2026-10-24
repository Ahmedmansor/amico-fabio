import assert from 'node:assert/strict';

// Public page configuration only. No env files, sessions, tokens or customer rows.
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4322';
const response=await fetch(`${origin}/en/wishlist/`,{signal:AbortSignal.timeout(30000)});
assert.equal(response.status,200);
const html=await response.text();
const match=html.match(/<script[^>]*id="wishlist-config"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(match,'Account-sync bootstrap must be enabled locally');
const config=JSON.parse(match[1]);
assert.equal(config.auth.url,'https://iiivnvwspoikfrlclhyr.supabase.co');
assert.ok(config.publishedIds.some(id=>id.startsWith('package:')));
assert.ok(config.publishedIds.some(id=>!id.startsWith('package:')));
for(const table of ['profiles','wishlists','package_wishlists']){
  const result=await fetch(`${config.auth.url}/rest/v1/${table}?select=user_id&limit=1`,{
    headers:{apikey:config.auth.publishableKey},signal:AbortSignal.timeout(15000),
  });
  assert.ok([401,403].includes(result.status),`${table}: anonymous access must be denied; got ${result.status}`);
  console.log(`${table}: anonymous REST access denied (${result.status}).`);
}
console.log('Live wishlist config enabled for tours and packages; real anonymous REST denials passed. No keys or customer data printed; authenticated browser verification requires the user session.');
