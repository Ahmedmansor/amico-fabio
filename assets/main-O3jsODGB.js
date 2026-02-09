import"./global-footer-B2CMDlWK.js";const b={init:()=>{const e=document.getElementById("hero-slider-section");if(!e)return;const t=e.querySelectorAll(".hero-slide");!t||t.length===0||b.start(t)},start:e=>{let t=0;const n=o=>{e.forEach(i=>i.classList.remove("active-slide")),e[o].classList.add("active-slide")},a=()=>{t=(t+1)%e.length,n(t)};n(0),setInterval(a,3e3)}};document.readyState==="loading"?window.addEventListener("load",b.init):b.init();window.HeroSlider=b;function I(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}function T(e){return e?Array.isArray(e)?e:Array.isArray(e.items)?e.items:Array.isArray(e.list)?e.list:[]:[]}function C(e){const t=Number(e);return Number.isFinite(t)?Math.max(0,Math.min(5,Math.round(t))):0}function M(e){const t=document.getElementById("reviewsTrack");if(!t)return;const n=e||localStorage.getItem("fabio_lang")||localStorage.getItem("preferredLanguage")||document.documentElement.lang||"it",o=String(n).toLowerCase().trim().startsWith("en")?window.i18nEn||{}:window.i18nIt||{},i=T(o.reviews);if(!i.length){t.innerHTML="";return}const r=i.concat(i),s=`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M22 12a10 10 0 1 0-11.563 9.874v-6.987H7.898V12h2.539V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33v6.987A10.003 10.003 0 0 0 22 12Z" />
    </svg>
  `,c=r.map(l=>{const d=I(l.name||l.author||l.user||""),m=I(l.text||l.message||l.content||l.review||""),g=I(l.meta||l.date||l.source||""),w=C(l.rating),u=Array.from({length:5}).map((L,A)=>`
        <span class="review-star ${A<w?"is-filled":""}" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </span>
      `).join("");return`
      <article class="review-card" role="listitem">
        <div class="review-header">
          <div class="review-author">
            <div class="review-name">${d}</div>
            ${g?`<div class="review-meta">${g}</div>`:""}
          </div>
          <div class="review-facebook" aria-hidden="true">
            ${s}
          </div>
        </div>
        <div class="review-rating" aria-label="Rating">${u}</div>
        <div class="review-text">${m}</div>
      </article>
    `}).join("");t.style.animation="none",t.innerHTML=c,t.offsetWidth,t.style.animation=""}console.log("Fabio Tours App Started");navigator.serviceWorker.getRegistrations().then(e=>{e.forEach(t=>{t.unregister()})});"caches"in window&&caches.keys().then(e=>{e.forEach(t=>{caches.delete(t)})});const v={it:window.i18nIt,en:window.i18nEn};let h="it";function p(e,t){if(!e||!t)return null;const n=t.split(".");let a=e;for(let o=0;o<n.length;o+=1){const i=n[o];if(a&&Object.prototype.hasOwnProperty.call(a,i))a=a[i];else return null}return a}function P(e){const t=v[e];if(!t)return;document.querySelectorAll("[data-i18n]").forEach(i=>{const r=i.getAttribute("data-i18n"),s=p(t,r);typeof s=="string"&&(i.textContent=s)}),document.querySelectorAll("[data-img]").forEach(i=>{const r=i.getAttribute("data-img"),s=p(t,r);typeof s=="string"&&(i.src=s)}),document.querySelectorAll("[data-landing-img]").forEach(i=>{const r=i.getAttribute("data-landing-img");if(window.ImagePaths){const s=p(window.ImagePaths,r);typeof s=="string"&&(i.src=s)}})}function $(e){if(h=e,document.documentElement.lang=e,localStorage.setItem("fabio_lang",e),localStorage.setItem("preferredLanguage",e),P(e),M(e),window.dispatchEvent(new CustomEvent("langChanged",{detail:{lang:e}})),document.getElementById("servicesFlow")&&(y("servicesFlow","secrets.page2.services",k),y("rules-page3","secrets.page3.rules",k),y("packing-checklist","secrets.page4.items",_),y("adventuresGrid","secrets.page6.items",D),F(),R(e)),window.PromoBanner&&window.appData&&window.appData.Global_Settings&&window.PromoBanner.render(window.appData.Global_Settings),typeof window.renderLegal=="function")try{window.renderLegal(e)}catch{}}window.applyTranslations=$;function y(e,t,n){const a=document.getElementById(e);if(!a)return;const o=v[h];if(!o)return;const i=p(o,t);if(a.innerHTML="",Array.isArray(i)){const r=document.createDocumentFragment();i.forEach((s,c)=>{const l=n(s,c,o);if(!l)return;const d=document.createElement("div");for(d.innerHTML=l.trim();d.firstChild;)r.appendChild(d.firstChild)}),a.appendChild(r)}else if(i&&typeof i=="object"){const r=n(i,0,o);if(r){const s=document.createElement("div");for(s.innerHTML=r.trim();s.firstChild;)a.appendChild(s.firstChild)}}}function k(e,t){if(!e)return"";const n=t===0?0:t*80,a=String(n),o=typeof e.img=="string"?e.img:"",i=e.title||e.name||"",r=e.desc||"",s=e.extra_title||"",c=e.extra_desc||"",d=s||c?`
      <div class="catalog-card-extra">
        ${s?`<h4 class="catalog-card-extra-title">${s}</h4>`:""}
        ${c?`<p class="catalog-card-extra-desc">${c}</p>`:""}
      </div>
    `:"";return`
    <article class="catalog-card sharm-reveal"${a!=="0"?` style="animation-delay: ${a}ms"`:""}>
      <div class="catalog-card-main">
        <h3 class="catalog-card-title">${i}</h3>
        <p class="catalog-card-desc">${r}</p>
      </div>
      <div class="catalog-card-image">
        <img src="${o}" alt="${i}" class="catalog-card-img" loading="lazy">
      </div>
      ${d}
    </article>
  `}function _(e,t){if(!e)return"";const n=typeof e.icon=="string"?e.icon:"",a=n?`fa-solid ${n} checklist-icon-glyph`:"fa-solid fa-circle checklist-icon-glyph";return`
    <div class="checklist-item sharm-reveal" style="animation-delay: ${t*70}ms">
      <div class="checklist-icon">
        <i class="${a}" aria-hidden="true"></i>
      </div>
      <div class="checklist-text">
        <h4>${e.title||""}</h4>
        <p>${e.desc||""}</p>
      </div>
    </div>
  `}function D(e,t){if(!e)return"";const n=typeof e.img=="string"?e.img:"";return`
    <div class="adventure-slide">
      <button type="button" class="adventure-card sharm-reveal" data-index="${String(t)}" style="animation-delay: ${t*80}ms">
        <img src="${n}" class="adventure-photo" alt="" loading="lazy" decoding="async">
        <div class="adventure-caption">${e.cap||""}</div>
      </button>
    </div>
  `}let f=null,E=null;function F(){const e=document.getElementById("adventuresGrid");if(!e||e.dataset.autoScrollBound==="true")return;e.dataset.autoScrollBound="true";const t=()=>{const i=e.querySelector(".adventure-slide");if(!i)return 0;const r=window.getComputedStyle(e),s=parseFloat(r.gap||r.columnGap||"0");return i.getBoundingClientRect().width+s},n=()=>{const i=t();if(!i)return;const r=e.scrollWidth-e.clientWidth;if(r<=0)return;const s=e.scrollLeft+i;e.scrollTo({left:s>=r-2?0:s,behavior:"smooth"})},a=()=>{f&&clearInterval(f),f=setInterval(n,2e3)},o=()=>{f&&clearInterval(f),E&&clearTimeout(E),E=setTimeout(a,2500)};e.addEventListener("pointerdown",o,{passive:!0}),e.addEventListener("wheel",o,{passive:!0}),e.addEventListener("touchstart",o,{passive:!0}),e.addEventListener("scroll",o,{passive:!0}),a()}function q(e){const t=document.querySelector(e);if(!t)return;const n=80,a=t.getBoundingClientRect(),o=window.scrollY+a.top-n;window.scrollTo({top:o,behavior:"smooth"})}function H(){const e=document.getElementById("indexMenu");e&&e.classList.add("is-visible")}function x(){const e=document.getElementById("indexMenu");e&&e.classList.remove("is-visible")}function R(e){const t=v[e];if(!t)return;const n=document.getElementById("indexMenu");if(!n)return;const a=n.querySelector(".index-menu-nav");if(!a)return;const o=[{id:"#page1",key:"secrets.page1.headline"},{id:"#page2",key:"secrets.page2.headline"},{id:"#page3",key:"secrets.page3.headline"},{id:"#page4",key:"secrets.page4.list_title"},{id:"#page5",key:"secrets.page5.highlight"},{id:"#page6",key:"secrets.page6.title"}];a.innerHTML="",o.forEach((i,r)=>{const s=p(t,i.key),c=document.createElement("button");c.type="button",c.className="index-link",typeof s=="string"?c.textContent=`${r+1} · ${s}`:c.textContent=`Section ${r+1}`,c.addEventListener("click",()=>{x(),q(i.id)}),a.appendChild(c)})}function W(){const e=document.getElementById("indexToggle"),t=document.getElementById("indexMenu");if(!e||!t)return;const n=t.querySelector(".index-menu-close");e.addEventListener("click",()=>{H()}),n&&n.addEventListener("click",()=>{x()}),t.addEventListener("click",a=>{a.target===t&&x()})}function G(){const e=document.getElementById("adventuresModal"),t=document.getElementById("adventuresModalImage"),n=document.getElementById("adventuresModalCaption");if(!e||!t||!n)return;const a=e.querySelector(".adventures-modal-close"),o=document.getElementById("adventuresGrid");o&&o.addEventListener("click",r=>{const c=r.target.closest(".adventure-card");if(!c)return;const l=c.getAttribute("data-index"),d=l?parseInt(l,10):0,m=v[h],g=m&&m.secrets&&m.secrets.page6,w=g&&Array.isArray(g.items)?g.items:[],u=w[d]||w[0],L=u&&typeof u.img=="string"?u.img:"";t.src=L,n.textContent=u&&u.cap?u.cap:"",e.classList.add("is-visible")});function i(){e.classList.remove("is-visible")}a&&a.addEventListener("click",()=>{i()}),e.addEventListener("click",r=>{r.target===e&&i()})}function O(){if(!window.ImagePaths||!window.ImagePaths.secrets||!window.ImagePaths.secrets.bg)return;const e=window.ImagePaths.secrets.bg,t=(n,a)=>{const o=document.querySelector(n);o&&o.style.setProperty("--bg-image",`url('${a}')`)};t(".section-hero",e.hero),t(".section-2",e.sec2),t(".section-3",e.sec3),t(".section-4",e.sec4),t(".section-5",e.sec5),t(".section-6",e.sec6)}const S={init:async()=>{window.UILayout&&window.UILayout.init(),"serviceWorker"in navigator&&navigator.serviceWorker.getRegistrations().then(function(o){for(let i of o)i.unregister()});const e=localStorage.getItem("fabio_lang"),t=localStorage.getItem("preferredLanguage"),n=e||t||"it";v[n]&&(h=n),$(h),document.getElementById("trips-grid")?await S.initTripCatalog():S.initSharmSecrets();const a=document.getElementById("who-fabio");if(a&&window.WhoFabioParallax)try{window.WFParallax=window.WFParallax||new window.WhoFabioParallax(a)}catch{}},initTripCatalog:async()=>{if(document.getElementById("trips-grid"),window.api&&window.api.fetchAllData){const t=await window.api.fetchAllData();if(!t){console.error("App: Data fetch returned null.");return}if(window.appData=t,window.PromoBanner&&t.Global_Settings&&window.PromoBanner.render(t.Global_Settings),window.UILayout&&window.UILayout.init(),!window.TripsRenderer||!t.Trips_Prices){const n=document.getElementById("trips-grid");if(n){const o=(localStorage.getItem("fabio_lang")||document.documentElement.lang||"it")==="en"?window.i18nEn||{}:window.i18nIt||{},i=o.global&&typeof o.global.loading_failed=="string"?o.global.loading_failed:"";n.innerHTML=`<div class="col-span-full text-center py-12">
                <p class="text-gold text-xl" data-i18n="global.loading_failed">${i}</p>
            </div>`}}B()}else console.error("API module not found")},initSharmSecrets:()=>{O(),W(),G(),B()}};function B(){const e=document.getElementById("global-footer")||document.querySelector("footer");if(!e)return;new IntersectionObserver(n=>{n.forEach(a=>{a.isIntersecting?document.body.classList.add("hide-floating-widgets"):document.body.classList.remove("hide-floating-widgets")})},{root:null,threshold:.1}).observe(e)}window.appData=window.appData||{};window.appData.openBooking=e=>{const t="201063239261",n=`Ciao Fabio! I want to book trip: ${e}`;window.open(`https://wa.me/${t}?text=${encodeURIComponent(n)}`,"_blank")};document.addEventListener("DOMContentLoaded",()=>{S.init()});
