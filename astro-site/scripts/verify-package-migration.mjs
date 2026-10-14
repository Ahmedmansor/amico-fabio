import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {getPackagePages} from '../src/features/packages/data/details.mjs';
import {calculateTotal} from '../src/features/booking/domain/booking.ts';
const decode=text=>text.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10)));
const norm=text=>text.replace(/\s/g,'');
const pages=await getPackagePages();
for(const page of pages){
 const record=page.package,route=`/${page.locale}/packages/${record.slug}/`,html=fs.readFileSync(path.join('dist',route,'index.html'),'utf8');
 const plain=norm(decode(html.replace(/<[^>]+>/g,'')));
 for(const text of [page.text,...page.included.map(item=>item.text)])for(const value of [text.title,text.short_desc,text.duration,text.full_description,text.important_notes,...text.highlights,...text.includes,...text.not_included,...text.program.flatMap(step=>[step.time,step.activity,step.details])])assert.ok(plain.includes(norm(value)),`${record.id}/${page.locale}: missing ${value.slice(0,60)}`);
 assert.ok(html.includes(`rel="canonical" href="https://fabioegypt.com${route}"`));
 for(const locale of ['it','en'])assert.ok(html.includes(`hreflang="${locale}" href="https://fabioegypt.com/${locale}/packages/${record.slug}/"`));
 assert.ok(html.includes('"kind":"package"'));
 assert.match(html,new RegExp(`id="label-included-trips"[^>]*>\\s*${page.locale==='it'?'Escursioni incluse':'Included tours'}\\s*</h3>`),`${record.id}: missing approved included-trips heading`);
 const total=calculateTotal({adults:record.minPax,children:0,selectedAddons:[]},{...record.prices,minPax:record.minPax},[]);
 assert.ok(html.includes(`id="live-total-price" class="text-2xl font-bold text-white">€${total}</span>`));
 const ids=Array.from(html.matchAll(/\sid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,`${record.id}: duplicate DOM IDs`);
 assert.deepEqual(Array.from(html.matchAll(/data-trip-id="([^"]+)"/g),m=>m[1]),record.includedTripIds);
 for(const src of page.gallery)assert.ok(fs.readFileSync(src.slice(1)).equals(fs.readFileSync(path.join('../public/assets/images',src.split('/catalog/')[1]))));
 for(const match of html.matchAll(/(?:src|data-gallery-src)="(\/_astro\/[^"?#]+)"/g))assert.ok(fs.existsSync(path.join('dist',decodeURIComponent(match[1]))),`${record.id}: missing optimized image ${match[1]}`);
 assert.ok(!html.includes('docs.google.com'));assert.ok(!html.includes('BookingManager.'));
}
console.log(`${pages.length} independent package pages: source content, included trips, prices, optimized images, language URLs and static booking verified.`);
const reports=JSON.parse(fs.readFileSync('qa/packages/comparisons.json','utf8'));
assert.equal(reports.length,pages.length*2);
const normalized=value=>JSON.stringify(value,(_key,item)=>typeof item==='string'?norm(item):item);
for(const report of reports){assert.deepEqual(report.mismatch,[]);assert.equal(normalized(report.astro),normalized(report.legacy),`${report.id}/${report.locale}/${report.size}`);}
console.log(`${reports.length} desktop/mobile comparisons match legacy in both languages.`);
const modals=JSON.parse(fs.readFileSync('qa/packages/modals.json','utf8'));
assert.equal(modals.length,4);
for(const report of modals){assert.equal(report.matches,true);assert.equal(normalized(report.astro),normalized(report.legacy));assert.equal(report.astro.visible,true);assert.equal(report.astro.bodyLocked,true);}
const booking=JSON.parse(fs.readFileSync('qa/packages/booking.json','utf8'));
assert.equal(booking.astro,booking.legacy);assert.ok(booking.astro.includes('€510'));assert.equal(booking.whatsappConfirmationClicked,false);
console.log('Included-trip modal content matches at both widths/languages; package invoice matches legacy and no WhatsApp confirmation was clicked.');
