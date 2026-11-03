// One-time source extraction; never imported by the application.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const legacy=path.resolve(root,'..');
const feature='src/features/sharm-offer';
const write=(name,value)=>{const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value.replace(/[\t ]+$/gm,'').trimEnd()+'\n');};
const components={LandingHeader:'landing-header',HeroSection:'hero-section',WhatsAppFloat:'wa-float',WhyChooseUs:'why-section',ProgramsCards:'programs-section',TimelineSteps:'timeline-section',VideoTestimonials:'videos-section',FaqSection:'faq-section',BookingFormWidget:'booking-section',TrustBadges:'trust-section',LandingFooter:'landing-footer'};
const hosts=Object.fromEntries(Object.values(components).map(id=>[id,{innerHTML:''}]));
const context={document:{getElementById:id=>hosts[id]||null,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},setInterval(){return 0;},clearInterval(){},Date};vm.createContext(context);
const copy={},images={},requiredCopy=[];const decode=s=>s.replaceAll('&copy;','©').replaceAll('&mdash;','—').replaceAll('&times;','×').replaceAll('&quot;','"').replaceAll('&amp;','&');
for(const [name,host]of Object.entries(components)){
  let source=fs.readFileSync(path.join(legacy,`src/landing-sharm/components/${name}.js`),'utf8').replace(/export default [^;]+;/g,'').replace(/export const /g,'const ');
  vm.runInContext(`${source}\n${name}.init();`,context);
  let html=hosts[host].innerHTML.replace(/<!--[\s\S]*?-->/g,'');let index=0;
  html=html.split(/(<[^>]+>)/g).map(token=>{
    if(token.startsWith('<'))return token.replace(/(aria-label|placeholder|alt)="([^"]+)"/g,(_,attr,value)=>{const key=`${name}.${attr}.${index++}`;copy[key]=decode(value);requiredCopy.push(key);return `${attr}={copy[${JSON.stringify(key)}]}`;});
    if(!token.trim())return token;
    const key=`${name}.text.${index++}`;copy[key]=decode(token.replace(/\s+/g,' '));requiredCopy.push(key);
    if(name==='LandingFooter'&&copy[key].includes('2025 -')){copy[key]=copy[key].replace(String(new Date().getFullYear()),'{year}');return `{copy[${JSON.stringify(key)}].replace('{year}',String(new Date().getFullYear()))}`;}
    return `{copy[${JSON.stringify(key)}]}`;
  }).join('');
  html=html.replace(/<img\b([\s\S]*?)\s*\/?>/g,(_,attrs)=>{
    const src=attrs.match(/\bsrc="([^"]+)"/)[1].replace(/^\.\.\//,'/');const key=`${name}.image.${Object.keys(images).length}`;images[key]=src;
    const fixedWidth=Number(attrs.match(/\bwidth="(\d+)"/)?.[1]);
    return `<Image${attrs.replace(/\bsrc="[^"]+"/,`src={offerImage(images[${JSON.stringify(key)}])}`)} widths={${fixedWidth?`[${fixedWidth},${fixedWidth*2}]`:'[400,800,1200]'}} sizes="${fixedWidth?`${fixedWidth}px`:'(min-width:1024px) 600px, 100vw'}" />`;
  });
  html=html.replace(/href="https:\/\/wa.me\/201063239261([^\"]*)"/g,(_,query)=>`href={\`https://wa.me/\${siteConfig.whatsapp.number}${query}\`}`);
  for(const key of ['facebook','instagram','tiktok','youtube'])html=html.replace(new RegExp(`href="https:[^"]*${key==='youtube'?'youtube.com':`${key}.com`}[^"]*"`,'g'),`href={siteConfig.social.${key}}`);
  html=html.replace(/href="\/offerta-sharm\/"/g,'href={campaign.path}');
  if(name==='VideoTestimonials')html=html.replace(/class="osh-video-card"/g,'class="osh-video-card" role="button" tabindex="0"');
  let front=`import type {OfferCampaign} from '../domain/campaign';\ninterface Props {campaign:OfferCampaign}\nconst {campaign}=Astro.props;\nconst copy=campaign.copy;`;
  if(html.includes('images['))front+=`\nimport {Image} from 'astro:assets';\nimport {offerImage} from './images';\nconst images=campaign.images;`;
  if(html.includes('siteConfig.'))front+=`\nimport {siteConfig} from '../../../shared/config/site';`;
  write(`${feature}/presentation/${name}.astro`,`---\n${front}\n---\n<div id="${host}">${html}\n</div>\n`);
}
const head=fs.readFileSync(path.join(legacy,'offerta-sharm/index.html'),'utf8');
const meta=name=>head.match(new RegExp(`(?:name|property)="${name}"\\s+content="([^"]+)"`))[1];
const campaign={id:'offerta-sharm',locale:'it',locales:['it'],path:'/offerta-sharm/',copy,images,requiredCopy,seo:{title:head.match(/<title>(.*?)<\/title>/)[1],description:meta('description'),keywords:meta('keywords'),ogTitle:meta('og:title'),ogDescription:meta('og:description'),twitterDescription:meta('twitter:description')},message:{heading:'🌴 *Nuova Prenotazione — Offerta Sharm*',name:'👤 *Nome:*',date:'📅 *Data di Arrivo:*',people:'👥 *Numero di Persone:*',closing:'Ciao Fabio! Vorrei organizzare il mio viaggio in Egitto con voi e ricevere un preventivo personalizzato. 🇪🇬'}};
write(`${feature}/data/content/it.json`,JSON.stringify(campaign,null,2)+'\n');
for(const src of new Set(Object.values(images))) {
 const relative=src.slice('/assets/images/'.length),target=path.join(root,`${feature}/presentation/assets`,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(legacy,'public',src),target);
}
const css=createRequire(path.join(legacy,'package.json'))('postcss').parse(fs.readFileSync(path.join(legacy,'src/landing-sharm/landing-sharm.css'),'utf8'));
css.walkComments(comment=>comment.remove());
css.walkDecls(decl=>decl.value=decl.value.replaceAll('../../assets/fonts/','/assets/fonts/'));
css.walkRules(rule=>{
 if(rule.parent.type==='atrule'&&rule.parent.name.includes('keyframes'))return;
 rule.selector=rule.selector.split(',').map(selector=>{selector=selector.trim();if(selector===':root'||selector==='html')return 'html[data-campaign="offerta-sharm"]';if(selector==='body')return 'body[data-campaign="offerta-sharm"]';return `:where(html[data-campaign="offerta-sharm"]) ${selector}`;}).join(',\n');
});
write(`${feature}/presentation/offer.css`,css.toString()+'\n');
console.log(`Extracted ${requiredCopy.length} original copy keys, ${Object.keys(images).length} image associations and 11 campaign components.`);
