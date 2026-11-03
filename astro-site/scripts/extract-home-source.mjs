// One-time migration extraction; legacy files are read only.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace, '..');
const write = (relative, value) => { const target = path.join(workspace, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof value === 'string' ? value.replace(/[\t ]+$/gm, '') : value); };
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
const legacyHtml = fs.readFileSync(path.join(legacy, 'index.html'), 'utf8');
const seo = { title: legacyHtml.match(/<title>(.*?)<\/title>/)[1], description: legacyHtml.match(/name="description"\s+content="([^"]+)"/)[1] };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy, 'assets/js/image_paths.js'), 'utf8'), context);
for (const locale of ['it', 'en']) {
  vm.runInContext(fs.readFileSync(path.join(legacy, `assets/lang/global-${locale}.js`), 'utf8'), context);
  const d = context.window[locale === 'it' ? 'i18nIt' : 'i18nEn'];
  const global = Object.fromEntries(['brand_title','vip_experiences','who_is_fabio_btn','who_is_fabio_content','discover','locations'].map(key => [key,d.global[key]]));
  write(`src/features/home/data/content/${locale}.json`, JSON.stringify({ seo, hero: d.hero, global, reviews: d.reviews }, null, 2) + '\n');
}
const requireLegacy = createRequire(path.join(legacy, 'package.json'));
const css = requireLegacy('postcss').parse(fs.readFileSync(path.join(legacy, 'assets/css/style.css'), 'utf8'));
css.walkComments(comment => comment.remove());
css.walkAtRules(rule => { if (rule.name === 'import' || rule.name === 'font-face' || (rule.name.includes('keyframes') && rule.params !== 'scroll')) rule.remove(); });
css.walkRules(rule => {
  if (rule.parent?.type === 'atrule' && rule.parent.name.includes('keyframes')) return;
  if (!/#hero-slider-section|#promo-banner-container|#reviews-section|\.(?:hero-(?:slider|slide|overlay|content|title|desc|btn)|active-slide|lux-entry-|main-brand-title|who-fabio-|wf-|reviews-|review-)/.test(rule.selector)) rule.remove();
});
css.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
write('src/features/home/presentation/home.css', '/* Original home selectors and cascade copied unchanged from legacy CSS. */\n' + css.toString() + '\n');
for (const group of ['comandamenti-images','home-who-fabio','home-fabio-tours-sections']) {
  fs.cpSync(path.join(legacy, `public/assets/images/${group}`), path.join(workspace, `src/features/home/presentation/assets/${group}`), { recursive: true });
}
write('public/assets/images/comandamenti-images/1.webp', fs.readFileSync(path.join(legacy, 'public/assets/images/comandamenti-images/1.webp')));
write('public/assets/images/icons/close-icon.svg', fs.readFileSync(path.join(legacy, 'public/assets/images/icons/close-icon.svg'), 'utf8'));
let who = fs.readFileSync(path.join(legacy, 'assets/js/modules/who-fabio.js'), 'utf8');
who = who.replace("    window.addEventListener('langChanged', this.onLangChanged);", '').replace("    window.removeEventListener('langChanged', this.onLangChanged);", '');
who = who.replace(/  setBioText\(\) \{[\s\S]*?\n  tick\(\)/, '  setBioText() { /* Translated biography is rendered by Astro. */ }\n  tick()');
who = who.replace(/\s*console\.log\([^\n]+\);/g, '');
who = who.slice(0, who.indexOf('window.WhoFabioParallax =')) + "\nconst container = document.getElementById('who-fabio');\nif (container) new WhoFabioParallax(container);\n";
write('src/features/home/presentation/who-fabio.js', who);
console.log('Extracted exact home dictionaries, styles, images and feature-local parallax.');
