import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getExploreCards, getExploreMessages } from '../src/features/explore/data/explore.mjs';
import { exploreLocations, selectExploreItems, cardBadge } from '../src/features/explore/domain/explore.ts';
import { siteConfig } from '../src/shared/config/site.ts';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const cards = await getExploreCards();
const decode = value => value.replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10))).replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'");
const normalize = value => value.replace(/\s+/g, ' ').trim();
const textOf = html => normalize(decode(html.replace(/<[^>]*>/g,' ')));
for (const locale of ['it','en']) for (const location of exploreLocations) {
  const route = `${locale}/explore/${location === 'all' ? '' : `${location}/`}`;
  const html = fs.readFileSync(path.join(workspace,`dist/${route}index.html`),'utf8');
  const expected = selectExploreItems(cards,location);
  const articles = Array.from(html.matchAll(/<article\b[\s\S]*?<\/article>/g), match => match[0]);
  assert.equal(articles.length,expected.length,`${route}: record count differs from live data`);
  const messages = getExploreMessages(locale);
  articles.forEach((article,index) => {
    const card = expected[index];
    assert.ok(article.includes(`data-trip-id="${card.id}"`),`${route}: ID/order mismatch`);
    const text = textOf(article);
    assert.ok(text.includes(normalize(card.offer.text[locale].title)),`${card.id}: missing title`);
    assert.ok(text.includes(normalize(card.offer.text[locale].short_desc)),`${card.id}: missing description`);
    assert.ok(text.includes(`€${card.displayPrice}`),`${card.id}: wrong final price`);
    assert.ok(!/class="[^"]*(?:price-old|deal-banner|discount-ribbon|deal-inline)/.test(article),`${card.id}: discount markup remains`);
    const badge = cardBadge(card,locale,messages);
    if (badge) assert.ok(text.includes(badge),`${card.id}: missing badge`);
    assert.ok(article.includes(`/${locale}/${card.kind === 'package' ? 'packages' : 'tours'}/${card.offer.slug}/`));
    assert.equal(/\shidden(?:\s|>)/.test(article.split('>')[0] + '>'),index >= 9,`${card.id}: incorrect initial pagination`);
    assert.ok(/<img\b[^>]*width="\d+"[^>]*height="\d+"/.test(article),`${card.id}: missing image dimensions`);
  });
  assert.ok(html.includes(`rel="canonical" href="${siteConfig.url}/${route}"`));
  for (const other of ['it','en']) assert.ok(html.includes(`hreflang="${other}" href="${siteConfig.url}/${other}/explore/${location === 'all' ? '' : `${location}/`}"`));
  assert.ok(!html.includes('assets/js/main.js') && !html.includes('sessionStorage.getItem(\'fabio_data_cache\')'));
  assert.ok(html.includes('<noscript>') && html.includes('[data-explore-card][hidden]{display:flex!important}'));
  console.log(`${route}: ${expected.length} original records; text, prices, badges, posters, detail IDs, pagination and language URLs verified.`);
}
const comparisons = JSON.parse(fs.readFileSync(path.join(workspace,'qa/explore/comparisons.json'),'utf8'));
assert.equal(comparisons.length,16);
for (const comparison of comparisons) {
  const { astro, legacy } = comparison;
  assert.equal(astro.width,comparison.size === 'mobile' ? 390 : 1440);
  assert.equal(astro.width,legacy.width); assert.equal(astro.height,legacy.height);
  assert.deepEqual(astro.filters,legacy.filters); assert.deepEqual(astro.sortOptions,legacy.sortOptions);
  const content = data => data.cards.map(({image,target,...record})=>record);
  assert.deepEqual(content(astro),content(legacy),`${comparison.locale}/${comparison.size}/${comparison.location}: content mismatch`);
  assert.ok(astro.cards.every(card => card.image.complete && card.image.width > 0));
  assert.equal(astro.overflow,false);
  for (let i=0;i<astro.cards.length;i++) {
    const card = astro.cards[i];
    assert.equal(card.image.alt,legacy.cards[i].image.alt);
    assert.ok(card.target.includes(`id=${encodeURIComponent(card.id)}`));
    assert.ok(legacy.cards[i].target.includes(`id=${encodeURIComponent(card.id)}`));
  }
}
const interactions = JSON.parse(fs.readFileSync(path.join(workspace,'qa/explore/interactions.json'),'utf8'));
assert.equal(interactions.length,30); assert.ok(interactions.every(check=>check.equal));
const pagination = JSON.parse(fs.readFileSync(path.join(workspace,'qa/explore/pagination.json'),'utf8'));
assert.equal(pagination.length,6); assert.ok(pagination.every(check=>check.equal));
console.log('Stored migration baseline: 16 page comparisons, 30 filter/sort checks and 6 pagination checks matched legacy before the approved single-price change. Run verify-single-price.mjs for current browser evidence.');
for (const file of fs.readdirSync(path.join(workspace,'dist/_astro')).filter(file=>file.endsWith('.js'))) {
  assert.ok(!fs.readFileSync(path.join(workspace,'dist/_astro',file),'utf8').includes('docs.google.com/spreadsheets'),`${file}: spreadsheet access leaked into browser JavaScript`);
}
console.log('Generated noscript catalog and absence of Google Sheets endpoints in browser bundles verified.');
