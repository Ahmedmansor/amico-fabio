import"./global-header-4j9IadTc.js";import"./ui-layout-YpVXqCmA.js";import"./global-footer-D0aab2x-.js";const B=typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[],x=B.filter(Boolean)[0]||"",F=x?`/${x}/`:"/",u=typeof window<"u"&&window.FABIO_BASE_URL||F,d={state:{hasShownSkeleton:!1},_utils:{getLang:()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",getI18n:e=>e==="en"?window.i18nEn||{}:window.i18nIt||{},resolveCategory:e=>window.ExploreRenderer&&typeof window.ExploreRenderer.resolveCategory=="function"?window.ExploreRenderer.resolveCategory(e):String(e.category||"").toLowerCase().trim(),isPackage:e=>{const a=d._utils.resolveCategory(e);return String(e.type||"").toLowerCase()==="package"||a==="bundles"}},render:e=>{const a=document.getElementById("trips-grid");if(a){if(console.log("TripsRenderer: render()",{tripsCount:Array.isArray(e)?e.length:0,containerFound:!!a}),a.className="trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto",!d.state.hasShownSkeleton&&!window.hasShownSkeleton){d.state.hasShownSkeleton=!0,window.hasShownSkeleton=!0,d._renderSkeleton(a),console.log("TripsRenderer: skeleton shown"),setTimeout(()=>{d.renderRealCards(e,a)},1500);return}d.renderRealCards(e,a)}},_renderSkeleton:e=>{const a=Array(4).fill(0).map(()=>`
            <div class="bg-[#1a1510] rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border border-white/5 relative">
                <!-- Image Skeleton -->
                <div class="h-[280px] w-full bg-gray-800/50 relative overflow-hidden">
                     <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                </div>
                
                <!-- Content Skeleton -->
                <div class="p-6 flex-grow space-y-6">
                    <!-- Title -->
                    <div class="h-8 bg-gray-800/50 rounded-lg w-3/4 relative overflow-hidden">
                         <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                    </div>
                    
                    <!-- Description Lines -->
                    <div class="space-y-3">
                        <div class="h-3 bg-gray-800/30 rounded w-full"></div>
                        <div class="h-3 bg-gray-800/30 rounded w-5/6"></div>
                        <div class="h-3 bg-gray-800/30 rounded w-4/6"></div>
                    </div>

                    <!-- Price & Button -->
                    <div class="pt-4 border-t border-white/5 flex flex-col gap-4">
                         <div class="h-4 bg-gray-800/50 rounded w-1/3"></div>
                         <div class="h-12 bg-gray-800/50 rounded-xl w-full relative overflow-hidden">
                              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                         </div>
                    </div>
                </div>
            </div>
        `).join("");e.innerHTML=a},renderRealCards:(e,a)=>{console.log("TripsRenderer: renderRealCards start",{containerExists:!!a,tripsCount:Array.isArray(e)?e.length:0});const r=e.filter(n=>String(n.featured||"").toUpperCase()==="TRUE");if(console.log("TripsRenderer: featured count",r.length),!r||r.length===0){console.log("TripsRenderer: no featured trips found; keeping fallback HTML"),d._renderEmptyState(a);return}a.innerHTML="";const s=document.createDocumentFragment(),o=d._utils.getLang();console.log("TripsRenderer: appending cards",r.length),r.forEach((n,i)=>{const l=d.createTripCard(n,o,i);l&&s.appendChild(l)}),a.appendChild(s),console.log("TripsRenderer: rendered cards",r.length),window.AOS&&(console.log("TripsRenderer: AOS.refresh()"),window.AOS.refresh())},_renderEmptyState:e=>{const a=d._utils.getLang(),r=d._utils.getI18n(a),s=r&&r.global&&typeof r.global.no_exclusive_experiences=="string"?r.global.no_exclusive_experiences:"";e.innerHTML=`<div class="col-span-full text-center py-20">
            <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${s}</p>
        </div>`,console.log("TripsRenderer: empty state rendered")},createTripCard:(e,a,r)=>{const s=d._utils.getI18n(a),o=d._utils.isPackage(e),{title:n,description:i}=d._resolveTextData(e,s),{priceRowHTML:l,dealBannerHTML:c}=d._resolvePriceData(e,s,o),g=d._resolveImage(e,o),p=d._resolveBadge(e,a,s),m=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean)[0]||"",b=m?`/${m}/`:"/",w=typeof window<"u"&&window.FABIO_BASE_URL||b,S=window.ImagePaths?window.ImagePaths.ui.placeholder:`${w}assets/images/ui/placeholder.webp`,k=window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${w}assets/images/logo/logo-fabio-square.webp`,P=r*100,I=s.global&&s.global.price_from?s.global.price_from:"",_=s.global&&s.global.discover?s.global.discover:"",T=s.global&&s.global.discover_package?s.global.discover_package:_,$=o?T:_,L=o?"global.discover_package":"global.discover",C=s.global&&s.global.premium_package?s.global.premium_package:"Premium Package",R=e.package_id||e.trip_id||"",v=encodeURIComponent(R),E=o?`package-details.html?id=${v}`:`details.html?id=${v}`,y=["catalog-card","trip-card"];o&&y.push("premium-package-card");const A=o?" standard-badge-premium":"",D=`
            <article class="${y.join(" ")}" data-trip-id="${e.trip_id}" data-aos="fade-up" data-aos-delay="${P}">
                <div class="catalog-card-image">
                    <img src="${g}" alt="${n}" class="catalog-card-img" decoding="async"
                         loading="lazy" onerror="this.onerror=function(){this.onerror=null; this.src='${k}';}; this.src='${S}';">
                    <div class="card-badges">
                        ${c}
                        ${p?`<span class="standard-badge${A}">${p}</span>`:""}
                    </div>
                </div>
                <div class="card-content">
                    ${o?`<div class="text-[10px] tracking-[0.22em] uppercase text-gold mb-1" data-i18n="global.premium_package">${C}</div>`:""}
                    <h3 class="catalog-card-title">${n}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${i}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${I}</span>
                            ${l}
                        </div>
                        <button class="card-btn" onclick="sessionStorage.setItem('fabio_nav_source','details'); window.location.href = '${E}'" data-i18n="${L}">${$}</button>
                    </div>
                </div>
            </article>
        `,h=document.createElement("div");return h.className="h-full w-full",h.innerHTML=D.trim(),h.firstElementChild},_resolveTextData:(e,a)=>{const r=e.trip_id||e.package_id||"",s=a.trips&&a.trips[r]?a.trips[r]:null;return{title:s?s.title:(e.trip_id||"").replace(/_/g," "),description:s?s.short_desc:""}},_resolvePriceData:(e,a,r)=>{const s=parseFloat(e.p_adult)||0,o=parseFloat(e.d_adult)||0;let n="",i="";if(o>0){const l=s>0?Math.round((s-o)/s*100):0,c=a.global&&a.global.limited_time_deal?a.global.limited_time_deal:"";r?i=`
                    <div class="discount-ribbon">
                        <span>-${l}%</span>
                    </div>
                `:i=`
                    <div class="deal-banner">
                        <span class="deal-percent">-${l}%</span>
                    </div>
                `,n=`
                <div class="price-row">
                    <span class="price-old">€${s}</span>
                    <span class="price-new">€${o}</span>
                    <span class="deal-inline">${c}</span>
                </div>
            `}else s>0?n=`
                <div class="price-row">
                    <span class="price-new">€${s}</span>
                </div>
            `:n='<div class="price-skeleton"></div>';return{priceRowHTML:n,dealBannerHTML:i}},_resolveImage:(e,a)=>{const r=window.ImagePaths?window.ImagePaths.resolveTripContext(e):{location:"",category:"",tripId:e.trip_id||""};let s=window.ImagePaths?window.ImagePaths.getPoster(r.location,r.category,r.tripId):`${u}assets/images/trips/${e.trip_id}/poster.webp`;if(a){const o=e.location||e.Location||e.loc||e.Loc||"sharm",n=String(o).toLowerCase().trim(),i=e.package_id||e.trip_id;s=`${u}assets/images/packages/${n}/${i}/poster.webp`}return s},_resolveBadge:(e,a,r)=>{const o=(r.global||{}).badges||{};if(e.badge_key){const n=String(e.badge_key).trim();return o[n]||o[n.toLowerCase()]||""}return a==="it"?e.badge_it||"":e.badge_en||""}};window.TripsRenderer=d;const M={render:()=>{const e=document.getElementById("trips-grid");if(!e)return;console.log("LocationRenderer: render()");const a=[{id:"sharm",title:"Sharm El Sheikh",img:`${u}assets/images/locations/sharm.jpg`},{id:"cairo",title:"Cairo",img:`${u}assets/images/locations/cairo.jpg`},{id:"luxor_and_aswan",title:"Luxor & Aswan",img:`${u}assets/images/locations/luxor_aswan.jpg`},{id:"desert",title:"Sinai Desert",img:`${u}assets/images/locations/desert.jpg`}];e.className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4 mx-auto";const r=document.createDocumentFragment();a.forEach((s,o)=>{const n=o*120,i=document.createElement("article");i.className="catalog-card trip-card",i.setAttribute("data-aos","fade-up"),i.setAttribute("data-aos-delay",String(n)),i.innerHTML=`
                <div class="catalog-card-image">
                    <img src="${s.img}" alt="${s.title}" class="catalog-card-img" loading="lazy" decoding="async"
                         onerror="this.onerror=null; this.src='${window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${u}assets/images/logo/logo-fabio-square.webp`}';">
                    <div class="card-badges"></div>
                </div>
                <div class="card-content">
                    <h3 class="catalog-card-title">${s.title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc"></p>
                    <div class="card-footer">
                        <div class="price-block"></div>
                        <a class="card-btn" href="explore.html?loc=${s.id}" data-i18n="global.discover">Explore</a>
                    </div>
                </div>
            `,r.appendChild(i)}),e.innerHTML="",e.appendChild(r),console.log("LocationRenderer: rendered items",a.length),window.AOS&&window.AOS.refresh()}};window.LocationRenderer=M;const t={state:{loc:null,sort:"default",category:"all",allRawTrips:[],filteredTrips:[],currentPage:1,itemsPerPage:10,hasLoadedOnce:!1},init:async()=>{const a=new URLSearchParams(window.location.search).get("loc")||"all",r=sessionStorage.getItem("fabio_nav_source");if(r==="details"){const n=sessionStorage.getItem("fabio_explore_sort"),i=sessionStorage.getItem("fabio_explore_cat");t.state.sort=n||"default",t.state.category=i||"all";const l=sessionStorage.getItem("fabio_explore_page");l&&(t.state.currentPage=parseInt(l))}else t.state.sort="default",t.state.category="all",t.state.currentPage=1,sessionStorage.setItem("fabio_explore_sort","default"),sessionStorage.setItem("fabio_explore_cat","all"),sessionStorage.removeItem("fabio_data_cache");t.state.loc=a,sessionStorage.setItem("fabio_last_loc",a);const s=sessionStorage.getItem("fabio_data_cache");let o=!1;if(r==="details"&&s)try{const n=JSON.parse(s);n&&(t.processData(n),o=!0)}catch(n){console.error("Cache parse error",n)}if(!o)if(t.renderFilterSkeleton&&t.renderFilterSkeleton(),t.renderCardSkeleton&&t.renderCardSkeleton(6),window.api&&window.api.fetchAllData){const n=await window.api.fetchAllData();sessionStorage.setItem("fabio_data_cache",JSON.stringify(n)),t.processData(n)}else t.renderOrEmpty&&t.renderOrEmpty();sessionStorage.removeItem("fabio_nav_source")},processData:e=>{const a=e.Trips_Prices||[],r=e.Packages||[],s=[...a,...r],o=String(t.state.loc||"all").toLowerCase().trim();t.state.allRawTrips=t._filterTrips(s,o),t.renderDynamicFilters&&t.renderDynamicFilters(),t.applyFiltersAndRender&&t.applyFiltersAndRender()},_filterTrips:(e,a)=>e.filter(r=>{const s=(c,g)=>{const p=Object.keys(c||{}).find(f=>f.toLowerCase().trim()===g);return p?c[p]:""},o=s(r,"location")||s(r,"loc")||s(r,"city")||"",n=String(o).toLowerCase().trim(),i=a==="all"||(a==="luxor_and_aswan"?n.includes("luxor")||n.includes("aswan"):n.includes(a)),l=String(r.is_active).toLowerCase()==="true"||r.is_active==="1"||r.is_active===!0;return i&&l}),resolveCategory:e=>{const a=e&&e.category||"",r=String(a).toLowerCase().trim();if(r)return r==="packages"?"bundles":r;if(window.ImagePaths&&typeof window.ImagePaths.resolveTripContext=="function"){const s=window.ImagePaths.resolveTripContext(e||{}),o=String(s&&s.category||"").toLowerCase().trim();if(o)return o}return"others"},renderDynamicFilters:()=>{const e=document.getElementById("filter-chips");if(!e)return;const a=new Set(t.state.allRawTrips.map(l=>t.resolveCategory(l))),r=["all",...Array.from(a).sort()],o=(localStorage.getItem("fabio_lang")||"it")==="en"?window.i18nEn||{}:window.i18nIt||{},n=o.global&&o.global.filters?o.global.filters:{};e.innerHTML=r.map(l=>{const c=t.state.category===l;let g;l==="bundles"?g=n.packages||"Packages":g=n[l]||l.charAt(0).toUpperCase()+l.slice(1);const p="inline-flex items-center justify-center h-8 px-3 rounded-full text-xs min-w-[64px] transition-colors";let f;return l==="bundles"?f=c?"bg-gold text-white font-bold border border-gold shadow-[0_0_24px_rgba(212,175,55,0.8)]":"bg-black/90 text-gold border border-gray-700 hover:border-gold shadow-none":f=c?"bg-transparent text-white border border-gold":"bg-black/60 text-white border border-gray-700 hover:border-gray-500",`<button class="${p} ${f}" onclick="ExploreRenderer.handleFilterClick('${l}')">${g}</button>`}).join("");const i=document.getElementById("price-sort");i&&(i.value=t.state.sort,i.onchange=l=>{t.state.sort=l.target.value;try{sessionStorage.setItem("fabio_explore_sort",t.state.sort)}catch{}t.applyFiltersAndRender()})},handleFilterClick:e=>{t.state.category=e,t.state.currentPage=1;try{sessionStorage.setItem("fabio_explore_cat",e)}catch{}t.renderDynamicFilters(),t.applyFiltersAndRender()},applyFiltersAndRender:()=>{let e=[...t.state.allRawTrips];t.state.category!=="all"&&(e=e.filter(r=>t.resolveCategory(r)===t.state.category)),e=t.sortTrips(e),t.state.filteredTrips=e;const a=Math.ceil(t.state.filteredTrips.length/t.state.itemsPerPage);a>0&&t.state.currentPage>a&&(t.state.currentPage=a),t.state.currentPage<1&&(t.state.currentPage=1),t.renderPage()},sortTrips:e=>{const a=t.state.sort,r=o=>{const n=parseFloat(o.d_adult||"0"),i=parseFloat(o.p_adult||"0");return n>0?n:i},s=o=>{const n=String(o.badge_it||"").trim()?2:0,i=String(o.badge_en||"").trim()?1:0;return n+i};return e.sort((o,n)=>{if(a==="price_asc")return r(o)-r(n);if(a==="price_desc")return r(n)-r(o);const i=s(n)-s(o);return i!==0?i:r(o)-r(n)})},renderPage:()=>{const e=document.getElementById("explore-grid");if(e){if(t.state.filteredTrips.length===0){t._renderNoResults(e),t._updatePagination(!0);return}t._renderGridItems(e),t._updatePagination(!1),t._postRenderEffects()}},_renderNoResults:e=>{const s=((localStorage.getItem("fabio_lang")||"it")==="en"?window.i18nEn||{}:window.i18nIt||{}).global?.no_exclusive_experiences||"No experiences found.";e.innerHTML=`<div class="col-span-full text-center py-20"><p class="text-gray-400 text-xl font-playfair italic">${s}</p></div>`},_renderGridItems:e=>{const a=(t.state.currentPage-1)*t.state.itemsPerPage,r=a+t.state.itemsPerPage,s=t.state.filteredTrips.slice(a,r),o=localStorage.getItem("fabio_lang")||"it";e.innerHTML="",s.forEach((n,i)=>{const l=window.TripsRenderer?window.TripsRenderer.createTripCard(n,o,i):null;l&&e.appendChild(l)}),t._updateCardsWithPrices(s)},_updatePagination:e=>{const a=document.getElementById("pagination-controls");if(!a)return;if(e){a.classList.add("hidden");return}const r=Math.ceil(t.state.filteredTrips.length/t.state.itemsPerPage);r>1?(a.classList.remove("hidden"),a.innerHTML=` 
        <button class="w-10 h-10 rounded-full border border-gold text-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-colors" ${t.state.currentPage===1?"disabled":""} onclick="ExploreRenderer.changePage(${t.state.currentPage-1})">←</button> 
        <span class="text-white font-playfair text-lg">Page <span class="text-gold">${t.state.currentPage}</span> of ${r}</span> 
        <button class="w-10 h-10 rounded-full border border-gold text-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-colors" ${t.state.currentPage===r?"disabled":""} onclick="ExploreRenderer.changePage(${t.state.currentPage+1})">→</button> 
      `):a.classList.add("hidden")},_postRenderEffects:()=>{if(window.AOS&&window.AOS.refresh(),t.state.hasLoadedOnce){const e=document.querySelector("section");e&&e.scrollIntoView({behavior:"smooth"})}t.state.hasLoadedOnce=!0},changePage:e=>{t.state.currentPage=e;try{sessionStorage.setItem("fabio_explore_page",e)}catch{}t.renderPage()},renderFilterSkeleton:()=>{const e=document.getElementById("filter-chips");e&&(e.innerHTML=Array(4).fill(0).map(()=>'<div class="chip-skeleton"></div>').join(""))},renderCardSkeleton:e=>{const a=document.getElementById("explore-grid");a&&(a.innerHTML=Array(e).fill(0).map(()=>` 
      <div class="bg-[#1a1510] rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border border-white/5 relative min-h-[400px]"> 
        <div class="h-[220px] w-full bg-gray-800/50 relative overflow-hidden animate-pulse"></div> 
        <div class="p-6 flex-grow space-y-6"> 
          <div class="h-7 bg-gray-800/50 rounded-lg w-3/4 animate-pulse"></div> 
        </div> 
      </div>`).join(""))},_updateCardsWithPrices:e=>{const a=localStorage.getItem("fabio_lang")||document.documentElement.lang||"it";e.forEach(r=>{const s=document.querySelector(`article.catalog-card[data-trip-id="${r.trip_id}"]`);if(!s)return;const o=s.querySelector(".price-block");if(o){const l=parseFloat(r.d_adult||"0"),c=parseFloat(r.p_adult||"0");let g="";l>0?g=`<div class="price-row fade-in-soft"><span class="price-old">€${c}</span><span class="price-new">€${l}</span></div>`:c>0&&(g=`<div class="price-row fade-in-soft"><span class="price-new">€${c}</span></div>`);const p=o.querySelector(".price-skeleton"),f=o.querySelector(".price-row");g&&(p||!f)&&(p&&p.remove(),f||o.insertAdjacentHTML("beforeend",g));const m=o.querySelectorAll(".price-row");m.length>1&&m.forEach((b,w)=>{w>0&&b.remove()})}const n=s.querySelector(".card-badges"),i=a==="en"?r.badge_en||"":r.badge_it||"";n&&i&&!n.querySelector(".standard-badge")&&n.insertAdjacentHTML("beforeend",`<span class="standard-badge fade-in-soft">${i}</span>`)})},renderOrEmpty:()=>{const e=document.getElementById("explore-grid");e&&(e.innerHTML="")}};window.ExploreRenderer=t;window.addEventListener("langChanged",()=>{t.state.hasLoadedOnce=!1,t.renderDynamicFilters(),t.renderPage()});
