import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),legacy=path.resolve(root,'..');
const write=(name,value)=>{const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value.replace(/[\t ]+$/gm,'').trimEnd()+'\n');};
const context={window:{},document:{readyState:'loading',addEventListener(){}}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy,'assets/js/image_paths.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(legacy,'assets/js/trips_metadata.js'),'utf8'),context);
write('src/features/tours/data/content/gallery-counts.json',JSON.stringify(context.window.TripsMetadata,null,2));
for(const locale of ['it','en']){
 vm.runInContext(fs.readFileSync(path.join(legacy,`assets/lang/global-${locale}.js`),'utf8'),context);
 const source=context.window[locale==='it'?'i18nIt':'i18nEn'];
 const file=`src/shared/i18n/dictionaries/${locale}.json`,existing=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
 existing.global=source.global;existing.faq=source.faq;
 existing.detailLabels={heroAlt:'Trip Image',invoice:'Invoice Summary',cancel:'Cancel',confirm:'Confirm',trip:'Trip:',name:'Name:',nation:'Nationality:',date:'Date:',pax:'Pax:',adults:'Adults',children:'Kids',extras:'Extras:',total:'Total Estimate:'};
 write(file,JSON.stringify(existing,null,2));
}
const booking=fs.readFileSync(path.join(legacy,'assets/js/modules/booking-manager.js'),'utf8');
const countries=vm.runInNewContext(booking.match(/const countries = (\[[\s\S]*?\n      \]);/)[1]);
write('src/features/booking/data/content/countries.json',JSON.stringify(countries,null,2));
const functions=['_renderTextFields','_renderPaxControls','_renderAddons'].map(name=>{
 const body=booking.match(new RegExp(`${name}: \\(([^)]*)\\) => \\{([\\s\\S]*?)\\n  \\},`));
 return `function ${name}(${body[1]}${name==='_renderTextFields'?'':',state'}) {${body[2].replaceAll('BookingManager.state','state')}\n}`;
}).join('\n');
const flag=booking.match(/const flagSvg = ([\s\S]*?);\s+const countries/)[1];
const formCode=`${functions}\nexport const flagSvg=${flag};\nexport function formHtml(state,prices,g,lang){\nconst txt={name:g.full_name,nation:g.nationality,date:g.trip_date,adults:g.adults_12_plus||g.pricing.adult,children:g.children_2_11||g.pricing.child,addons:g.addons_extras,select_country:g.select_country};\nreturn (_renderTextFields(txt,g,lang)+_renderPaxControls(txt,prices,state)+_renderAddons(txt,lang,state)).replace(/onclick="BookingManager.updatePax\\('([^']+)', (-?1), [^)]*\\)"/g,(_,type,change)=>\`data-pax="\${type}" data-change="\${change}"\`).replace(/ onchange="[^"]*"/g,'');\n}`;
write('src/features/booking/presentation/form-markup.mjs',formCode);
const details=fs.readFileSync(path.join(legacy,'details.html'),'utf8');
let main=details.match(/<main\b[\s\S]*?<\/main>/)[0];
let occurrence=0;main=main.replace(/id="detail-desc"/g,()=>++occurrence===1?'id="detail-desc"':'id="detail-secondary-desc"');
const copy=html=>html.replace(/(<([\w-]+)\b[^>]*data-i18n="([^"]+)"[^>]*>)[\s\S]*?<\/\2>/g,(_,open,tag,key)=>`${open}{copy(${JSON.stringify(key)})}</${tag}>`);
main=copy(main).replace(/\s+onclick="[^"]*"/g,'').replace(/\s+onsubmit="[^"]*"/g,'');
const fields={title:'text.title',duration:'text.duration',desc:'text.short_desc','full-desc':'text.full_description',important:'text.important_notes',price:'pricesHtml(trip,true)',highlights:'listHtml(text.highlights,false,false)',includes:'listHtml(text.includes,true,false)',excludes:'listHtml(text.not_included,true,true)',program:'programHtml(text.program)'};
for(const [id,value]of Object.entries(fields))main=main.replace(new RegExp(`(<([\\w-]+)\\b[^>]*id="detail-${id}"[^>]*>)[\\s\\S]*?<\\/\\2>`),(_,open,tag)=>`${open.slice(0,-1)} set:html={${value}}></${tag}>`);
main=main.replace(/(<span\b[^>]*id="card-price"[^>]*>)[\s\S]*?<\/span>/,'$1€{headlinePrice(trip)}</span>');
main=main.replace(/(<span\b[^>]*id="live-total-price"[^>]*>)[\s\S]*?<\/span>/,'$1€{initialTotal}</span>');
main=main.replace(/<form\b[^>]*id="trip-booking-form"[\s\S]*?<\/form>/,'<BookingForm trip={trip} locale={locale} addons={addons} messages={m}/>');
main=main.replace(/(<div\b[^>]*id="card-price-breakdown"[^>]*>)[\s\S]*?<\/div>/,'$1<Fragment set:html={breakdownHtml(trip,m.global.pricing.min_pax)}/></div>');
main=main.replace(/(<span\b[^>]*id="detail-badge"[^>]*>)[\s\S]*?<\/span>/,(_,open)=>`${open.slice(0,-1)} style={!trip.source[\`badge_\${locale}\`]?.trim()?'display:none':undefined}>{trip.source[\`badge_\${locale}\`]}</span>`);
main=main.replace(/<img\b[^>]*id="hero-bg-img"[\s\S]*?>/,'<Image id="hero-bg-img" src={imageAssets[gallery[0]]} alt={m.detailLabels.heroAlt} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="eager" fetchpriority="high" widths={[600,1200]} sizes="(min-width:1024px) 50vw, 100vw"/>');
main=main.replace(/(<div\b[^>]*id="gallery-grid"[^>]*>)[\s\S]*?<\/div>/,'$1<TripGallery gallery={gallery}/></div>');
write('src/features/tours/presentation/TripPage.astro',`---\nimport {Image} from 'astro:assets';\nimport type {TourPage} from '../domain/details';\nimport type {Locale} from '../../../shared/config/languages';\nimport {getSharedMessages} from '../../../shared/i18n/shared';\nimport type {BookingAddon} from '../../booking/domain/booking';\nimport {calculateTotal} from '../../booking/domain/booking';\nimport BookingForm from '../../booking/presentation/BookingForm.astro';\nimport InvoiceModal from '../../booking/presentation/InvoiceModal.astro';\nimport TripGallery from './TripGallery.astro';\nimport Faq from '../../../shared/components/Faq.astro';\nimport {imageAssets} from './images';\nimport {headlinePrice,pricesHtml,breakdownHtml,listHtml,programHtml} from './markup';\nimport './details.css';\ninterface Props {page:TourPage;addons:BookingAddon[]}\nconst {page,addons}=Astro.props;const {trip,text,gallery}=page;const locale=page.locale as Locale;\nconst m=getSharedMessages(locale);\nconst copy=(key:string)=>key.split('.').reduce((value:any,part)=>value[part],m);\nconst initialTotal=calculateTotal({adults:trip.minPax,children:0,selectedAddons:[]},{adult:trip.prices.adult,child:trip.prices.child,minPax:trip.minPax},addons);\n---\n${main}\n<Faq locale={locale}/><InvoiceModal locale={locale}/>\n<script>import './interactions';</script>`);
const faq=copy(fs.readFileSync(path.join(legacy,'assets/partials/faq-section.html'),'utf8'));
write('src/shared/components/Faq.astro',`---\nimport {getSharedMessages} from '../i18n/shared';\nimport type {Locale} from '../config/languages';\ninterface Props {locale:Locale}\nconst m=getSharedMessages(Astro.props.locale);\nconst copy=(key:string)=>key.split('.').reduce((value:any,part)=>value[part],m);\n---\n${faq}\n<script>import './faq-interactions';</script>`);
const css=createRequire(path.join(legacy,'package.json'))('postcss').parse(fs.readFileSync(path.join(legacy,'assets/css/style.css'),'utf8'));
css.walkComments(c=>c.remove());css.walkAtRules(r=>{if(r.name==='import'||r.name==='font-face'||r.name.includes('keyframes')&&!['heroImageFade','fadeInUp','goldPulse','wiggleIcon','wiggle'].includes(r.params))r.remove();});
css.walkRules(r=>{if(r.parent.type==='atrule'&&r.parent.name.includes('keyframes'))return;const selectors=r.selector.split(',').filter(s=>/details-page|#btn-submit-booking|#sticky-mobile-book|animate-fade-up|animate-wiggle|delay-100|delay-200|hide-scrollbar|\.text-gold|\.bg-gold|\.border-gold|\.font-playfair|\.font-montserrat/.test(s));if(!selectors.length)r.remove();else r.selector=selectors.join(',');});
css.walkAtRules(r=>{if(r.nodes&&!r.nodes.length)r.remove();});write('src/features/tours/presentation/details.css',css.toString());
for(const name of ['person-male.svg','persons.svg','child-svgrepo.svg']){const target=path.join(root,'public/assets/images/icons',name);fs.copyFileSync(path.join(legacy,'public/assets/images/icons',name),target);}
console.log('Extracted original trip/FAQ markup, shared translations, countries, gallery counts and detail CSS.');
