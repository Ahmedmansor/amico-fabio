const a={state:{tripId:null,apiData:null,langData:null,adults:1,children:0,addons:[],selectedAddons:new Set,formData:{name:"",nation:"",date:""}},utils:{getLang:()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",getI18n:t=>t==="en"?window.i18nEn||{}:window.i18nIt||{},getPrices:t=>{const n=parseFloat(t?.d_adult||t?.p_adult||0),e=parseFloat(t?.d_child||t?.p_child||0),i=parseInt(t?.min_pax||1);return{adult:n,child:e,minPax:i}},formatEUR:t=>`€${t}`,getAddonLabel:(t,n)=>n==="it"?t.label_it||t.label_en:t.label_en||t.label_it,buildExtrasListString:(t,n)=>Array.from(t.selectedAddons).map(e=>{const i=t.addons.find(l=>l.addon_id===e);return i?a.utils.getAddonLabel(i,n):e}).join(", ")},init:(t,n,e,i)=>{a.state.tripId=t,a.state.apiData=n,a.state.langData=e,a.state.addons=Array.isArray(i)?i:[],a.state.adults=parseInt(n?.min_pax||1),a.renderForm()},renderForm:()=>{const t=document.getElementById("trip-booking-form"),n=document.getElementById("btn-submit-booking");if(!t)return;const e=a.utils.getLang(),l=a.utils.getI18n(e).global||{},d=l.pricing||{},f={name:l.full_name||(e==="en"?"Full Name":"Nome Completo"),nation:l.nationality||(e==="en"?"Nationality":"Nazionalità"),date:l.trip_date||(e==="en"?"Trip Date":"Data del Viaggio"),adults:l.adults_12_plus||d.adult||(e==="en"?"Adults (12+)":"Adulti (+12)"),children:l.children_2_11||d.child||(e==="en"?"Children (2-11)":"Bambini (2-11)"),addons:l.addons_extras||(e==="en"?"Add-ons & Extras":"Extra & Supplementi"),select_country:l.select_country||(e==="en"?"Select country...":"Seleziona paese...")},c=a.utils.getPrices(a.state.apiData);let s=a._renderTextFields(f,l,e);s+=a._renderPaxControls(f,c),s+=a._renderAddons(f,e),t.innerHTML=s,a._updatePaxCounts(),a._setupDateInput(),a._setupNationPicker(f.select_country),n&&(n.onclick=()=>a.validateAndShowInvoice())},_renderTextFields:(t,n,e)=>`
      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">${t.name} <span class="text-gold">*</span></label>
          <input type="text" id="inp-name" class="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-gold outline-none transition-colors" placeholder="${n.placeholders&&n.placeholders.full_name?n.placeholders.full_name:e==="en"?"John Doe":"Fabio Mansour"}">
          <div id="err-name" class="text-red-500 text-xs mt-1 hidden"></div>
        </div>
        <div class="relative">
          <label class="block text-xs text-gray-400 mb-1">${t.nation} <span class="text-gold">*</span></label>
          <input type="hidden" id="inp-nation" value="">
          <button type="button" id="nation-picker" class="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-gold outline-none flex items-center justify-between">
            <span id="nation-selected" class="flex items-center gap-2 text-gray-400">${t.select_country}</span>
            <span class="text-gray-500">▼</span>
          </button>
          <div id="nation-list" class="absolute left-0 right-0 mt-1 bg-black/80 border border-gray-700 rounded-lg max-h-56 overflow-auto z-20 hidden shadow-xl"></div>
          <div id="err-nation" class="text-red-500 text-xs mt-1 hidden"></div>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">${t.date} <span class="text-gold">*</span></label>
        <input type="date" id="inp-date" class="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-gold outline-none" min="${new Date().toISOString().split("T")[0]}">
        <div id="err-date" class="text-red-500 text-xs mt-1 hidden"></div>
      </div>
      <div class="border-t border-gray-800 my-3"></div>
    `,_renderPaxControls:(t,n)=>`
      <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-white/5">
        <div class="text-sm"><div class="text-white font-bold">${t.adults}</div><div class="text-gold text-xs">€${n.adult}</div></div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="BookingManager.updatePax('adults', -1, ${n.minPax})" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">-</button>
          <span id="count-adults" class="font-bold w-4 text-center text-white">${a.state.adults}</span>
          <button type="button" onclick="BookingManager.updatePax('adults', 1, ${n.minPax})" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">+</button>
        </div>
      </div>
      <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-white/5">
        <div class="text-sm"><div class="text-white font-bold">${t.children}</div><div class="text-gold text-xs">€${n.child}</div></div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="BookingManager.updatePax('children', -1, 0)" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">-</button>
          <span id="count-children" class="font-bold w-4 text-center text-white">${a.state.children}</span>
          <button type="button" onclick="BookingManager.updatePax('children', 1, 0)" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">+</button>
        </div>
      </div>
    `,_renderAddons:(t,n)=>{if(a.state.addons.length===0)return"";let e=`<div class="border-t border-gray-800 my-3 pt-2"><label class="block text-xs text-gold mb-2 font-bold uppercase tracking-wider">${t.addons}</label><div class="space-y-2">`;return a.state.addons.forEach(i=>{const l=n==="it"?i.label_it:i.label_en,d=parseFloat(i.price||0);e+=`
        <label class="flex items-center justify-between cursor-pointer hover:bg-gray-800 p-2 rounded transition border border-transparent hover:border-gray-700">
          <div class="flex items-center">
            <input type="checkbox" value="${i.addon_id}" data-price="${d}" onchange="BookingManager.toggleAddon(this)">
            <span class="ml-3 text-white">${l}</span>
          </div>
          <span class="text-gold font-bold">€${d}</span>
        </label>
      `}),e+="</div></div>",e},_updatePaxCounts:()=>{const t=document.getElementById("count-adults"),n=document.getElementById("count-children");t&&(t.textContent=String(a.state.adults)),n&&(n.textContent=String(a.state.children))},_setupDateInput:()=>{const t=document.getElementById("inp-date");t&&typeof t.showPicker=="function"&&(t.addEventListener("click",()=>t.showPicker()),t.addEventListener("focus",()=>t.showPicker()))},_setupNationPicker:t=>{const n=document.getElementById("inp-nation"),e=document.getElementById("nation-picker"),i=document.getElementById("nation-selected"),l=document.getElementById("nation-list");if(e&&l&&n&&i){const d=(s,o="h3")=>o==="v3"?`<svg class="w-4 h-3" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
              <rect width="8" height="16" x="0" y="0" fill="${s[0]||"#ccc"}" />
              <rect width="8" height="16" x="8" y="0" fill="${s[1]||"#999"}" />
              <rect width="8" height="16" x="16" y="0" fill="${s[2]||"#666"}" />
          </svg>`:o==="h2"?`<svg class="w-4 h-3" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="8" x="0" y="0" fill="${s[0]||"#ccc"}" />
              <rect width="24" height="8" x="0" y="8" fill="${s[1]||"#999"}" />
          </svg>`:`<svg class="w-4 h-3" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="${5.333333333333333}" x="0" y="0" fill="${s[0]||"#ccc"}" />
            <rect width="24" height="${5.333333333333333}" x="0" y="${5.333333333333333}" fill="${s[1]||"#999"}" />
            <rect width="24" height="${5.333333333333333}" x="0" y="${10.666666666666666}" fill="${s[2]||"#666"}" />
        </svg>`,f=[{v:"Afghan",t:"Afghanistan",c:["#1f4e79","#fff","#009a49"],p:"h3"},{v:"Albanian",t:"Albania",c:["#e41e26","#e41e26","#e41e26"],p:"h3"},{v:"Algerian",t:"Algeria",c:["#006233","#fff","#d52b1e"],p:"v3"},{v:"American",t:"United States",c:["#b22234","#fff","#3c3b6e"],p:"h3"},{v:"Andorran",t:"Andorra",c:["#0033a0","#ffcd00","#c8102e"],p:"v3"},{v:"Angolan",t:"Angola",c:["#d80027","#000","#d80027"],p:"h3"},{v:"Argentine",t:"Argentina",c:["#75aadb","#fff","#75aadb"],p:"h3"},{v:"Armenian",t:"Armenia",c:["#d90012","#0033a0","#f2a800"],p:"h3"},{v:"Australian",t:"Australia",c:["#012169","#fff","#c8102e"],p:"h3"},{v:"Austrian",t:"Austria",c:["#ed2939","#fff","#ed2939"],p:"h3"},{v:"Azerbaijani",t:"Azerbaijan",c:["#00a3dd","#ed2939","#009a49"],p:"h3"},{v:"Bahraini",t:"Bahrain",c:["#fff","#ce1126","#ce1126"],p:"h3"},{v:"Bangladeshi",t:"Bangladesh",c:["#006a4e","#f42a41","#006a4e"],p:"h3"},{v:"Belgian",t:"Belgium",c:["#000","#ffcd00","#ef3340"],p:"v3"},{v:"Bolivian",t:"Bolivia",c:["#d52b1e","#ffd500","#007934"],p:"h3"},{v:"Bosnian",t:"Bosnia and Herzegovina",c:["#002f6c","#fcd116","#fff"],p:"h3"},{v:"Brazilian",t:"Brazil",c:["#009b3a","#ffdf00","#002776"],p:"h3"},{v:"British",t:"United Kingdom",c:["#00247d","#fff","#cf142b"],p:"h3"},{v:"Bulgarian",t:"Bulgaria",c:["#fff","#00966e","#d62612"],p:"h3"},{v:"Cambodian",t:"Cambodia",c:["#032ea1","#e00025","#032ea1"],p:"h3"},{v:"Canadian",t:"Canada",c:["#ff0000","#fff","#ff0000"],p:"h3"},{v:"Chilean",t:"Chile",c:["#0039a6","#fff","#d2232c"],p:"h3"},{v:"Chinese",t:"China",c:["#de2910","#ffde00","#de2910"],p:"h3"},{v:"Colombian",t:"Colombia",c:["#fcd116","#003893","#ce1126"],p:"h3"},{v:"Croatian",t:"Croatia",c:["#ff0000","#fff","#171796"],p:"h3"},{v:"Cypriot",t:"Cyprus",c:["#fff","#d4af37","#fff"],p:"h3"},{v:"Czech",t:"Czech Republic",c:["#fff","#11457e","#d7141a"],p:"h3"},{v:"Danish",t:"Denmark",c:["#c8102e","#fff","#c8102e"],p:"h3"},{v:"Dutch",t:"Netherlands",c:["#ae1c28","#fff","#21468b"],p:"h3"},{v:"Egyptian",t:"Egypt",c:["#ce1126","#fff","#000000"],p:"h3"},{v:"Emirati",t:"United Arab Emirates",c:["#00732f","#fff","#000"],p:"h3"},{v:"Estonian",t:"Estonia",c:["#0072ce","#000","#fff"],p:"h3"},{v:"Finnish",t:"Finland",c:["#fff","#003580","#fff"],p:"h3"},{v:"French",t:"France",c:["#0055a4","#fff","#ef4135"],p:"v3"},{v:"Georgian",t:"Georgia",c:["#fff","#d40000","#fff"],p:"h3"},{v:"German",t:"Germany",c:["#000","#dd0000","#ffce00"],p:"h3"},{v:"Greek",t:"Greece",c:["#0d5eaf","#fff","#0d5eaf"],p:"h3"},{v:"Hungarian",t:"Hungary",c:["#cd2a3e","#fff","#436f4d"],p:"h3"},{v:"Icelandic",t:"Iceland",c:["#02529c","#fff","#dc1c3c"],p:"h3"},{v:"Indian",t:"India",c:["#ff9933","#fff","#138808"],p:"h3"},{v:"Indonesian",t:"Indonesia",c:["#ce1126","#fff","#fff"],p:"h3"},{v:"Irish",t:"Ireland",c:["#169b62","#fff","#ff883e"],p:"v3"},{v:"Israeli",t:"Israel",c:["#fff","#0038b8","#fff"],p:"h3"},{v:"Italian",t:"Italy",c:["#009246","#fff","#ce2b37"],p:"v3"},{v:"Japanese",t:"Japan",c:["#fff","#bc002d","#fff"],p:"h3"},{v:"Jordanian",t:"Jordan",c:["#007a3d","#000","#ce1126"],p:"h3"},{v:"Kazakh",t:"Kazakhstan",c:["#00afca","#f6d049","#00afca"],p:"h3"},{v:"Kenyan",t:"Kenya",c:["#000","#bb1f2d","#2f5d35"],p:"h3"},{v:"Kuwaiti",t:"Kuwait",c:["#007a3d","#fff","#000"],p:"h3"},{v:"Latvian",t:"Latvia",c:["#9e2438","#fff","#9e2438"],p:"h3"},{v:"Lebanese",t:"Lebanon",c:["#f00000","#fff","#f00000"],p:"h3"},{v:"Lithuanian",t:"Lithuania",c:["#fdb913","#006a44","#c1272d"],p:"h3"},{v:"Luxembourgish",t:"Luxembourg",c:["#00a3e0","#fff","#ed2939"],p:"h3"},{v:"Malaysian",t:"Malaysia",c:["#010080","#fff","#d00000"],p:"h3"},{v:"Maltese",t:"Malta",c:["#fff","#e4002b","#fff"],p:"v3"},{v:"Mexican",t:"Mexico",c:["#006847","#fff","#ce1126"],p:"v3"},{v:"Moroccan",t:"Morocco",c:["#c1272d","#c1272d","#c1272d"],p:"h3"},{v:"Nepalese",t:"Nepal",c:["#003893","#dc143c","#003893"],p:"h3"},{v:"New Zealander",t:"New Zealand",c:["#00247d","#fff","#cf142b"],p:"h3"},{v:"Norwegian",t:"Norway",c:["#ef2b2d","#fff","#002868"],p:"h3"},{v:"Pakistani",t:"Pakistan",c:["#00401a","#fff","#00401a"],p:"h3"},{v:"Palestinian",t:"Palestine",c:["#000","#fff","#007a3d"],p:"h3"},{v:"Peruvian",t:"Peru",c:["#d91023","#fff","#d91023"],p:"h3"},{v:"Philippine",t:"Philippines",c:["#0038a8","#fff","#ce1126"],p:"h3"},{v:"Polish",t:"Poland",c:["#fff","#dc143c","#dc143c"],p:"h3"},{v:"Portuguese",t:"Portugal",c:["#046a38","#da291c","#da291c"],p:"h3"},{v:"Qatari",t:"Qatar",c:["#8d1b3d","#fff","#8d1b3d"],p:"h3"},{v:"Romanian",t:"Romania",c:["#002b7f","#fcd116","#ce1126"],p:"v3"},{v:"Russian",t:"Russia",c:["#fff","#0039a6","#d52b1e"],p:"h3"},{v:"Saudi",t:"Saudi Arabia",c:["#006c35","#fff","#006c35"],p:"h3"},{v:"Scottish",t:"Scotland",c:["#0065bd","#fff","#0065bd"],p:"h3"},{v:"Serbian",t:"Serbia",c:["#c6363c","#0f52ba","#fff"],p:"h3"},{v:"Singaporean",t:"Singapore",c:["#ed2939","#fff","#fff"],p:"h3"},{v:"Slovak",t:"Slovakia",c:["#fff","#0b4ea2","#ee1c25"],p:"h3"},{v:"Slovenian",t:"Slovenia",c:["#fff","#0056a3","#ed1c24"],p:"h3"},{v:"South African",t:"South Africa",c:["#007850","#000","#de3831"],p:"h3"},{v:"South Korean",t:"South Korea",c:["#fff","#000","#c60c30"],p:"h3"},{v:"Spanish",t:"Spain",c:["#aa151b","#f1bf00","#aa151b"],p:"h3"},{v:"Swedish",t:"Sweden",c:["#006aa7","#fecc00","#006aa7"],p:"h3"},{v:"Swiss",t:"Switzerland",c:["#d52b1e","#fff","#d52b1e"],p:"h3"},{v:"Syrian",t:"Syria",c:["#ce1126","#fff","#000"],p:"h3"},{v:"Thai",t:"Thailand",c:["#ff0000","#fff","#2d2a4a"],p:"h3"},{v:"Tunisian",t:"Tunisia",c:["#e70013","#fff","#e70013"],p:"h3"},{v:"Turkish",t:"Turkey",c:["#e30a17","#fff","#e30a17"],p:"h3"},{v:"Ukrainian",t:"Ukraine",c:["#0057b7","#ffd700","#0057b7"],p:"h3"},{v:"Uruguayan",t:"Uruguay",c:["#00a1e4","#fff","#ffd700"],p:"h3"},{v:"Venezuelan",t:"Venezuela",c:["#f4c300","#003893","#ce1126"],p:"h3"}];f.sort((s,o)=>s.t.localeCompare(o.t)),e.addEventListener("click",()=>{l.classList.toggle("hidden")}),document.addEventListener("click",s=>{s.target.closest("#nation-picker")||s.target.closest("#nation-list")||l.classList.add("hidden")});const c=document.createDocumentFragment();f.forEach(s=>{const o=document.createElement("button");o.type="button",o.className="w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center gap-2 text-sm text-white",o.innerHTML=`${d(s.c,s.p)} <span>${s.t}</span>`,o.addEventListener("click",()=>{n.value=s.v,i.innerHTML=`${d(s.c,s.p)} <span class="text-white">${s.t}</span>`,l.classList.add("hidden")}),c.appendChild(o)}),l.appendChild(c)}a.calculateTotal()},updatePax:(t,n,e)=>{let i=a.state[t]+n;i<e&&(i=e),a.state[t]=i;const l=document.getElementById(`count-${t}`);l&&(l.textContent=String(i)),a.calculateTotal()},toggleAddon:t=>{t&&(t.checked?a.state.selectedAddons.add(t.value):a.state.selectedAddons.delete(t.value),a.calculateTotal())},calculateTotal:()=>{const{adult:t,child:n}=a.utils.getPrices(a.state.apiData);let e=a.state.adults*t+a.state.children*n;a.state.selectedAddons.forEach(l=>{const d=a.state.addons.find(f=>f.addon_id===l);d&&(e+=parseFloat(d.price||0))});const i=document.getElementById("live-total-price");return i&&(i.textContent=a.utils.formatEUR(e)),e},validateAndShowInvoice:()=>{const t=document.getElementById("inp-name"),n=document.getElementById("inp-date"),e=document.getElementById("inp-nation"),i=document.getElementById("nation-picker"),l=t?String(t.value||"").trim():"",d=n?String(n.value||"").trim():"",f=e?String(e.value||"").trim():"",c=a.utils.getLang(),r=(a.utils.getI18n(c).global||{}).errors||{},p=r.required_field||"",u=(g,y,q,k)=>{const m=document.getElementById(g);!m||!y||(q?(m.textContent="",m.classList.add("hidden"),y.classList.remove("border-red-500")):(m.textContent=k||p,m.classList.remove("hidden"),y.classList.add("border-red-500")))},h=!!l,x=!!d,v=!!f;u("err-name",t,h,r.required_name),u("err-date",n,x,r.required_date),u("err-nation",i||e,v,r.required_nation);const b=document.getElementById("btn-submit-booking");if(b&&(b.disabled=!0,b.classList.add("opacity-70"),setTimeout(()=>{b.disabled=!1,b.classList.remove("opacity-70")},1200)),!h||!x||!v){const g=h?x?v?null:i||e:n:t;g&&typeof g.focus=="function"&&(g.focus(),typeof g.scrollIntoView=="function"&&g.scrollIntoView({behavior:"smooth",block:"center"}));return}a.state.formData={name:l,date:d,nation:f},a.showInvoiceModal()},showInvoiceModal:()=>{const t=document.getElementById("invoice-modal"),n=document.getElementById("invoice-content");if(!t||!n)return;const e=a.state,i=a.calculateTotal(),l=e.langData?.title||e.tripId,d=a.utils.getLang();let f="";e.selectedAddons.size>0&&(f=`<div class="border-t border-gray-700 pt-2 mt-2"><p class="text-gold text-xs uppercase mb-1">Extras:</p><ul class="list-disc pl-4 text-xs text-gray-400">${Array.from(e.selectedAddons).map(s=>{const o=e.addons.find(r=>r.addon_id===s);return o?`<li>+ ${a.utils.getAddonLabel(o,d)} (${a.utils.formatEUR(parseFloat(o.price||0))})</li>`:""}).join("")}</ul></div>`),n.innerHTML=`
      <div class="space-y-2">
        <div class="flex justify-between border-b border-gray-700 pb-2">
          <span class="text-gray-400">Trip:</span>
          <span class="text-white font-bold text-right">${l}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Name:</span>
          <span class="text-white">${e.formData.name}</span>
        </div>
        ${e.formData.nation?`<div class="flex justify-between"><span class="text-gray-400">Nationality:</span><span class="text-white">${e.formData.nation}</span></div>`:""}
        <div class="flex justify-between">
          <span class="text-gray-400">Date:</span>
          <span class="text-white">${e.formData.date}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Pax:</span>
          <span class="text-white">${e.adults} Adults, ${e.children} Kids</span>
        </div>
        ${f}
        <div class="flex justify-between items-center bg-gray-800 p-3 rounded mt-4">
          <span class="text-gold font-bold">Total Estimate:</span>
          <span class="text-2xl text-white font-bold">${a.utils.formatEUR(i)}</span>
        </div>
      </div>
    `,t.classList.remove("hidden")},_generateWhatsAppMessage:(t,n,e)=>{const i=n.global.whatsapp,l=t.langData?.title||t.tripId,d=document.getElementById("live-total-price"),f=d?d.textContent:"€0",c=a.utils.getLang(),s=a.utils.buildExtrasListString(t,c),o=`${t.adults} ${i.adults_word}, ${t.children} ${i.children_word}`,r={"{greeting}":i.greeting.replace("{name}",t.formData.name),"{trip}":l,"{package}":l,"{date}":t.formData.date,"{nation}":t.formData.nation||"N/A","{guests}":o,"{extras}":s||"N/A","{total}":f,"{check_availability}":e?i.package_check_availability:i.check_availability,"{details_heading}":e?i.package_details_heading:i.details_heading,"{trip_label}":i.trip_label,"{package_label}":i.package_label,"{date_label}":i.date_label,"{nation_label}":i.nation_label,"{guests_label}":i.guests_label,"{extras_label}":i.extras_label,"{total_label}":i.total_label,"{waiting_confirmation}":i.waiting_confirmation};let p=e?i.package_message:i.full_message;for(const[u,h]of Object.entries(r))p=p.split(u).join(h);return p},sendToWhatsApp:()=>{const t=a.state,n=document.getElementById("live-total-price");n&&n.textContent;const e=a.utils.getLang(),i=a.utils.getI18n(e),l=t.apiData&&(String(t.apiData.type||"").toLowerCase()==="package"||String(t.apiData.category||"").toLowerCase()==="bundles"),d=a._generateWhatsAppMessage(t,i,l);window.open(`https://wa.me/201063239261?text=${encodeURIComponent(d)}`,"_blank");const c=document.getElementById("invoice-modal");c&&c.classList.add("hidden")}};window.BookingManager=a;const w=`<section id="faq-accordion" class="max-w-5xl mx-auto px-4 mt-16 lg:mt-24 mb-16">
    <h2 class="text-2xl md:text-3xl font-playfair font-bold text-gold mb-6 text-center" data-i18n="faq.headline">
    </h2>
    <div class="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.0.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.0.a"></p>
            </div>
        </div>
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.1.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.1.a"></p>
            </div>
        </div>
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.2.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.2.a"></p>
            </div>
        </div>
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.3.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.3.a"></p>
            </div>
        </div>
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.4.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.4.a"></p>
            </div>
        </div>
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.5.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.5.a"></p>
            </div>
        </div>
        <div class="faq-item border-b border-gray-800">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.6.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.6.a"></p>
            </div>
        </div>
        <div class="faq-item">
            <button type="button"
                class="faq-toggle w-full flex items-start gap-4 px-5 py-4 hover:bg-black/30 transition-colors text-left">
                <span class="faq-q font-playfair text-white text-base md:text-lg text-left"
                    data-i18n="faq.items.7.q"></span>
                <span
                    class="faq-icon inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold transition-transform ml-auto">+</span>
            </button>
            <div
                class="faq-answer px-5 text-gray-300 text-sm md:text-base transition-[max-height] duration-300 ease-in-out overflow-hidden max-h-0 text-left">
                <p data-i18n="faq.items.7.a"></p>
            </div>
        </div>
    </div>
</section>`;console.log("🚀 FAQ Module Loaded");console.log("📄 HTML Content Length:",w.length);function $(t="faq-section-container"){console.log("🏁 initFaqSection called for:",t);const n=document.getElementById(t);if(!n){console.error("❌ Error: Container element not found:",t);return}if(n.dataset.loaded==="true")return;n.innerHTML=w,n.dataset.loaded="true";const e=()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",i=c=>c==="en"?window.i18nEn||{}:window.i18nIt||{},l=(c,s)=>{if(!c||!s)return null;const o=s.split(".");let r=c;for(let p=0;p<o.length;p+=1){const u=o[p];if(r&&Object.prototype.hasOwnProperty.call(r,u))r=r[u];else return null}return r},d=()=>{const c=e(),s=i(c);n.querySelectorAll("[data-i18n]").forEach(o=>{const r=o.getAttribute("data-i18n"),p=l(s,r);typeof p=="string"&&(o.textContent=p)})},f=()=>{if(window.DetailsRenderer&&typeof window.DetailsRenderer.setupFaqAccordion=="function"){window.DetailsRenderer.setupFaqAccordion();return}const c=n.querySelectorAll(".faq-item");c.length&&c.forEach(s=>{const o=s.querySelector(".faq-toggle"),r=s.querySelector(".faq-answer"),p=s.querySelector(".faq-icon");!o||!r||o.dataset.bound!=="true"&&(o.dataset.bound="true",o.setAttribute("aria-expanded","false"),r.style.maxHeight="0px",s.classList.remove("is-open"),o.addEventListener("click",()=>{if(o.getAttribute("aria-expanded")==="true"){o.setAttribute("aria-expanded","false"),r.style.maxHeight="0px",s.classList.remove("is-open"),p&&p.classList.remove("rotate-45");return}o.setAttribute("aria-expanded","true"),s.classList.add("is-open"),r.style.maxHeight=`${r.scrollHeight}px`,p&&p.classList.add("rotate-45")}))})};d(),f(),window.addEventListener("langChanged",d)}export{$ as i};
