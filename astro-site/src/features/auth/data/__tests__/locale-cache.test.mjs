import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCachedLocaleRepository} from '../locale-cache.ts';
import {readLocaleBrowserConfig} from '../locale-browser-config.ts';

const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const initial={siteLocale:'it',revision:0,email:null};
function fixture(){
  const records=new Map(),reads=[],writes=[];let now=100;
  const storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)};
  const repository={read:async id=>{reads.push(id);return {ok:true,value:initial};},change:async(id,command)=>{
    writes.push({id,command});return {ok:false,reason:'conflict',state:{...initial,revision:3}};
  }};
  const cache=createCachedLocaleRepository({repository,storage,now:()=>now,maxAgeMs:100});
  return {cache,records,reads,writes,storage,setNow:value=>now=value};
}
test('ordinary navigation reuses a bounded per-account cache; expiry or explicit refresh reads once',async()=>{
  const f=fixture();await f.cache.repository.read(a);await f.cache.repository.read(a);
  assert.equal(f.reads.length,1);
  await f.cache.repository.read(b);assert.deepEqual(f.reads,[a,b]);
  f.cache.invalidate(a);await f.cache.repository.read(a);assert.equal(f.reads.length,3);
  f.setNow(201);await f.cache.repository.read(a);assert.equal(f.reads.length,4);
});
test('cache never short-circuits writes; a conflict refreshes confirmed revision',async()=>{
  const f=fixture();await f.cache.repository.read(a);
  const command={requestId:b,expectedRevision:0,kind:'site',locale:'en'};
  assert.equal((await f.cache.repository.change(a,command)).reason,'conflict');
  assert.equal(f.writes.length,1);
  assert.equal((await f.cache.repository.read(a)).value.revision,3);
  assert.equal(f.reads.length,1);
});
test('malformed cache data cannot be interpreted as authorization or consent',async()=>{
  const f=fixture();f.records.set(`fabio:locale-cache:v1:${a}`,JSON.stringify({version:1,savedAt:100,state:{...initial,enabled:true}}));
  assert.equal((await f.cache.repository.read(a)).ok,true);assert.equal(f.reads.length,1);
  assert.equal((await f.cache.repository.read('guest')).reason,'invalid-input');
});
test('forced refresh works even when optional storage cannot remove its stale entry',async()=>{
  const f=fixture();await f.cache.repository.read(a);
  f.storage.removeItem=()=>{throw new Error('blocked');};
  f.cache.invalidate(a);await f.cache.repository.read(a);
  assert.equal(f.reads.length,2);
});
test('locale feature is off by default and cannot be enabled without Auth/profiles',()=>{
  assert.equal(readLocaleBrowserConfig({},null),null);
  assert.throws(()=>readLocaleBrowserConfig({PUBLIC_ACCOUNT_LOCALE_ENABLED:'true'},null));
  assert.throws(()=>readLocaleBrowserConfig({PUBLIC_ACCOUNT_LOCALE_ENABLED:'1'},null));
  const config=readLocaleBrowserConfig({PUBLIC_ACCOUNT_LOCALE_ENABLED:'1',PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED:'1'}, {url:'https://auth-qa.invalid'});
  assert.equal(config.endpoint,'https://auth-qa.invalid/functions/v1/account-locale');
  assert.equal(config.cacheMaxAgeMs,300000);
});
