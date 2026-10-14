import fs from 'node:fs';import {createRequire} from 'node:module';
const write=(file,text)=>{fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,text.replace(/[\t ]+$/gm,'').trimEnd()+'\n');};
const source=fs.readFileSync('../welcome/','utf8');
const scriptUrl=source.match(/const scriptURL\s*=\s*"([^"]+)"/)[1];
const copy={id:'welcome',locale:'it',path:'/welcome/',title:source.match(/<title>(.*?)<\/title>/)[1],description:'Scarica la guida esclusiva per scoprire la vera Sharm.',pending:'Invio in corso...',error:'Errore di connessione! Riprova.',message:'Ciao Fabio! Sono {name}. Ho visto il tuo sito e voglio il catalogo VIP.',scriptUrl};
write('src/features/welcome/data/content/it.json',JSON.stringify(copy,null,2));
let body=source.match(/<body[^>]*>([\s\S]*?)<script src=/)[1];
body=body.replace(/<img\b[^>]*src="assets\/images\/home-who-fabio\/home-who-fabio-preson.webp"[^>]*>/,'<Image src={portrait} alt="Fabio" class="w-full h-full object-cover" widths={[96,192]} sizes="96px"/>');
body=body.replace(/<img\b[^>]*src="assets\/images\/ui\/placeholder.webp"[^>]*alt="([^"]+)"[^>]*>/g,'<Image src={placeholder} alt="$1" class="w-full h-auto" widths={[400,800]} sizes="(min-width:448px) 448px, 100vw"/>');
const float=fs.readFileSync('../assets/js/modules/ui-layout.js','utf8').match(/div.innerHTML = `([\s\S]*?)`;\s*document.body.appendChild/)[1];
write('src/features/welcome/presentation/WelcomePage.astro',`---
import {Image} from 'astro:assets';
import DocumentShell from '../../../shared/layouts/DocumentShell.astro';
import PageHead from '../../../shared/seo/PageHead.astro';
import {siteConfig} from '../../../shared/config/site';
import type {getWelcome} from '../data/welcome.mjs';
import portrait from './assets/portrait.webp';
import placeholder from './assets/placeholder.webp';
import './welcome.css';
interface Props {campaign:ReturnType<typeof getWelcome>}
const {campaign}=Astro.props;
const config=JSON.stringify(campaign).replaceAll('<','\\u003c');
---
<DocumentShell locale="it" campaign="welcome" bodyClass="bg-sharm-hero min-h-screen flex flex-col items-center justify-start p-4 relative overflow-y-auto">
 <PageHead slot="head" locale="it" route="" title={campaign.title} description={campaign.description} canonicalPath={campaign.path} alternatePaths={{it:campaign.path}}/>
 ${body}
 <a id="whatsapp-float" class="fab-base floating-whatsapp" href={\`https://wa.me/\${siteConfig.whatsapp.number}\`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${float}</a>
 <script id="welcome-config" type="application/json" is:inline set:html={config}/>
</DocumentShell>
<script>import './interactions';</script>`);
const postcss=createRequire(new URL('../../package.json',import.meta.url))('postcss');
const css=postcss.parse(fs.readFileSync('../assets/css/style.css','utf8'));
css.walkComments(c=>c.remove());
css.walkAtRules(rule=>{if(rule.name==='import'||rule.name.includes('keyframes')&&!['pulse-custom','pulse-ring'].includes(rule.params))rule.remove();});
css.walkRules(rule=>{if(rule.parent.type==='atrule'&&rule.parent.name.includes('keyframes'))return;const selectors=rule.selector.split(',').map(s=>s.trim()).filter(s=>['html','body','h1','h2','h3'].includes(s)||/bg-sharm-hero|glass-card|animate-pulse-btn|^\.fab-base|^\.floating-whatsapp/.test(s));if(!selectors.length){rule.remove();return;}rule.selector=selectors.map(s=>s==='html'?'html[data-campaign="welcome"]':s==='body'?'html[data-campaign="welcome"] body':`html[data-campaign="welcome"] ${s}`).join(',');});
css.walkAtRules(rule=>{if(rule.nodes&&!rule.nodes.length)rule.remove();});
let styles=css.toString().replaceAll("url('../fonts/","url('/assets/fonts/").replaceAll('url("../bg.jpeg")','url("./assets/bg.jpeg")').replaceAll('url("../bg-mobile.jpg")','url("./assets/bg-mobile.jpg")');
write('src/features/welcome/presentation/welcome.css','@import "tailwindcss";\n'+styles+'\nhtml[data-campaign="welcome"] body { padding: 1rem; }\n');
for(const [from,to]of [['public/assets/bg.jpeg','bg.jpeg'],['public/assets/bg-mobile.jpg','bg-mobile.jpg'],['public/assets/images/ui/placeholder.webp','placeholder.webp'],['public/assets/images/home-who-fabio/home-who-fabio-preson.webp','portrait.webp']]){const target='src/features/welcome/presentation/assets/'+to;fs.mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});fs.copyFileSync('../'+from,target);}
console.log('Extracted welcome campaign source, original copy, public endpoint, CSS and four exact source assets.');
