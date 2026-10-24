import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateEmailCatalog} from '../../src/features/reminders/domain/catalog.ts';
const directory=process.env.QA_DIST||'dist';
const manifest=validateEmailCatalog(JSON.parse(await readFile(resolve(directory,'tours-manifest.json'),'utf8')));
if(process.env.QA_EXPECTED_ORIGIN)assert.equal(manifest.origin,process.env.QA_EXPECTED_ORIGIN);
if(process.env.QA_EXPECTED_ENVIRONMENT)assert.equal(manifest.environment,process.env.QA_EXPECTED_ENVIRONMENT);
const text=value=>value.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
assert.ok(manifest.items.length>0);
let pages=0;
for(const item of manifest.items){
  assert.deepEqual(Object.keys(item).sort(),['adult_price','id','image','kind','localized','slug']);
  for(const localized of Object.values(item.localized)){
    const url=new URL(localized.url);
    const html=await readFile(resolve(directory,'.'+url.pathname,'index.html'),'utf8');
    const title=html.match(/<h1\b[^>]*id="detail-title"[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    assert.equal(text(title||''),text(localized.title),`${item.kind}:${item.id}: title must match the page`);
    const priceBlock=html.slice(html.indexOf('id="detail-price"'),html.indexOf('id="detail-price"')+600);
    assert.equal(Number(priceBlock.match(/€(\d+(?:\.\d+)?)/)?.[1]),item.adult_price,`${item.kind}:${item.id}: page price mismatch`);
    pages++;
  }
  const image=new URL(item.image.url);
  assert.match(image.pathname,/\.jpe?g$/i);
  assert.ok((await stat(resolve(directory,'.'+image.pathname))).size>0);
}
console.log(`Email catalog passed: ${manifest.items.filter(item=>item.kind==='trip').length} tours, ${manifest.items.filter(item=>item.kind==='package').length} packages, ${pages} localized page titles/prices/links and all JPEG files; environment=${manifest.environment}, origin=${manifest.origin}. No user fields.`);
