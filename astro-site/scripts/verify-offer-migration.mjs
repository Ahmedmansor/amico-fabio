import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {getOfferCampaign} from '../src/features/sharm-offer/data/campaign.ts';
const campaign=getOfferCampaign(),html=fs.readFileSync('dist/offerta-sharm/index.html','utf8');
const decode=text=>text.replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10))).replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
const normalize=text=>text.replace(/\s+/g,' ').trim();
for(const [key,copy]of Object.entries(campaign.copy))assert.ok(normalize(decode(html)).includes(normalize(copy.replace('{year}',String(new Date().getFullYear())))),`Missing source copy ${key}`);
for(const src of new Set(Object.values(campaign.images))){assert.ok(fs.readFileSync(path.join('../public',src)).equals(fs.readFileSync(path.join('src/features/sharm-offer/presentation/assets',src.slice('/assets/images/'.length)))),`Changed original image ${src}`);}
for(const match of html.matchAll(/src="(\/_astro\/[^"?#]+)"/g))assert.ok(fs.existsSync(path.join('dist',decodeURIComponent(match[1]))),`Missing optimized image ${match[1]}`);
const ids=Array.from(html.matchAll(/\sid="([^"]+)"/g),match=>match[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate element ID');
for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),`Unknown anchor ${match[1]}`);
assert.ok(html.includes('rel="canonical" href="https://fabioegypt.com/offerta-sharm/"'));
assert.ok(!html.includes('hreflang="en"'));assert.ok(!html.includes('global-header'));
assert.equal((html.match(/data-video-id=/g)||[]).length,6);assert.equal((html.match(/class="osh-program-card"/g)||[]).length,8);
const reports=JSON.parse(fs.readFileSync('qa/sharm-offer/comparisons.json','utf8'));
assert.equal(reports.length,2);
for(const {size,astro,legacy}of reports){
 assert.equal(astro.width,size==='desktop'?1440:390);assert.equal(astro.height,size==='desktop'?900:844);assert.equal(astro.width,legacy.width);assert.equal(astro.height,legacy.height);assert.equal(astro.overflow,false);
 assert.equal(astro.blocks.length,11);astro.blocks.forEach((block,index)=>{const old=legacy.blocks[index];assert.equal(block.id,old.id);assert.equal(block.text.replace(/\s/g,''),old.text.replace(/\s/g,''),`${size}/${block.id}: changed text`);assert.deepEqual(block.images.map(i=>i.alt),old.images.map(i=>i.alt));assert.deepEqual(block.links,old.links);if(block.id!=='videos-section')assert.ok(block.images.every(i=>i.loaded),`${size}/${block.id}: image did not load`);});
 assert.deepEqual(astro.inputs,legacy.inputs);assert.deepEqual(astro.videos,legacy.videos);
 console.log(`${size}: 11 original blocks, all text/image/link identities and form defaults match legacy; no horizontal overflow.`);
}
const interactions=JSON.parse(fs.readFileSync('qa/sharm-offer/interactions.json','utf8'));
assert.equal(interactions.faq.filter(item=>item.expanded==='true')[0].id,'faq-btn-faq-2');assert.equal(interactions.emptyForm.length,2);assert.equal(interactions.invalidPeople.length,3);assert.equal(interactions.videos.length,6);assert.ok(interactions.videoClosed);
interactions.videos.forEach((item,index)=>assert.ok(item.src.includes(`/video/${reports[0].astro.videos[index]}?autoplay=1&dnt=1`)));
console.log('136 source copy keys, original image bytes, optimized files, Italian-only SEO, anchors, FAQ/form errors and all six Vimeo IDs verified.');
