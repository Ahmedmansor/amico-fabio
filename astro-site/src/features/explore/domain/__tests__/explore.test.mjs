import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { fixtureProvider } from '../../../../../qa/data/fixtures.mjs';
import { getExploreCards, getExploreMessages } from '../../data/explore.mjs';
import { exploreLocations, exploreSeo, selectExploreItems, exploreCategories, paginateExplore, toExploreCard, cardBadge, categoryLabel, validateExploreMessages, restoreExploreState } from '../explore.ts';
import { supportedLocales } from '../../../../shared/config/languages.ts';
const cards = await getExploreCards(fixtureProvider());
const context = { window: { addEventListener() {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../../../../../../assets/js/modules/explore-renderer.js', import.meta.url), 'utf8'), context);
vm.runInContext(fs.readFileSync(new URL('../../../../../../assets/js/modules/trips-renderer.js', import.meta.url), 'utf8'), context);
const legacy = context.window.ExploreRenderer;
const renderer = context.window.TripsRenderer;
test('location, category and all sort orders produce exactly the legacy IDs/order', () => {
  for (const location of exploreLocations) {
    const raw = legacy._filterTrips(cards.map(card => card.offer.source),location);
    for (const category of exploreCategories(cards,location)) for (const sort of ['default','price_asc','price_desc']) {
      legacy.state.sort = sort;
      const filtered = category === 'all' ? raw : raw.filter(row => legacy.resolveCategory(row) === category);
      const expected = Array.from(legacy.sortTrips([...filtered]), row => row.trip_id || row.package_id);
      assert.deepEqual(selectExploreItems(cards,location,category,sort).map(card => card.id),expected,`${location}/${category}/${sort}`);
      // Pre-rendered DOM starts in recommended order; price ties must still retain source order.
      const domOrder = selectExploreItems(cards,location);
      assert.deepEqual(selectExploreItems(domOrder,location,category,sort).map(card => card.id),expected);
    }
  }
});
test('all card prices use the final booking amount and retain existing editorial badges', () => {
  for (const locale of ['it','en']) {
    const m = getExploreMessages(locale);
    const dictionary = { global: { ...m.labels, badges:m.badges } };
    for (const card of cards) {
      assert.equal(card.displayPrice,card.offer.prices.adult,card.id);
      assert.deepEqual(Object.keys(card.offer.prices).sort(),['adult','child']);
      assert.equal(cardBadge(card,locale,m),card.offer.source.badge_key==='HOT_DEAL'?'':renderer._resolveBadge(card.offer.source,locale,dictionary));
    }
  }
});
test('explicit zero is the same card, sort and booking amount', () => {
  const offer = structuredClone(cards[0].offer); offer.prices.adult = 0;
  const card = toExploreCard(offer,'trip');
  assert.equal(card.displayPrice,0); assert.equal(card.offer.prices.adult,0);
});
test('pagination keeps nine per page, clamps invalid requests and supports empty results', () => {
  assert.equal(paginateExplore(cards,1).items.length,9);
  assert.equal(paginateExplore(cards,2).items[0],cards[9]);
  assert.equal(paginateExplore(cards,Infinity).page,1);
  assert.equal(paginateExplore(cards,99).page,4);
  assert.equal(paginateExplore([],2).totalPages,0);
  assert.equal(selectExploreItems(cards,'unknown').length,0);
});
test('missing badge or category translations are build errors', () => {
  const m = structuredClone(getExploreMessages('en')); m.badges = {};
  assert.throws(() => cardBadge(cards.find(card => card.offer.source.badge_key), 'en',m), /Missing en badge translation/);
  m.filters = {};
  assert.throws(() => categoryLabel('sea',m), /Missing translated category sea/);
  m.labels.price_from = '';
  assert.throws(() => validateExploreMessages(m,'en'), /Missing required text messages.labels.price_from/);
});
test('fresh visits reset preferences, returning from details restores them, language query retains them', () => {
  const empty = { sort:null, category:null, page:null };
  const stored = { sort:'price_desc', category:'sea', page:'2' };
  assert.deepEqual(restoreExploreState(empty,stored,false,['all','sea']), {sort:'default',category:'all',page:1});
  assert.deepEqual(restoreExploreState(empty,stored,true,['all','sea']), {sort:'price_desc',category:'sea',page:2});
  assert.deepEqual(restoreExploreState(stored,empty,false,['all','sea']), {sort:'price_desc',category:'sea',page:2});
  assert.deepEqual(restoreExploreState({sort:'invalid',category:'missing',page:'-2'},empty,false,['all']), {sort:'default',category:'all',page:-2});
});

test('destination metadata is distinct in every published language and missing destinations fail validation', () => {
  for (const locale of supportedLocales) {
    const messages = getExploreMessages(locale);
    const metadata = exploreLocations.map(location => exploreSeo(messages,location));
    assert.equal(new Set(metadata.map(value => value.title)).size,exploreLocations.length,locale);
    assert.equal(new Set(metadata.map(value => value.description)).size,exploreLocations.length,locale);
    assert.deepEqual(metadata[0], {title:messages.seo.title,description:messages.seo.description});
    const broken = structuredClone(messages);
    delete broken.seo.destinations.cairo;
    assert.throws(() => validateExploreMessages(broken,locale), /messages.seo.destinations.cairo/);
  }
});
