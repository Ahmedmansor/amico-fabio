import fs from 'node:fs';
const write=(file,text)=>{fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,text.replace(/[\t ]+$/gm,'').trimEnd()+'\n');};
const source=fs.readFileSync('../package-details.html','utf8');
const copy=html=>html.replace(/(<([\w-]+)\b[^>]*data-i18n="([^"]+)"[^>]*>)[\s\S]*?<\/\2>/g,(_,open,tag,key)=>`${open}{copy(${JSON.stringify(key)})}</${tag}>`);
let main=copy(source.match(/<main\b[\s\S]*?<\/main>/)[0]).replace(/\s+onclick="[^"]*"/g,'').replace(/\s+onsubmit="[^"]*"/g,'');
const fields={title:'text.title',duration:'text.duration',desc:'text.short_desc','full-desc':'text.full_description',important:'text.important_notes',price:'pricesHtml(trip,true)',highlights:'listHtml(text.highlights)',includes:'listHtml(text.includes,true)',excludes:'listHtml(text.not_included,true)',program:'programHtml(text.program)'};
for(const [id,value]of Object.entries(fields))main=main.replace(new RegExp(`(<([\\w-]+)\\b[^>]*id="detail-${id}"[^>]*>)[\\s\\S]*?<\\/\\2>`),(_,open,tag)=>`${open.slice(0,-1)} set:html={${value}}></${tag}>`);
main=main.replace(/(<span\b[^>]*id="card-price"[^>]*>)[\s\S]*?<\/span>/,'$1€{headlinePrice(trip)}</span>');
main=main.replace(/(<span\b[^>]*id="live-total-price"[^>]*>)[\s\S]*?<\/span>/,'$1€{initialTotal}</span>');
main=main.replace(/<form\b[^>]*id="trip-booking-form"[\s\S]*?<\/form>/,'<BookingForm trip={trip} locale={locale} addons={addons} messages={m} kind="package"/>');
main=main.replace(/(<div\b[^>]*id="card-price-breakdown"[^>]*>)[\s\S]*?<\/div>/,'$1<Fragment set:html={breakdownHtml(trip,m.global.pricing.min_pax)}/></div>');
main=main.replace(/(<span\b[^>]*id="detail-badge"[^>]*>)[\s\S]*?<\/span>/,(_,open)=>`${open.slice(0,-1)} style={!badge?'display:none':undefined}>{badge}</span>`);
main=main.replace(/<img\b[^>]*id="hero-bg-img"[\s\S]*?>/,'<Image id="hero-bg-img" src={imageAssets[trip.poster]} alt={m.packageLabels.heroAlt} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 hero-img-animate" loading="eager" fetchpriority="high" widths={[600,1200]} sizes="(min-width:1024px) 50vw, 100vw"/>');
main=main.replace(/(<div\b[^>]*id="gallery-grid"[^>]*>)[\s\S]*?<\/div>/,'$1<PackageGallery gallery={page.gallery}/></div>');
main=main.replace(/(<p\b[^>]*id="included-trips-subtitle"[^>]*>)[\s\S]*?<\/p>/,'$1{page.included.length?m.packageLabels.includedSubtitle:""}</p>');
main=main.replace(/(<div\b[^>]*id="included-trips-grid"[^>]*>)[\s\S]*?<\/div>/,'$1<IncludedTrips included={page.included} locale={locale}/></div>');
write('src/features/packages/presentation/PackagePage.astro',`---
import {Image} from 'astro:assets';
import type {PackagePage} from '../domain/details';
import type {Locale} from '../../../shared/config/languages';
import {getSharedMessages} from '../../../shared/i18n/shared';
import type {BookingAddon} from '../../booking/domain/booking';
import {calculateTotal} from '../../booking/domain/booking';
import BookingForm from '../../booking/presentation/BookingForm.astro';
import InvoiceModal from '../../booking/presentation/InvoiceModal.astro';
import Faq from '../../../shared/components/Faq.astro';
import IncludedTrips from './IncludedTrips.astro';
import PackageGallery from './PackageGallery.astro';
import IncludedTripModal from './IncludedTripModal.astro';
import {imageAssets} from './images';
import {headlinePrice,pricesHtml,breakdownHtml,listHtml,programHtml} from './markup';
import '../../tours/presentation/details.css';
interface Props {page:PackagePage;addons:BookingAddon[]}
const {page,addons}=Astro.props;const trip=page.package,text=page.text,locale=page.locale as Locale;
const m=getSharedMessages(locale);
const copy=(key:string)=>key.split('.').reduce((value:any,part)=>value[part],m);
const badge=m.global.badges[trip.source.badge_key as keyof typeof m.global.badges]||'';
const initialTotal=calculateTotal({adults:trip.minPax,children:0,selectedAddons:[]},{...trip.prices,minPax:trip.minPax},addons);
---
${main}
<Faq locale={locale}/><InvoiceModal locale={locale}/><IncludedTripModal included={page.included} locale={locale}/>
<script>import './interactions';</script>`);
let modal=copy(source.match(/<div id="included-trip-modal"[\s\S]*?(?=\s*<script type="module")/)[0]);
const content=modal.match(/<div class="flex flex-col p-6[\s\S]*$/)[0].replace(/\s*<\/div>\s*<\/div>\s*$/,'');
let template=content.replace(/id="([^"]+)"/g,'data-field="$1"');
for(const [id,value]of Object.entries({title:'text.title',duration:'text.duration',desc:'text.short_desc','full-desc':'text.full_description',important:'text.important_notes',highlights:'listHtml(text.highlights)',includes:"listHtml(text.includes,true,'check')",excludes:"listHtml(text.not_included,true,'cross')",program:'modalProgramHtml(text.program)'}))template=template.replace(new RegExp(`(<([\\w-]+)\\b[^>]*data-field="included-trip-${id}"[^>]*>)[\\s\\S]*?<\\/\\2>`),(_,open,tag)=>`${open.slice(0,-1)} set:html={${value}}></${tag}>`);
template=template.replace(/<img\b[^>]*data-field="included-trip-modal-hero-img"[\s\S]*?>/,'<Image data-field="included-trip-modal-hero-img" src={imageAssets[item.gallery[0]]} alt={m.detailLabels.heroAlt} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" widths={[600,1200]} sizes="(min-width:1024px) 800px, 100vw"/>');
template=template.replace(/(<span\b[^>]*data-field="included-trip-badge"[^>]*>)[\s\S]*?<\/span>/,(_,open)=>`${open.replace(' hidden','').slice(0,-1)} style={!item.trip.source[\`badge_\${locale}\`]?'display:none':undefined}>{item.trip.source[\`badge_\${locale}\`]}</span>`);
template=template.replace(/(<div\b[^>]*data-field="included-trip-modal-gallery"[^>]*>)[\s\S]*?<\/div>/,'$1<PackageGallery gallery={item.gallery} small/></div>');
const shell=modal.slice(0,modal.indexOf('<div class="flex flex-col p-6'))+'<div id="included-trip-content"></div></div></div>';
write('src/features/packages/presentation/IncludedTripModal.astro',`---
import {Image} from 'astro:assets';
import type {TourPage} from '../../tours/domain/details';
import type {Locale} from '../../../shared/config/languages';
import {getSharedMessages} from '../../../shared/i18n/shared';
import {imageAssets} from './images';
import {listHtml,modalProgramHtml} from './markup';
import PackageGallery from './PackageGallery.astro';
interface Props {included:TourPage[];locale:Locale}
const {included,locale}=Astro.props,m=getSharedMessages(locale);
const copy=(key:string)=>key.split('.').reduce((value:any,part)=>value[part],m);
---
${shell}
{included.map(item=>{const text=item.text;return <template id={\`included-template-\${item.trip.id}\`}>${template}</template>;})}`);
for(const locale of ['it','en']){const file=`src/shared/i18n/dictionaries/${locale}.json`,m=JSON.parse(fs.readFileSync(file,'utf8'));m.packageLabels={heroAlt:'Package Image',includedSubtitle:locale==='en'?'Each experience in this bundle can be explored in detail below.':'Ogni esperienza inclusa in questo pacchetto può essere esplorata in dettaglio qui sotto.'};write(file,JSON.stringify(m,null,2));}
console.log('Extracted original package page, included-trip modal and existing bilingual labels.');
