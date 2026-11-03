// One-time extraction of existing labels and CSS; never writes legacy files.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace, '..');
const write = (file, text) => { const target = path.join(workspace, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text.replace(/[\t ]+$/gm, '')); };
const html = fs.readFileSync(path.join(legacy, 'explore.html'), 'utf8');
const seo = { title: html.match(/<title>(.*?)<\/title>/)[1], description: html.match(/name="description"\s+content="([^"]+)"/)[1] };
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy, 'assets/js/image_paths.js'), 'utf8'), context);
for (const locale of ['it','en']) {
  vm.runInContext(fs.readFileSync(path.join(legacy, `assets/lang/global-${locale}.js`), 'utf8'), context);
  const dictionary = context.window[locale === 'it' ? 'i18nIt' : 'i18nEn'];
  const labels = Object.fromEntries(['price_from','discover','discover_package','premium_package','limited_time_deal','no_exclusive_experiences'].map(key => [key, dictionary.global[key]]));
  // Missing explore.title and literal pagination labels retain their existing legacy values.
  write(`src/features/explore/data/content/${locale}.json`, JSON.stringify({ seo, title: 'Esplora i Viaggi', sort: dictionary.explore, filters: dictionary.global.filters, badges: dictionary.global.badges, labels, pagination: { page: 'Page', of: 'of', previous: '←', next: '→' } }, null, 2) + '\n');
}
const postcss = createRequire(path.join(legacy, 'package.json'))('postcss');
const css = postcss.parse(fs.readFileSync(path.join(legacy, 'assets/css/style.css'), 'utf8'));
css.walkComments(comment => comment.remove());
css.walkAtRules(rule => { if (rule.name === 'import' || rule.name === 'font-face' || (rule.name.includes('keyframes') && !['priceShimmer','chipPulse','fadeInSoft','fadeInUpCard','popInCard'].includes(rule.params))) rule.remove(); });
css.walkRules(rule => {
  if (rule.parent?.type === 'atrule' && rule.parent.name.includes('keyframes')) return;
  const selectors = rule.selector.split(',').filter(selector => !selector.includes('.section-3') && !selector.includes('.details-page') && !selector.includes('.package-details-page') && /#(?:explore-grid|filter-chips|pagination-controls|price-sort)|\.(?:catalog-card|trip-card|card-|price-|label-start|deal-|discount-ribbon|standard-badge|premium-package-card|hide-scrollbar|text-gold|bg-gold|border-gold|font-playfair|font-montserrat)/.test(selector));
  if (!selectors.length) rule.remove(); else rule.selector = selectors.join(',');
});
css.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
write('src/features/explore/presentation/explore.css', '/* Legacy catalog selectors and cascade retained without restyling. */\n' + css.toString() + '\n');
console.log('Copied existing explore labels, SEO metadata and catalog CSS.');
