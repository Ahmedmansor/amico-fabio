import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {getTourPages} from '../src/features/tours/data/details.mjs';
import {getAddons} from '../src/features/booking/data/addons.mjs';
import {calculateTotal} from '../src/features/booking/domain/booking.ts';
const decode=text=>text.replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10))).replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
const normalize=text=>text.replace(/\s/g,'');
const [pages,addons]=await Promise.all([getTourPages(),getAddons()]);
for(const page of pages){
 const {trip,text,gallery,locale}=page;const route=`/${locale}/tours/${trip.slug}/`,html=fs.readFileSync(path.join('dist',route,'index.html'),'utf8');
 const plain=normalize(decode(html.replace(/<[^>]+>/g,'')));
 const contents=[text.title,text.short_desc,text.duration,text.full_description,text.important_notes,...text.highlights,...text.includes,...text.not_included,...text.program.flatMap(step=>[step.time,step.activity,step.details])];
 contents.forEach(value=>assert.ok(plain.includes(normalize(value)),`${trip.id}/${locale}: missing source content ${value.slice(0,50)}`));
 assert.ok(html.includes(`rel="canonical" href="https://fabioegypt.com${route}"`));
 for(const language of ['it','en'])assert.ok(html.includes(`hreflang="${language}" href="https://fabioegypt.com/${language}/tours/${trip.slug}/"`));
 assert.equal((html.match(/data-gallery-src=/g)||[]).length,gallery.length);
 gallery.forEach(src=>assert.ok(fs.readFileSync(src.slice(1)).equals(fs.readFileSync(path.join('../public/assets/images',src.split('/catalog/')[1]))),`${trip.id}: changed gallery file ${src}`));
 for(const match of html.matchAll(/(?:src|data-gallery-src)="(\/_astro\/[^"?#]+)"/g))assert.ok(fs.existsSync(path.join('dist',decodeURIComponent(match[1]))),`${trip.id}: missing optimized file ${match[1]}`);
 const ids=Array.from(html.matchAll(/\sid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,`${trip.id}: duplicate DOM ID`);
 const linked=addons.filter(a=>a.tripId===trip.id),total=calculateTotal({adults:trip.minPax,children:0,selectedAddons:[]},{adult:trip.prices.adult,child:trip.prices.child,minPax:trip.minPax},linked);
 assert.ok(html.includes(`id="live-total-price" class="text-2xl font-bold text-white">€${total}</span>`));
 assert.ok(!html.includes('docs.google.com'));assert.ok(!html.includes('BookingManager.'));
}
console.log(`${pages.length} independent bilingual tour pages: complete source copy, prices, gallery files, stable IDs, canonical/hreflang and static booking defaults verified.`);
const reports=JSON.parse(fs.readFileSync('qa/tours/comparisons.json','utf8'));
assert.equal(reports.length,pages.length*2,'Every tour/language requires both desktop and mobile comparisons');
for(const report of reports){const {id,locale,size,astro,legacy}=report;
 assert.equal(astro.width,size==='desktop'?1440:390);assert.equal(astro.height,size==='desktop'?900:844);assert.equal(astro.width,legacy.width);assert.equal(astro.height,legacy.height);
 for(const key of Object.keys(astro.text))assert.equal(normalize(astro.text[key]||''),normalize(legacy.text[key]||''),`${id}/${locale}/${size}: changed ${key}`);
 assert.equal(astro.gallery,legacy.gallery);assert.deepEqual(astro.counts,legacy.counts);assert.deepEqual(astro.inputs,legacy.inputs);assert.deepEqual(astro.formText,legacy.formText);assert.equal(astro.overflow,legacy.overflow);
}
console.log(`${reports.length} bilingual desktop/mobile DOM comparisons match the real legacy tour renderer and form.`);
