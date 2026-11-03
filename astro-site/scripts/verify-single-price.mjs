import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fixtureProvider } from '../qa/data/fixtures.mjs';
import { getCatalog } from '../src/shared/data/catalog.mjs';
import { getExploreMessages } from '../src/features/explore/data/explore.mjs';
import { exploreLocations } from '../src/features/explore/domain/explore.ts';

const catalog = await getCatalog(fixtureProvider());
const forbidden = /class="[^"]*(?:price-old|line-through|deal-banner|discount-ribbon|deal-inline)/;
let details = 0, cardCount = 0;
for (const locale of ['it','en']) {
  const label = JSON.parse(fs.readFileSync(`src/shared/i18n/dictionaries/${locale}.json`,'utf8')).global.price_from;
  for (const [kind, offers] of [['tours',catalog.trips],['packages',catalog.packages]]) {
    for (const offer of offers) {
      const html = fs.readFileSync(`dist/${locale}/${kind}/${offer.slug}/index.html`, 'utf8');
      assert.ok(!forbidden.test(html), `${locale}/${offer.id}: discount markup`);
      assert.ok(html.includes(label), `${locale}/${offer.id}: missing starts-from label`);
      assert.ok(html.includes(`id="card-price" class="text-4xl font-playfair font-bold text-gold">€${offer.prices.adult}</span>`), offer.id);
      assert.ok(html.includes(`id="live-total-price" class="text-2xl font-bold text-white">€${offer.prices.adult*offer.minPax}</span>`), offer.id);
      for (const match of html.matchAll(/(?:src|data-gallery-src)="(\/_astro\/[^"?#]+)"/g)) {
        assert.ok(fs.existsSync(`dist${decodeURIComponent(match[1])}`), `${offer.id}: missing optimized image ${match[1]}`);
      }
      details++;
    }
  }
  for (const location of exploreLocations) {
    const html = fs.readFileSync(`dist/${locale}/explore/${location === 'all' ? '' : location+'/'}index.html`, 'utf8');
    const articles = Array.from(html.matchAll(/<article\b[\s\S]*?<\/article>/g), m=>m[0]);
    for (const article of articles) {
      const id = article.match(/data-trip-id="([^"]+)"/)[1];
      const offer = [...catalog.trips,...catalog.packages].find(item=>item.id===id);
      assert.ok(offer, `Unknown card ${id}`);
      assert.ok(article.includes(`data-price="${offer.prices.adult}"`), id);
      assert.ok(article.includes(`€${offer.prices.adult}</span>`), id);
      assert.ok(article.includes(getExploreMessages(locale).labels.price_from), id);
      assert.ok(!forbidden.test(article), id);
      assert.ok(article.includes(`/${locale}/${catalog.trips.includes(offer)?'tours':'packages'}/${offer.slug}/`), `${id}: missing detail link`);
      cardCount++;
    }
  }
}
console.log(`${details} bilingual detail pages and ${cardCount} rendered catalog cards: one adult amount, starts-from labels, correct totals/links, no discount markup.`);
const reports = JSON.parse(fs.readFileSync('qa/single-price/comparisons.json','utf8'));
assert.equal(reports.length,24);
const compact = value=>value.replace(/\s/g,'');
for (let i=0;i<reports.length;i+=2) {
  const legacy=reports[i], astro=reports[i+1];
  const context=`${astro.locale}/${astro.kind}/${astro.size}`;
  assert.equal(astro.version,'astro');assert.equal(legacy.version,'legacy');
  assert.equal(astro.width,legacy.width,context);assert.equal(astro.height,legacy.height,context);
  assert.equal(astro.width,astro.size==='mobile'?390:1440,context);
  assert.equal(astro.lang,astro.locale,context);assert.equal(legacy.lang,legacy.locale,context);
  assert.equal(astro.overflow,false,context);assert.equal(astro.priceMarkers,0,context);
  for (const key of Object.keys(legacy.details)) assert.equal(compact(astro.details[key]),compact(legacy.details[key]),`${context}/${key}`);
  const content = data=>data.cards.map(({price,...record})=>record);
  assert.deepEqual(content(astro),content(legacy),context);
  // Gallery thumbnails with empty alt can be horizontally offscreen and remain lazy.
  // Their generated file existence is checked above, independently of lazy loading.
  assert.ok(astro.images.filter(image=>image.alt).every(image=>image.complete&&image.width>0), `${context}: visible named image missing`);
  assert.deepEqual(astro.images.map(image=>image.alt),legacy.images.map(image=>image.alt),`${context}: image alt mismatch`);
}
console.log('12 matching mobile/desktop IT/EN browser comparisons: content, images, order and totals retained; approved price markup changes verified.');
