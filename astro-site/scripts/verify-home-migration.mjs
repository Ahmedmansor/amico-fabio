import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHomeContent } from '../src/features/home/data/home.ts';
import { siteConfig } from '../src/shared/config/site.ts';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace, '..');
const normalize = value => value.replace(/\s+/g, ' ').trim();
const decode = value => value.replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10))).replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'");
for (const locale of ['it', 'en']) {
  const content = getHomeContent(locale);
  const html = fs.readFileSync(path.join(workspace, `dist/${locale}/index.html`), 'utf8');
  const text = normalize(decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ')));
  for (const value of [...Object.values(content.hero), content.global.brand_title, content.global.vip_experiences, content.global.who_is_fabio_btn, content.global.discover, ...Object.values(content.global.locations), content.reviews.title, content.reviews.subtitle, content.reviews.facebook_btn]) assert.ok(text.includes(normalize(value)), `${locale}: missing text ${value}`);
  for (const review of content.reviews.items) for (const value of [review.name, review.date, review.text]) assert.ok(text.includes(normalize(value)), `${locale}: missing review ${review.name}`);
  assert.equal((html.match(/class="review-card"/g) || []).length, content.reviews.items.length * 2);
  assert.equal((html.match(/class="lux-entry-card /g) || []).length, 3);
  for (const id of ['hero-slider-section','who-fabio','trips-grid','reviews-section','promo-banner-container']) assert.ok(html.includes(`id="${id}"`), `Missing section ${id}`);
  for (const location of ['sharm','cairo','luxor_and_aswan']) assert.ok(html.includes(`href="${siteConfig.url}/explore.html?loc=${location}"`));
  assert.ok(html.includes(`${siteConfig.url}/sharm-secrets/index.html`));
  assert.ok(html.includes(decode(siteConfig.reviewsUrl).replaceAll('&', '&amp;')) || html.includes(siteConfig.reviewsUrl));
  assert.ok(html.includes(`rel="canonical" href="${siteConfig.url}/${locale}/"`));
  for (const other of ['it','en']) assert.ok(html.includes(`hreflang="${other}" href="${siteConfig.url}/${other}/"`));
  assert.ok(!html.includes('assets/js/main.js') && !html.includes('navigator.serviceWorker') && !html.includes('fonts.googleapis.com'));
  console.log(`${locale}: all home sections, 3 destinations, 13 original reviews (26 scrolling cards), links, canonical and hreflang verified in static HTML.`);
  for (const size of ['desktop','mobile']) {
    const { astro, legacy: baseline } = JSON.parse(fs.readFileSync(path.join(workspace, `qa/home/${locale}-${size}-dom.json`), 'utf8'));
    assert.deepEqual(astro.strings, baseline.strings, `${locale}/${size}: visible content differs`);
    assert.equal(astro.overflow, false, `${locale}/${size}: horizontal overflow`);
    assert.ok(astro.images.every(image => image.complete && image.width > 0), `${locale}/${size}: image missing/unloaded`);
    console.log(`${locale}/${size}: captured browser text matches legacy exactly; images loaded; no horizontal overflow.`);
  }
}
for (const group of ['comandamenti-images','home-who-fabio','home-fabio-tours-sections']) {
  for (const file of fs.readdirSync(path.join(legacy, `public/assets/images/${group}`))) assert.ok(fs.readFileSync(path.join(legacy, `public/assets/images/${group}/${file}`)).equals(fs.readFileSync(path.join(workspace, `src/features/home/presentation/assets/${group}/${file}`))), `Changed source image ${file}`);
}
console.log('All original home source images match legacy byte-for-byte.');
