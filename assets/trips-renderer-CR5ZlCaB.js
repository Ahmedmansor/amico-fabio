const B=typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[],h=B.filter(Boolean)[0]||"",A=h?`/${h}/`:"/",d=typeof window<"u"&&window.FABIO_BASE_URL||A,r={state:{hasShownSkeleton:!1},_utils:{getLang:()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",getI18n:e=>e==="en"?window.i18nEn||{}:window.i18nIt||{},resolveCategory:e=>window.ExploreRenderer&&typeof window.ExploreRenderer.resolveCategory=="function"?window.ExploreRenderer.resolveCategory(e):String(e.category||"").toLowerCase().trim(),isPackage:e=>{const t=r._utils.resolveCategory(e);return String(e.type||"").toLowerCase()==="package"||t==="bundles"}},render:e=>{const t=document.getElementById("trips-grid");if(t){if(console.log("TripsRenderer: render()",{tripsCount:Array.isArray(e)?e.length:0,containerFound:!!t}),t.className="trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto",!r.state.hasShownSkeleton&&!window.hasShownSkeleton){r.state.hasShownSkeleton=!0,window.hasShownSkeleton=!0,r._renderSkeleton(t),console.log("TripsRenderer: skeleton shown"),setTimeout(()=>{r.renderRealCards(e,t)},1500);return}r.renderRealCards(e,t)}},_renderSkeleton:e=>{const t=Array(4).fill(0).map(()=>`
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
        `).join("");e.innerHTML=t},renderRealCards:(e,t)=>{console.log("TripsRenderer: renderRealCards start",{containerExists:!!t,tripsCount:Array.isArray(e)?e.length:0});const s=e.filter(n=>String(n.featured||"").toUpperCase()==="TRUE");if(console.log("TripsRenderer: featured count",s.length),!s||s.length===0){console.log("TripsRenderer: no featured trips found; keeping fallback HTML"),r._renderEmptyState(t);return}t.innerHTML="";const a=document.createDocumentFragment(),o=r._utils.getLang();console.log("TripsRenderer: appending cards",s.length),s.forEach((n,i)=>{const l=r.createTripCard(n,o,i);l&&a.appendChild(l)}),t.appendChild(a),console.log("TripsRenderer: rendered cards",s.length),window.AOS&&(console.log("TripsRenderer: AOS.refresh()"),window.AOS.refresh())},_renderEmptyState:e=>{const t=r._utils.getLang(),s=r._utils.getI18n(t),a=s&&s.global&&typeof s.global.no_exclusive_experiences=="string"?s.global.no_exclusive_experiences:"";e.innerHTML=`<div class="col-span-full text-center py-20">
            <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${a}</p>
        </div>`,console.log("TripsRenderer: empty state rendered")},createTripCard:(e,t,s)=>{const a=r._utils.getI18n(t),o=r._utils.isPackage(e),{title:n,description:i}=r._resolveTextData(e,a),{priceRowHTML:l,dealBannerHTML:c}=r._resolvePriceData(e,a,o),b=r._resolveImage(e,o),p=r._resolveBadge(e,t,a),m=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean)[0]||"",_=m?`/${m}/`:"/",w=typeof window<"u"&&window.FABIO_BASE_URL||_,y=window.ImagePaths?window.ImagePaths.ui.placeholder:`${w}assets/images/ui/placeholder.webp`,x=window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${w}assets/images/logo/logo-fabio-square.webp`,$=s*100,k=a.global&&a.global.price_from?a.global.price_from:"",u=a.global&&a.global.discover?a.global.discover:"",S=a.global&&a.global.discover_package?a.global.discover_package:u,T=o?S:u,L=o?"global.discover_package":"global.discover",R=a.global&&a.global.premium_package?a.global.premium_package:"Premium Package",I=e.package_id||e.trip_id||"",v=encodeURIComponent(I),C=o?`package-details.html?id=${v}`:`details.html?id=${v}`,f=["catalog-card","trip-card"];o&&f.push("premium-package-card");const E=o?" standard-badge-premium":"",P=`
            <article class="${f.join(" ")}" data-trip-id="${e.trip_id}" data-aos="fade-up" data-aos-delay="${$}">
                <div class="catalog-card-image">
                    <img src="${b}" alt="${n}" class="catalog-card-img" decoding="async"
                         loading="lazy" onerror="this.onerror=function(){this.onerror=null; this.src='${x}';}; this.src='${y}';">
                    <div class="card-badges">
                        ${c}
                        ${p?`<span class="standard-badge${E}">${p}</span>`:""}
                    </div>
                </div>
                <div class="card-content">
                    ${o?`<div class="text-[10px] tracking-[0.22em] uppercase text-gold mb-1" data-i18n="global.premium_package">${R}</div>`:""}
                    <h3 class="catalog-card-title">${n}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${i}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${k}</span>
                            ${l}
                        </div>
                        <button class="card-btn" onclick="sessionStorage.setItem('fabio_nav_source','details'); window.location.href = '${C}'" data-i18n="${L}">${T}</button>
                    </div>
                </div>
            </article>
        `,g=document.createElement("div");return g.className="h-full w-full",g.innerHTML=P.trim(),g.firstElementChild},_resolveTextData:(e,t)=>{const s=e.trip_id||e.package_id||"",a=t.trips&&t.trips[s]?t.trips[s]:null;return{title:a?a.title:(e.trip_id||"").replace(/_/g," "),description:a?a.short_desc:""}},_resolvePriceData:(e,t,s)=>{const a=parseFloat(e.p_adult)||0,o=parseFloat(e.d_adult)||0;let n="",i="";if(o>0){const l=a>0?Math.round((a-o)/a*100):0,c=t.global&&t.global.limited_time_deal?t.global.limited_time_deal:"";s?i=`
                    <div class="discount-ribbon">
                        <span>-${l}%</span>
                    </div>
                `:i=`
                    <div class="deal-banner">
                        <span class="deal-percent">-${l}%</span>
                    </div>
                `,n=`
                <div class="price-row">
                    <span class="price-old">€${a}</span>
                    <span class="price-new">€${o}</span>
                    <span class="deal-inline">${c}</span>
                </div>
            `}else a>0?n=`
                <div class="price-row">
                    <span class="price-new">€${a}</span>
                </div>
            `:n='<div class="price-skeleton"></div>';return{priceRowHTML:n,dealBannerHTML:i}},_resolveImage:(e,t)=>{const s=window.ImagePaths?window.ImagePaths.resolveTripContext(e):{location:"",category:"",tripId:e.trip_id||""};let a=window.ImagePaths?window.ImagePaths.getPoster(s.location,s.category,s.tripId):`${d}assets/images/trips/${e.trip_id}/poster.webp`;if(t){const o=e.location||e.Location||e.loc||e.Loc||"sharm",n=String(o).toLowerCase().trim(),i=e.package_id||e.trip_id;a=`${d}assets/images/packages/${n}/${i}/poster.webp`}return a},_resolveBadge:(e,t,s)=>{const o=(s.global||{}).badges||{};if(e.badge_key){const n=String(e.badge_key).trim();return o[n]||o[n.toLowerCase()]||""}return t==="it"?e.badge_it||"":e.badge_en||""}};window.TripsRenderer=r;const M={render:()=>{const e=document.getElementById("trips-grid");if(!e)return;console.log("LocationRenderer: render()");const t=[{id:"sharm",title:"Sharm El Sheikh",img:`${d}assets/images/locations/sharm.jpg`},{id:"cairo",title:"Cairo",img:`${d}assets/images/locations/cairo.jpg`},{id:"luxor_and_aswan",title:"Luxor & Aswan",img:`${d}assets/images/locations/luxor_aswan.jpg`},{id:"desert",title:"Sinai Desert",img:`${d}assets/images/locations/desert.jpg`}];e.className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4 mx-auto";const s=document.createDocumentFragment();t.forEach((a,o)=>{const n=o*120,i=document.createElement("article");i.className="catalog-card trip-card",i.setAttribute("data-aos","fade-up"),i.setAttribute("data-aos-delay",String(n)),i.innerHTML=`
                <div class="catalog-card-image">
                    <img src="${a.img}" alt="${a.title}" class="catalog-card-img" loading="lazy" decoding="async"
                         onerror="this.onerror=null; this.src='${window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${d}assets/images/logo/logo-fabio-square.webp`}';">
                    <div class="card-badges"></div>
                </div>
                <div class="card-content">
                    <h3 class="catalog-card-title">${a.title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc"></p>
                    <div class="card-footer">
                        <div class="price-block"></div>
                        <a class="card-btn" href="explore.html?loc=${a.id}" data-i18n="global.discover">Explore</a>
                    </div>
                </div>
            `,s.appendChild(i)}),e.innerHTML="",e.appendChild(s),console.log("LocationRenderer: rendered items",t.length),window.AOS&&window.AOS.refresh()}};window.LocationRenderer=M;
