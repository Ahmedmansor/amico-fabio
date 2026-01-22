const r={state:{hasShownSkeleton:!1},_utils:{getLang:()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",getI18n:e=>e==="en"?window.i18nEn||{}:window.i18nIt||{},resolveCategory:e=>window.ExploreRenderer&&typeof window.ExploreRenderer.resolveCategory=="function"?window.ExploreRenderer.resolveCategory(e):String(e.category||"").toLowerCase().trim(),isPackage:e=>{const t=r._utils.resolveCategory(e);return String(e.type||"").toLowerCase()==="package"||t==="bundles"}},render:e=>{const t=document.getElementById("trips-grid");if(t){if(t.className="trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto",!r.state.hasShownSkeleton&&!window.hasShownSkeleton){r.state.hasShownSkeleton=!0,window.hasShownSkeleton=!0,r._renderSkeleton(t),setTimeout(()=>{r.renderRealCards(e,t)},1500);return}r.renderRealCards(e,t)}},_renderSkeleton:e=>{const t=Array(4).fill(0).map(()=>`
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
        `).join("");e.innerHTML=t},renderRealCards:(e,t)=>{t.innerHTML="";const s=e.filter(o=>String(o.featured||"").toUpperCase()==="TRUE");if(!s||s.length===0){r._renderEmptyState(t);return}const a=document.createDocumentFragment(),i=r._utils.getLang();s.forEach((o,l)=>{const n=r.createTripCard(o,i,l);n&&a.appendChild(n)}),t.appendChild(a),window.AOS&&window.AOS.refresh()},_renderEmptyState:e=>{const t=r._utils.getLang(),s=r._utils.getI18n(t),a=s&&s.global&&typeof s.global.no_exclusive_experiences=="string"?s.global.no_exclusive_experiences:"";e.innerHTML=`<div class="col-span-full text-center py-20">
            <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${a}</p>
        </div>`},createTripCard:(e,t,s)=>{const a=r._utils.getI18n(t),i=r._utils.isPackage(e),{title:o,description:l}=r._resolveTextData(e,a),{priceRowHTML:n,dealBannerHTML:d}=r._resolvePriceData(e,a,i),_=r._resolveImage(e,i),g=r._resolveBadge(e,t,a),p=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean)[0]||"",b=p?`/${p}/`:"/",m=typeof window<"u"&&window.FABIO_BASE_URL||b,h=window.ImagePaths?window.ImagePaths.ui.placeholder:`${m}assets/images/ui/placeholder.webp`,f=window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${m}assets/images/logo/logo-fabio-square.webp`,x=s*100,$=a.global&&a.global.price_from?a.global.price_from:"",w=a.global&&a.global.discover?a.global.discover:"",y=a.global&&a.global.discover_package?a.global.discover_package:w,S=i?y:w,k=i?"global.discover_package":"global.discover",L=a.global&&a.global.premium_package?a.global.premium_package:"Premium Package",I=e.package_id||e.trip_id||"",v=encodeURIComponent(I),E=i?`package-details.html?id=${v}`:`details.html?id=${v}`,u=["catalog-card","trip-card"];i&&u.push("premium-package-card");const C=i?" standard-badge-premium":"",T=`
            <article class="${u.join(" ")}" data-trip-id="${e.trip_id}" data-aos="fade-up" data-aos-delay="${x}">
                <div class="catalog-card-image">
                    <img src="${_}" alt="${o}" class="catalog-card-img"
                         loading="lazy" onerror="this.onerror=function(){this.onerror=null; this.src='${f}';}; this.src='${h}';">
                    <div class="card-badges">
                        ${d}
                        ${g?`<span class="standard-badge${C}">${g}</span>`:""}
                    </div>
                </div>
                <div class="card-content">
                    ${i?`<div class="text-[10px] tracking-[0.22em] uppercase text-gold mb-1" data-i18n="global.premium_package">${L}</div>`:""}
                    <h3 class="catalog-card-title">${o}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${l}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${$}</span>
                            ${n}
                        </div>
                        <button class="card-btn" onclick="sessionStorage.setItem('fabio_nav_source','details'); window.location.href = '${E}'" data-i18n="${k}">${S}</button>
                    </div>
                </div>
            </article>
        `,c=document.createElement("div");return c.className="h-full w-full",c.innerHTML=T.trim(),c.firstElementChild},_resolveTextData:(e,t)=>{const s=e.trip_id||e.package_id||"",a=t.trips&&t.trips[s]?t.trips[s]:null;return{title:a?a.title:(e.trip_id||"").replace(/_/g," "),description:a?a.short_desc:""}},_resolvePriceData:(e,t,s)=>{const a=parseFloat(e.p_adult)||0,i=parseFloat(e.d_adult)||0;let o="",l="";if(i>0){const n=a>0?Math.round((a-i)/a*100):0,d=t.global&&t.global.limited_time_deal?t.global.limited_time_deal:"";s?l=`
                    <div class="discount-ribbon">
                        <span>-${n}%</span>
                    </div>
                `:l=`
                    <div class="deal-banner">
                        <span class="deal-percent">-${n}%</span>
                    </div>
                `,o=`
                <div class="price-row">
                    <span class="price-old">€${a}</span>
                    <span class="price-new">€${i}</span>
                    <span class="deal-inline">${d}</span>
                </div>
            `}else a>0?o=`
                <div class="price-row">
                    <span class="price-new">€${a}</span>
                </div>
            `:o='<div class="price-skeleton"></div>';return{priceRowHTML:o,dealBannerHTML:l}},_resolveImage:(e,t)=>{const s=window.ImagePaths?window.ImagePaths.resolveTripContext(e):{location:"",category:"",tripId:e.trip_id||""};let a=window.ImagePaths?window.ImagePaths.getPoster(s.location,s.category,s.tripId):`${__BASE}assets/images/trips/${e.trip_id}/poster.webp`;if(t){const i=e.location||e.Location||e.loc||e.Loc||"sharm",o=String(i).toLowerCase().trim(),l=e.package_id||e.trip_id;a=`${__BASE}assets/images/packages/${o}/${l}/poster.webp`}return a},_resolveBadge:(e,t,s)=>{const i=(s.global||{}).badges||{};if(e.badge_key){const o=String(e.badge_key).trim();return i[o]||i[o.toLowerCase()]||""}return t==="it"?e.badge_it||"":e.badge_en||""}};window.TripsRenderer=r;const P={render:()=>{const e=document.getElementById("trips-grid");if(!e)return;const t=[{id:"sharm",title:"Sharm El Sheikh",img:`${__BASE}assets/images/locations/sharm.jpg`},{id:"cairo",title:"Cairo",img:`${__BASE}assets/images/locations/cairo.jpg`},{id:"luxor_and_aswan",title:"Luxor & Aswan",img:`${__BASE}assets/images/locations/luxor_aswan.jpg`},{id:"desert",title:"Sinai Desert",img:`${__BASE}assets/images/locations/desert.jpg`}];e.className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4 mx-auto";const s=document.createDocumentFragment();t.forEach((a,i)=>{const o=i*120,l=document.createElement("article");l.className="catalog-card trip-card",l.setAttribute("data-aos","fade-up"),l.setAttribute("data-aos-delay",String(o)),l.innerHTML=`
                <div class="catalog-card-image">
                    <img src="${a.img}" alt="${a.title}" class="catalog-card-img" loading="lazy"
                         onerror="this.onerror=null; this.src='${window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${__BASE}assets/images/logo/logo-fabio-square.webp`}';">
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
            `,s.appendChild(l)}),e.innerHTML="",e.appendChild(s),window.AOS&&window.AOS.refresh()}};window.LocationRenderer=P;
