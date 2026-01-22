import"./global-header-4j9IadTc.js";import"./ui-layout-YpVXqCmA.js";import"./global-footer-D0aab2x-.js";const d={state:{hasShownSkeleton:!1},_utils:{getLang:()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",getI18n:e=>e==="en"?window.i18nEn||{}:window.i18nIt||{},resolveCategory:e=>window.ExploreRenderer&&typeof window.ExploreRenderer.resolveCategory=="function"?window.ExploreRenderer.resolveCategory(e):String(e.category||"").toLowerCase().trim(),isPackage:e=>{const a=d._utils.resolveCategory(e);return String(e.type||"").toLowerCase()==="package"||a==="bundles"}},render:e=>{const a=document.getElementById("trips-grid");if(a){if(a.className="trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto",!d.state.hasShownSkeleton&&!window.hasShownSkeleton){d.state.hasShownSkeleton=!0,window.hasShownSkeleton=!0,d._renderSkeleton(a),setTimeout(()=>{d.renderRealCards(e,a)},1500);return}d.renderRealCards(e,a)}},_renderSkeleton:e=>{const a=Array(4).fill(0).map(()=>`
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
        `).join("");e.innerHTML=a},renderRealCards:(e,a)=>{const s=e.filter(i=>String(i.featured||"").toUpperCase()==="TRUE");if(!s||s.length===0){d._renderEmptyState(a);return}const r=document.createDocumentFragment(),o=d._utils.getLang();s.forEach((i,n)=>{const l=d.createTripCard(i,o,n);l&&r.appendChild(l)}),a.appendChild(r),window.AOS&&window.AOS.refresh()},_renderEmptyState:e=>{const a=d._utils.getLang(),s=d._utils.getI18n(a),r=s&&s.global&&typeof s.global.no_exclusive_experiences=="string"?s.global.no_exclusive_experiences:"";e.innerHTML=`<div class="col-span-full text-center py-20">
            <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${r}</p>
        </div>`},createTripCard:(e,a,s)=>{const r=d._utils.getI18n(a),o=d._utils.isPackage(e),{title:i,description:n}=d._resolveTextData(e,r),{priceRowHTML:l,dealBannerHTML:c}=d._resolvePriceData(e,r,o),g=d._resolveImage(e,o),p=d._resolveBadge(e,a,r),f=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean)[0]||"",w=f?`/${f}/`:"/",m=typeof window<"u"&&window.FABIO_BASE_URL||w,y=window.ImagePaths?window.ImagePaths.ui.placeholder:`${m}assets/images/ui/placeholder.webp`,x=window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${m}assets/images/logo/logo-fabio-square.webp`,S=s*100,P=r.global&&r.global.price_from?r.global.price_from:"",h=r.global&&r.global.discover?r.global.discover:"",k=r.global&&r.global.discover_package?r.global.discover_package:h,I=o?k:h,$=o?"global.discover_package":"global.discover",L=r.global&&r.global.premium_package?r.global.premium_package:"Premium Package",T=e.package_id||e.trip_id||"",_=encodeURIComponent(T),C=o?`package-details.html?id=${_}`:`details.html?id=${_}`,v=["catalog-card","trip-card"];o&&v.push("premium-package-card");const E=o?" standard-badge-premium":"",R=`
            <article class="${v.join(" ")}" data-trip-id="${e.trip_id}" data-aos="fade-up" data-aos-delay="${S}">
                <div class="catalog-card-image">
                    <img src="${g}" alt="${i}" class="catalog-card-img"
                         loading="lazy" onerror="this.onerror=function(){this.onerror=null; this.src='${x}';}; this.src='${y}';">
                    <div class="card-badges">
                        ${c}
                        ${p?`<span class="standard-badge${E}">${p}</span>`:""}
                    </div>
                </div>
                <div class="card-content">
                    ${o?`<div class="text-[10px] tracking-[0.22em] uppercase text-gold mb-1" data-i18n="global.premium_package">${L}</div>`:""}
                    <h3 class="catalog-card-title">${i}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${n}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${P}</span>
                            ${l}
                        </div>
                        <button class="card-btn" onclick="sessionStorage.setItem('fabio_nav_source','details'); window.location.href = '${C}'" data-i18n="${$}">${I}</button>
                    </div>
                </div>
            </article>
        `,b=document.createElement("div");return b.className="h-full w-full",b.innerHTML=R.trim(),b.firstElementChild},_resolveTextData:(e,a)=>{const s=e.trip_id||e.package_id||"",r=a.trips&&a.trips[s]?a.trips[s]:null;return{title:r?r.title:(e.trip_id||"").replace(/_/g," "),description:r?r.short_desc:""}},_resolvePriceData:(e,a,s)=>{const r=parseFloat(e.p_adult)||0,o=parseFloat(e.d_adult)||0;let i="",n="";if(o>0){const l=r>0?Math.round((r-o)/r*100):0,c=a.global&&a.global.limited_time_deal?a.global.limited_time_deal:"";s?n=`
                    <div class="discount-ribbon">
                        <span>-${l}%</span>
                    </div>
                `:n=`
                    <div class="deal-banner">
                        <span class="deal-percent">-${l}%</span>
                    </div>
                `,i=`
                <div class="price-row">
                    <span class="price-old">€${r}</span>
                    <span class="price-new">€${o}</span>
                    <span class="deal-inline">${c}</span>
                </div>
            `}else r>0?i=`
                <div class="price-row">
                    <span class="price-new">€${r}</span>
                </div>
            `:i='<div class="price-skeleton"></div>';return{priceRowHTML:i,dealBannerHTML:n}},_resolveImage:(e,a)=>{const s=window.ImagePaths?window.ImagePaths.resolveTripContext(e):{location:"",category:"",tripId:e.trip_id||""};let r=window.ImagePaths?window.ImagePaths.getPoster(s.location,s.category,s.tripId):`${__BASE}assets/images/trips/${e.trip_id}/poster.webp`;if(a){const o=e.location||e.Location||e.loc||e.Loc||"sharm",i=String(o).toLowerCase().trim(),n=e.package_id||e.trip_id;r=`${__BASE}assets/images/packages/${i}/${n}/poster.webp`}return r},_resolveBadge:(e,a,s)=>{const o=(s.global||{}).badges||{};if(e.badge_key){const i=String(e.badge_key).trim();return o[i]||o[i.toLowerCase()]||""}return a==="it"?e.badge_it||"":e.badge_en||""}};window.TripsRenderer=d;const A={render:()=>{const e=document.getElementById("trips-grid");if(!e)return;const a=[{id:"sharm",title:"Sharm El Sheikh",img:`${__BASE}assets/images/locations/sharm.jpg`},{id:"cairo",title:"Cairo",img:`${__BASE}assets/images/locations/cairo.jpg`},{id:"luxor_and_aswan",title:"Luxor & Aswan",img:`${__BASE}assets/images/locations/luxor_aswan.jpg`},{id:"desert",title:"Sinai Desert",img:`${__BASE}assets/images/locations/desert.jpg`}];e.className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4 mx-auto";const s=document.createDocumentFragment();a.forEach((r,o)=>{const i=o*120,n=document.createElement("article");n.className="catalog-card trip-card",n.setAttribute("data-aos","fade-up"),n.setAttribute("data-aos-delay",String(i)),n.innerHTML=`
                <div class="catalog-card-image">
                    <img src="${r.img}" alt="${r.title}" class="catalog-card-img" loading="lazy"
                         onerror="this.onerror=null; this.src='${window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${__BASE}assets/images/logo/logo-fabio-square.webp`}';">
                    <div class="card-badges"></div>
                </div>
                <div class="card-content">
                    <h3 class="catalog-card-title">${r.title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc"></p>
                    <div class="card-footer">
                        <div class="price-block"></div>
                        <a class="card-btn" href="explore.html?loc=${r.id}" data-i18n="global.discover">Explore</a>
                    </div>
                </div>
            `,s.appendChild(n)}),e.innerHTML="",e.appendChild(s),window.AOS&&window.AOS.refresh()}};window.LocationRenderer=A;const t={state:{loc:null,sort:"default",category:"all",allRawTrips:[],filteredTrips:[],currentPage:1,itemsPerPage:10,hasLoadedOnce:!1},init:async()=>{const a=new URLSearchParams(window.location.search).get("loc")||"all",s=sessionStorage.getItem("fabio_nav_source");if(s==="details"){const i=sessionStorage.getItem("fabio_explore_sort"),n=sessionStorage.getItem("fabio_explore_cat");t.state.sort=i||"default",t.state.category=n||"all";const l=sessionStorage.getItem("fabio_explore_page");l&&(t.state.currentPage=parseInt(l))}else t.state.sort="default",t.state.category="all",t.state.currentPage=1,sessionStorage.setItem("fabio_explore_sort","default"),sessionStorage.setItem("fabio_explore_cat","all"),sessionStorage.removeItem("fabio_data_cache");t.state.loc=a,sessionStorage.setItem("fabio_last_loc",a);const r=sessionStorage.getItem("fabio_data_cache");let o=!1;if(s==="details"&&r)try{const i=JSON.parse(r);i&&(t.processData(i),o=!0)}catch(i){console.error("Cache parse error",i)}if(!o)if(t.renderFilterSkeleton&&t.renderFilterSkeleton(),t.renderCardSkeleton&&t.renderCardSkeleton(6),window.api&&window.api.fetchAllData){const i=await window.api.fetchAllData();sessionStorage.setItem("fabio_data_cache",JSON.stringify(i)),t.processData(i)}else t.renderOrEmpty&&t.renderOrEmpty();sessionStorage.removeItem("fabio_nav_source")},processData:e=>{const a=e.Trips_Prices||[],s=e.Packages||[],r=[...a,...s],o=String(t.state.loc||"all").toLowerCase().trim();t.state.allRawTrips=t._filterTrips(r,o),t.renderDynamicFilters&&t.renderDynamicFilters(),t.applyFiltersAndRender&&t.applyFiltersAndRender()},_filterTrips:(e,a)=>e.filter(s=>{const r=(c,g)=>{const p=Object.keys(c||{}).find(u=>u.toLowerCase().trim()===g);return p?c[p]:""},o=r(s,"location")||r(s,"loc")||r(s,"city")||"",i=String(o).toLowerCase().trim(),n=a==="all"||(a==="luxor_and_aswan"?i.includes("luxor")||i.includes("aswan"):i.includes(a)),l=String(s.is_active).toLowerCase()==="true"||s.is_active==="1"||s.is_active===!0;return n&&l}),resolveCategory:e=>{const a=e&&e.category||"",s=String(a).toLowerCase().trim();if(s)return s==="packages"?"bundles":s;if(window.ImagePaths&&typeof window.ImagePaths.resolveTripContext=="function"){const r=window.ImagePaths.resolveTripContext(e||{}),o=String(r&&r.category||"").toLowerCase().trim();if(o)return o}return"others"},renderDynamicFilters:()=>{const e=document.getElementById("filter-chips");if(!e)return;const a=new Set(t.state.allRawTrips.map(l=>t.resolveCategory(l))),s=["all",...Array.from(a).sort()],o=(localStorage.getItem("fabio_lang")||"it")==="en"?window.i18nEn||{}:window.i18nIt||{},i=o.global&&o.global.filters?o.global.filters:{};e.innerHTML=s.map(l=>{const c=t.state.category===l;let g;l==="bundles"?g=i.packages||"Packages":g=i[l]||l.charAt(0).toUpperCase()+l.slice(1);const p="inline-flex items-center justify-center h-8 px-3 rounded-full text-xs min-w-[64px] transition-colors";let u;return l==="bundles"?u=c?"bg-gold text-white font-bold border border-gold shadow-[0_0_24px_rgba(212,175,55,0.8)]":"bg-black/90 text-gold border border-gray-700 hover:border-gold shadow-none":u=c?"bg-transparent text-white border border-gold":"bg-black/60 text-white border border-gray-700 hover:border-gray-500",`<button class="${p} ${u}" onclick="ExploreRenderer.handleFilterClick('${l}')">${g}</button>`}).join("");const n=document.getElementById("price-sort");n&&(n.value=t.state.sort,n.onchange=l=>{t.state.sort=l.target.value;try{sessionStorage.setItem("fabio_explore_sort",t.state.sort)}catch{}t.applyFiltersAndRender()})},handleFilterClick:e=>{t.state.category=e,t.state.currentPage=1;try{sessionStorage.setItem("fabio_explore_cat",e)}catch{}t.renderDynamicFilters(),t.applyFiltersAndRender()},applyFiltersAndRender:()=>{let e=[...t.state.allRawTrips];t.state.category!=="all"&&(e=e.filter(s=>t.resolveCategory(s)===t.state.category)),e=t.sortTrips(e),t.state.filteredTrips=e;const a=Math.ceil(t.state.filteredTrips.length/t.state.itemsPerPage);a>0&&t.state.currentPage>a&&(t.state.currentPage=a),t.state.currentPage<1&&(t.state.currentPage=1),t.renderPage()},sortTrips:e=>{const a=t.state.sort,s=o=>{const i=parseFloat(o.d_adult||"0"),n=parseFloat(o.p_adult||"0");return i>0?i:n},r=o=>{const i=String(o.badge_it||"").trim()?2:0,n=String(o.badge_en||"").trim()?1:0;return i+n};return e.sort((o,i)=>{if(a==="price_asc")return s(o)-s(i);if(a==="price_desc")return s(i)-s(o);const n=r(i)-r(o);return n!==0?n:s(o)-s(i)})},renderPage:()=>{const e=document.getElementById("explore-grid");if(e){if(t.state.filteredTrips.length===0){t._renderNoResults(e),t._updatePagination(!0);return}t._renderGridItems(e),t._updatePagination(!1),t._postRenderEffects()}},_renderNoResults:e=>{const r=((localStorage.getItem("fabio_lang")||"it")==="en"?window.i18nEn||{}:window.i18nIt||{}).global?.no_exclusive_experiences||"No experiences found.";e.innerHTML=`<div class="col-span-full text-center py-20"><p class="text-gray-400 text-xl font-playfair italic">${r}</p></div>`},_renderGridItems:e=>{const a=(t.state.currentPage-1)*t.state.itemsPerPage,s=a+t.state.itemsPerPage,r=t.state.filteredTrips.slice(a,s),o=localStorage.getItem("fabio_lang")||"it";e.innerHTML="",r.forEach((i,n)=>{const l=window.TripsRenderer?window.TripsRenderer.createTripCard(i,o,n):null;l&&e.appendChild(l)}),t._updateCardsWithPrices(r)},_updatePagination:e=>{const a=document.getElementById("pagination-controls");if(!a)return;if(e){a.classList.add("hidden");return}const s=Math.ceil(t.state.filteredTrips.length/t.state.itemsPerPage);s>1?(a.classList.remove("hidden"),a.innerHTML=` 
        <button class="w-10 h-10 rounded-full border border-gold text-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-colors" ${t.state.currentPage===1?"disabled":""} onclick="ExploreRenderer.changePage(${t.state.currentPage-1})">←</button> 
        <span class="text-white font-playfair text-lg">Page <span class="text-gold">${t.state.currentPage}</span> of ${s}</span> 
        <button class="w-10 h-10 rounded-full border border-gold text-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-colors" ${t.state.currentPage===s?"disabled":""} onclick="ExploreRenderer.changePage(${t.state.currentPage+1})">→</button> 
      `):a.classList.add("hidden")},_postRenderEffects:()=>{if(window.AOS&&window.AOS.refresh(),t.state.hasLoadedOnce){const e=document.querySelector("section");e&&e.scrollIntoView({behavior:"smooth"})}t.state.hasLoadedOnce=!0},changePage:e=>{t.state.currentPage=e;try{sessionStorage.setItem("fabio_explore_page",e)}catch{}t.renderPage()},renderFilterSkeleton:()=>{const e=document.getElementById("filter-chips");e&&(e.innerHTML=Array(4).fill(0).map(()=>'<div class="chip-skeleton"></div>').join(""))},renderCardSkeleton:e=>{const a=document.getElementById("explore-grid");a&&(a.innerHTML=Array(e).fill(0).map(()=>` 
      <div class="bg-[#1a1510] rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border border-white/5 relative min-h-[400px]"> 
        <div class="h-[220px] w-full bg-gray-800/50 relative overflow-hidden animate-pulse"></div> 
        <div class="p-6 flex-grow space-y-6"> 
          <div class="h-7 bg-gray-800/50 rounded-lg w-3/4 animate-pulse"></div> 
        </div> 
      </div>`).join(""))},_updateCardsWithPrices:e=>{const a=localStorage.getItem("fabio_lang")||document.documentElement.lang||"it";e.forEach(s=>{const r=document.querySelector(`article.catalog-card[data-trip-id="${s.trip_id}"]`);if(!r)return;const o=r.querySelector(".price-block");if(o){const l=parseFloat(s.d_adult||"0"),c=parseFloat(s.p_adult||"0");let g="";l>0?g=`<div class="price-row fade-in-soft"><span class="price-old">€${c}</span><span class="price-new">€${l}</span></div>`:c>0&&(g=`<div class="price-row fade-in-soft"><span class="price-new">€${c}</span></div>`);const p=o.querySelector(".price-skeleton"),u=o.querySelector(".price-row");g&&(p||!u)&&(p&&p.remove(),u||o.insertAdjacentHTML("beforeend",g));const f=o.querySelectorAll(".price-row");f.length>1&&f.forEach((w,m)=>{m>0&&w.remove()})}const i=r.querySelector(".card-badges"),n=a==="en"?s.badge_en||"":s.badge_it||"";i&&n&&!i.querySelector(".standard-badge")&&i.insertAdjacentHTML("beforeend",`<span class="standard-badge fade-in-soft">${n}</span>`)})},renderOrEmpty:()=>{const e=document.getElementById("explore-grid");e&&(e.innerHTML="")}};window.ExploreRenderer=t;window.addEventListener("langChanged",()=>{t.state.hasLoadedOnce=!1,t.renderDynamicFilters(),t.renderPage()});
