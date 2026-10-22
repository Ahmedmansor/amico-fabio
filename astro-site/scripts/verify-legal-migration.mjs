import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getLegalPage } from '../src/features/legal/data/legal.ts';
import { siteConfig } from '../src/shared/config/site.ts';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace, '..');
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy, 'assets/js/image_paths.js'), 'utf8'), context);
const normalize = value => value.replace(/\s+/g, ' ').trim();
const decode = value => value.replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10))).replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'");

for (const locale of ['it', 'en']) {
  vm.runInContext(fs.readFileSync(path.join(legacy, `assets/lang/global-${locale}.js`), 'utf8'), context);
  const source = context.window[locale === 'it' ? 'i18nIt' : 'i18nEn'];
  const page = getLegalPage(locale);
  const legacyPage=JSON.parse(JSON.stringify(source.legal_page));
  const cookieSection=page.sections.find(section=>section.id==='cookies');
  assert.equal(cookieSection.paragraphs.length,2);
  assert.ok(cookieSection.paragraphs.join(' ').includes('fabio_consent'));
  assert.ok(cookieSection.paragraphs.join(' ').includes('182'));
  // Approved consent implementation updates only the cookie-policy paragraphs.
  legacyPage.sections.find(section=>section.id==='cookies').paragraphs=cookieSection.paragraphs;
  assert.deepEqual(page, legacyPage, `${locale}: unrelated legal content differs from the legacy dictionary`);
  const shared = JSON.parse(fs.readFileSync(path.join(workspace, `src/shared/i18n/dictionaries/${locale}.json`), 'utf8'));
  for (const key of ['menu', 'footer', 'fab']) assert.deepEqual(shared[key], JSON.parse(JSON.stringify(source[key])));
  assert.equal(shared.global.brand_subtitle, source.global.brand_subtitle);
  assert.equal(shared.global.why_fabio, source.global.why_fabio);
  const html = fs.readFileSync(path.join(workspace, `dist/${locale}/legal/index.html`), 'utf8');
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const text = normalize(decode(withoutScripts.replace(/<[^>]*>/g, ' ')));
  assert.equal((withoutScripts.match(/class="legal-section"/g) || []).length, page.sections.length);
  for (const section of page.sections) {
    assert.ok(text.includes(normalize(section.heading)), `${locale}:${section.id} heading missing from static HTML`);
    for (const paragraph of section.paragraphs) assert.ok(text.includes(normalize(paragraph.replace(/^•\s*/, ''))), `${locale}:${section.id} paragraph missing from static HTML`);
    assert.ok(html.includes(`href="#${section.id}"`), `${locale}:${section.id} index link missing`);
  }
  assert.ok(html.includes(`lang="${locale}"`));
  assert.ok(html.includes(`rel="canonical" href="${siteConfig.url}/${locale}/legal/"`));
  for (const alternate of ['it', 'en']) assert.ok(html.includes(`hreflang="${alternate}" href="${siteConfig.url}/${alternate}/legal/"`));
  assert.ok(html.includes(siteConfig.analytics.measurementId));
  assert.ok(!html.includes('navigator.serviceWorker'));
  assert.ok(!html.includes('assets/js/main.js'));
  assert.ok(!html.includes('fonts.googleapis.com'));
  console.log(`${locale}: ${page.sections.length} sections verified; legacy content preserved except approved cookie-policy paragraphs. Static content, anchors, canonical, hreflang and analytics configuration verified.`);
}

for (const group of ['legal', 'social']) for (const icon of fs.readdirSync(path.join(legacy, `public/assets/images/icons/${group}`))) {
  assert.ok(fs.readFileSync(path.join(legacy, `public/assets/images/icons/${group}/${icon}`)).equals(fs.readFileSync(path.join(workspace, `public/assets/images/icons/${group}/${icon}`))));
}
for (const font of fs.readdirSync(path.join(legacy, 'assets/fonts'))) assert.ok(fs.readFileSync(path.join(legacy, `assets/fonts/${font}`)).equals(fs.readFileSync(path.join(workspace, `public/assets/fonts/${font}`))));
for (const logo of ['fabio-header-logo.webp', 'cross-roots-logo.webp', 'logo-fabio-square.webp']) assert.ok(fs.readFileSync(path.join(legacy, `public/assets/images/logo/${logo}`)).equals(fs.readFileSync(path.join(workspace, `src/shared/assets/logos/${logo}`))));
const footerSource = fs.readFileSync(path.join(legacy, 'assets/js/modules/global-footer.js'), 'utf8');
for (const url of Object.values(siteConfig.social)) assert.ok(footerSource.includes(url));
assert.ok(fs.readFileSync(path.join(legacy, 'assets/js/modules/global-header.js'), 'utf8').includes(siteConfig.whatsapp.number));
console.log('Local fonts, legal/social icons, original logos, social URLs and WhatsApp number match the legacy source.');
