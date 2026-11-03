import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getGuidePage} from '../src/features/sharm-secrets/data/secrets.ts';
import {guideImageLinks} from '../src/features/sharm-secrets/domain/secrets.ts';
const root=fileURLToPath(new URL('../',import.meta.url));
const normalize=text=>text.replace(/\s/g,'');
const decode=text=>text.replace(/&#(?:x([\da-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10))).replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'");
function copyStrings(value,key='') {
  if(typeof value==='string')return ['img','hero_img','icon','nav_lang'].includes(key)?[]:[value];
  return Object.entries(value).flatMap(([key,item])=>copyStrings(item,key));
}
for(const locale of ['it','en']) {
  const page=getGuidePage(locale);
  const html=fs.readFileSync(path.join(root,`dist/${locale}/sharm-secrets/index.html`),'utf8');
  const text=normalize(decode(html.replace(/<[^>]+>/g,'')));
  for(const copy of copyStrings(page.content))assert.ok(text.includes(normalize(copy)),`${locale}: missing legacy text ${copy.slice(0,70)}`);
  for(let index=1;index<=6;index++){
    assert.ok(html.includes(`id="page${index}"`));
    assert.ok(html.includes(`href="#page${index}"`));
  }
  assert.equal((html.match(/class="catalog-card sharm-reveal"/g)||[]).length,13);
  assert.equal((html.match(/class="adventure-card sharm-reveal"/g)||[]).length,8);
  assert.equal((html.match(/--bg-image:/g)||[]).length,6);
  for(const match of html.matchAll(/(?:src|data-gallery-src)="(\/_astro\/[^"?#]+)"/g))assert.ok(fs.existsSync(path.join(root,'dist',decodeURIComponent(decode(match[1])))),`${locale}: missing generated image ${match[1]}`);
  for(const {src} of guideImageLinks(page.content)) {
    const original=fs.readFileSync(path.join(root,'../public',src));
    const migrated=fs.readFileSync(path.join(root,'src/features/sharm-secrets/presentation/assets',src.slice('/assets/images/'.length)));
    assert.ok(original.equals(migrated),`${locale}: source image changed: ${src}`);
  }
  assert.ok(!html.includes('/assets/js/main.js'));
  console.log(`${locale}: all legacy copy, 6 sections/backgrounds/index links, 13 cards, 8 gallery items and source/generated image files verified.`);
}
const comparisons=JSON.parse(fs.readFileSync(path.join(root,'qa/sharm-secrets/comparisons.json'),'utf8'));
assert.equal(comparisons.length,4);
for(const comparison of comparisons) {
  const {astro,legacy,locale,size}=comparison;
  assert.equal(astro.width,size==='desktop'?1440:390);
  assert.equal(astro.height,size==='desktop'?900:844);
  assert.equal(astro.width,legacy.width);assert.equal(astro.height,legacy.height);
  astro.sections.forEach((section,index)=>{
    assert.equal(section.id,legacy.sections[index].id);
    assert.equal(normalize(section.text),normalize(legacy.sections[index].text),`${locale}/${size}/${section.id}: changed text`);
    assert.deepEqual(section.images.map(image=>image.alt),legacy.sections[index].images.map(image=>image.alt));
    if(section.id!=='page6')assert.ok(section.images.every(image=>image.loaded),`${locale}/${size}/${section.id}: image not loaded`);
  });
  console.log(`${locale}/${size}: browser text and image identities match legacy across all 6 sections.`);
}
const gallery=JSON.parse(fs.readFileSync(path.join(root,'qa/sharm-secrets/gallery.json'),'utf8'));
assert.equal(gallery.length,8);
gallery.forEach((item,index)=>{
  assert.equal(item.caption,getGuidePage('en').content.page6.items[index].cap);
  assert.ok(item.loaded,`gallery ${index}: image did not load`);
});
console.log('All 8 gallery modal images loaded with the correct legacy captions.');
