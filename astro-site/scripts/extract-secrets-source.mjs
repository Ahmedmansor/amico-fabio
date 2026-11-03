// One-time extraction. The legacy source is read only.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace,'..');
const write = (file,text) => { const target=path.join(workspace,file); fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,text.replace(/[\t ]+$/gm,'')); };
const context = { window:{}, document:{readyState:'loading',addEventListener(){}} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy,'assets/js/image_paths.js'),'utf8'),context);
const html=fs.readFileSync(path.join(legacy,'sharm-secrets/index.html'),'utf8');
const seo={title:html.match(/<title>(.*?)<\/title>/)[1],description:html.match(/name="description"\s+content="([^"]+)"/)[1]};
for(const locale of ['it','en']) {
  vm.runInContext(fs.readFileSync(path.join(legacy,`assets/lang/global-${locale}.js`),'utf8'),context);
  const content=context.window[locale==='it'?'i18nIt':'i18nEn'].secrets;
  write(`src/features/sharm-secrets/data/content/${locale}.json`,JSON.stringify({seo,labels:{closeIndex:'Close index',closeGallery:'Close gallery',heroAlt:'Fabio',farshaAlt:'Farsha Café con lanterne',logoAlt:'Fabio Sharm Secrets logo'},content},null,2)+'\n');
}
for(const group of ['10-comandamenti-images','adventures']) fs.cpSync(path.join(legacy,`public/assets/images/${group}`),path.join(workspace,`src/features/sharm-secrets/presentation/assets/${group}`),{recursive:true});
const css=createRequire(path.join(legacy,'package.json'))('postcss').parse(fs.readFileSync(path.join(legacy,'assets/css/style.css'),'utf8'));
css.walkComments(comment=>comment.remove());
const animations=['sharmReveal','commandmentAura','commandmentTitleGlow','commandmentTextPolish','shimmerMove'];
css.walkAtRules(rule=>{if(rule.name==='import'||rule.name==='font-face'||(rule.name.includes('keyframes')&&!animations.includes(rule.params)))rule.remove();});
css.walkRules(rule=>{
  if(rule.parent?.type==='atrule'&&rule.parent.name.includes('keyframes'))return;
  const selectors=rule.selector.split(',').filter(selector=>!selector.includes('.details-page')&&!selector.includes('.package-details-page')&&/\.(?:sharm-app|sharm-reveal|section(?:[-\s.:]|$)|hero-(?:figure|photo|extra)|catalog-|golden-alert|checklist|farsha-|adventure|footer-logo|index-)/.test(selector));
  if(!selectors.length)rule.remove();else rule.selector=selectors.join(',');
});
css.walkAtRules(rule=>{if(rule.nodes&&!rule.nodes.length)rule.remove();});
// Replace the unresolved legacy relative fallback with a validated SSR image URL.
css.walkDecls(decl=>{decl.value=decl.value.replace(/var\(--bg-image,\s*url\("[^"]+"\)\)/g,'var(--bg-image)');});
write('src/features/sharm-secrets/presentation/secrets.css','/* Legacy guide selector order and values retained; backgrounds are supplied by Astro. */\n'+css.toString()+'\n');
console.log('Copied guide dictionaries, original images and CSS; no legacy files changed.');
