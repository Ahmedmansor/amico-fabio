// Validate the exact production artifact. No sign-in, email or booking submission.
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {supportedLocales} from '../src/shared/config/languages.ts';

const origin='https://fabioegypt.com';
const read=path=>readFile(new URL(`../dist/${path}`,import.meta.url),'utf8');
function json(html,id) {
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  const script=scripts.find(([,attributes])=>attributes.includes(`id="${id}"`));
  assert.ok(script,`Missing ${id}`);
  return JSON.parse(script[2]);
}
assert.equal((await read('CNAME')).trim(),'fabioegypt.com');
const sitemap=await read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.ok(urls.length>0,'Production sitemap must not be empty');
for(const value of urls) {
  const url=new URL(value);assert.equal(url.origin,origin);
  assert.ok(!/\/(?:auth|login|email-preferences)\//.test(url.pathname),`Private utility route in sitemap: ${url.pathname}`);
  const html=await read(url.pathname.slice(1)+'index.html');
  assert.doesNotMatch(html,/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/);
}
for(const locale of supportedLocales) {
  const html=await read(`${locale}/login/index.html`);
  const {config,marketingEnabled}=json(html,'login-config');
  assert.equal(config.siteOrigin,origin);
  assert.equal(config.url,'https://iiivnvwspoikfrlclhyr.supabase.co');
  for(const flag of ['googleEnabled','emailEnabled','passwordEnabled'])assert.equal(config[flag],true);
  assert.match(config.publishableKey,/^sb_publishable_/);
  assert.ok(config.turnstileSiteKey);assert.equal(config.resendSeconds,60);
  assert.equal(marketingEnabled,true);
  const wishlist=await read(`${locale}/wishlist/index.html`);
  assert.ok(wishlist.includes('id="auth-config"'));
  const options=json(wishlist,'auth-config');
  assert.equal(options.config.siteOrigin,origin);
  assert.ok(options.localeSettings);
}
let files=0;
async function scan(folder) {
  for(const entry of await readdir(folder,{withFileTypes:true})) {
    const url=new URL(entry.name+(entry.isDirectory()?'/':''),folder);
    if(entry.isDirectory()){await scan(url);continue;}
    if(!/\.(?:html|js|mjs|json|xml|txt|css)$/.test(entry.name))continue;
    const contents=await readFile(url,'utf8');files++;
    assert.doesNotMatch(contents,/\bsb_secret_[A-Za-z0-9_-]+|\bservice_role\b|http:\/\/127\.0\.0\.1:4322|\[FIXTURE\]|data-fixture(?:[\s=>]|$)/,`Unsafe production content: ${url.pathname}`);
    if(entry.name.endsWith('.html'))assert.doesNotMatch(contents,/https:\/\/amico-fabio-iyzo\.vercel\.app/,`Test origin in ${url.pathname}`);
  }
}
await scan(new URL('../dist/',import.meta.url));
assert.ok((await read('robots.txt')).includes(`${origin}/sitemap.xml`));
console.log(`Production artifact verified: ${urls.length} indexable sitemap URLs; ${supportedLocales.length} login/wishlist languages; ${files} text artifacts; correct domain, active Auth, no fixtures or private credentials.`);
