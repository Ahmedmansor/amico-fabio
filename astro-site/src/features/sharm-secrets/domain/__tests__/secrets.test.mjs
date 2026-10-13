import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
import it from '../../data/content/it.json' with {type:'json'};
import en from '../../data/content/en.json' with {type:'json'};
import {guideImageLinks,guideIndex,validateGuide,validateGuideImageIdentity,gallerySelection} from '../secrets.ts';
const images=guideImageLinks(it.content).map(item=>item.src);
test('both guide dictionaries contain exactly the complete legacy content and image links',()=>{
  const context={window:{},document:{readyState:'loading',addEventListener(){}}};vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../../../../../../assets/js/image_paths.js',import.meta.url),'utf8'),context);
  for(const [locale,page]of Object.entries({it,en})){
    vm.runInContext(fs.readFileSync(new URL(`../../../../../../assets/lang/global-${locale}.js`,import.meta.url),'utf8'),context);
    const legacy=context.window[locale==='it'?'i18nIt':'i18nEn'].secrets;
    assert.deepEqual(page.content,JSON.parse(JSON.stringify(legacy)));
    validateGuide(page,locale,images);
    validateGuideImageIdentity(it.content,page.content,locale);
  }
});
test('the six index labels use the original section order and identities',()=>{
  const entries=guideIndex(it.content);
  assert.deepEqual(entries.map(item=>item.id),['page1','page2','page3','page4','page5','page6']);
  assert.equal(entries[3].label,`4 · ${it.content.page4.list_title}`);
  assert.equal(entries[5].label,`6 · ${it.content.page6.title}`);
});
test('missing sections, text, lists and incorrect commandment counts fail clearly',()=>{
  const noTitle=structuredClone(en);delete noTitle.content.page1.headline;
  assert.throws(()=>validateGuide(noTitle,'en',images),/content.page1.headline/);
  const noSection=structuredClone(en);delete noSection.content.page5;
  assert.throws(()=>validateGuide(noSection,'en',images),/content.page5.alert/);
  const noList=structuredClone(en);delete noList.content.page4.items;
  assert.throws(()=>validateGuide(noList,'en',images),/required list content.page4.items/);
  const noDescription=structuredClone(en);delete noDescription.content.page3.rules[2].desc;
  assert.throws(()=>validateGuide(noDescription,'en',images),/content.page3.rules.2.desc/);
  const fewRules=structuredClone(en);fewRules.content.page3.rules.pop();
  assert.throws(()=>validateGuide(fewRules,'en',images),/Expected 10 commandments/);
});
test('missing files and changed translated image associations fail before rendering',()=>{
  assert.throws(()=>validateGuide(en,'en',[]),/Missing linked image secrets.page1.hero_img/);
  const changed=structuredClone(en);changed.content.page6.items[0].img=changed.content.page6.items[1].img;
  assert.throws(()=>validateGuideImageIdentity(it.content,changed.content,'en'),/Unmatched translated image links/);
});
test('gallery selections retain exact original captions and reject unknown indices',()=>{
  for(const page of [it,en])for(let index=0;index<page.content.page6.items.length;index++)assert.equal(gallerySelection(page.content.page6.items,index),page.content.page6.items[index]);
  for(const index of [-1,8,NaN,0.5])assert.throws(()=>gallerySelection(it.content.page6.items,index),/Unknown gallery index/);
});
