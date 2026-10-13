// One-time migration extraction. Never edits legacy files.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace, '..');
const requireLegacy = createRequire(path.join(legacy, 'package.json'));
const postcss = requireLegacy('postcss');
const write = (relative, content) => {
  const target = path.join(workspace, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy, 'assets/js/image_paths.js'), 'utf8'), context);
for (const locale of ['it', 'en']) {
  vm.runInContext(fs.readFileSync(path.join(legacy, `assets/lang/global-${locale}.js`), 'utf8'), context);
  const source = context.window[locale === 'it' ? 'i18nIt' : 'i18nEn'];
  write(`src/features/legal/data/content/${locale}.json`, JSON.stringify(source.legal_page, null, 2) + '\n');
  const shared = {
    menu: source.menu,
    footer: source.footer,
    fab: source.fab,
    global: { brand_subtitle: source.global.brand_subtitle, why_fabio: source.global.why_fabio },
    // Existing literal labels are retained, including legacy labels shared by both languages.
    labels: { links: 'Links', closeIndex: 'Close index', menu: 'Menu', headerLogo: 'Fabio Tours Logo', footerLogo: 'FABIO', crossRootsLogo: 'Cross Roots Logo' },
  };
  write(`src/shared/i18n/dictionaries/${locale}.json`, JSON.stringify(shared, null, 2) + '\n');
}

const css = postcss.parse(fs.readFileSync(path.join(legacy, 'assets/css/style.css'), 'utf8'));
const relevant = /(?:^|[\s,])(?:html|body|h1|h2|h3|:root)(?:[\s,:.#]|$)|#(?:global-header|scroll-progress)|\.(?:gh-|af-|fab-|fab-hidden|floating-whatsapp|wa-|index-menu|index-link|legal-|heading-|gold-list|chip|animate-fade-up|delay-)/;
const legalSelector = /\.(?:legal-|heading-|gold-list|chip|index-menu|index-link)/;
const retainedAnimations = new Set(['fadeInUp', 'whatsappPulse', 'whatsappWiggle', 'compassRotate']);
for (const [filename, wantLegal] of [['src/shared/styles/legacy-shell.css', false], ['src/features/legal/presentation/legal.css', true]]) {
  const root = css.clone();
  root.walkComments(comment => comment.remove());
  root.walkAtRules(rule => {
    if (rule.name === 'import' || (rule.name.includes('keyframes') && (wantLegal || !retainedAnimations.has(rule.params))) || (wantLegal && rule.name === 'font-face')) rule.remove();
  });
  root.walkRules(rule => {
    if (rule.parent?.type === 'atrule' && rule.parent.name.includes('keyframes')) return;
    if (!relevant.test(rule.selector) || legalSelector.test(rule.selector) !== wantLegal) rule.remove();
  });
  root.walkAtRules(rule => { if (rule.nodes && rule.nodes.length === 0) rule.remove(); });
  root.walkDecls(decl => { decl.value = decl.value.replaceAll('../fonts/', '/assets/fonts/'); });
  write(filename, '/* Extracted from legacy CSS; original selector order and values retained. */\n' + root.toString() + '\n');
}

for (const font of fs.readdirSync(path.join(legacy, 'assets/fonts'))) {
  write(`public/assets/fonts/${font}`, fs.readFileSync(path.join(legacy, 'assets/fonts', font)));
}
for (const group of ['legal', 'social']) {
  for (const icon of fs.readdirSync(path.join(legacy, `public/assets/images/icons/${group}`))) {
    write(`public/assets/images/icons/${group}/${icon}`, fs.readFileSync(path.join(legacy, `public/assets/images/icons/${group}`, icon)));
  }
}
for (const logo of ['fabio-header-logo.webp', 'cross-roots-logo.webp', 'logo-fabio-square.webp']) {
  write(`src/shared/assets/logos/${logo}`, fs.readFileSync(path.join(legacy, `public/assets/images/logo/${logo}`)));
}
write('public/assets/images/icons/menu-icon.webp', fs.readFileSync(path.join(legacy, 'public/assets/images/icons/menu-icon.webp')));
const header = fs.readFileSync(path.join(legacy, 'assets/js/modules/global-header.js'), 'utf8');
const flagCode = header.slice(header.indexOf('const flagSvg'), header.indexOf('const markup'));
const flags = [...flagCode.matchAll(/return `([\s\S]*?)`;/g)];
if (flags.length !== 2) throw new Error('Expected the two legacy flag SVGs.');
for (const [index, locale] of ['en', 'it'].entries()) write(`public/assets/images/icons/languages/${locale}.svg`, flags[index][1].trim() + '\n');
console.log('Extracted legal dictionaries, shared labels, scoped CSS, local fonts, icons and logos from legacy source.');
