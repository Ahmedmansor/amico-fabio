const l={state:{hasShownSkeleton:!1},_utils:{getLang:()=>localStorage.getItem("fabio_lang")||document.documentElement.lang||"it",getI18n:e=>e==="en"?window.i18nEn||{}:window.i18nIt||{},resolveCategory:e=>window.ExploreRenderer&&typeof window.ExploreRenderer.resolveCategory=="function"?window.ExploreRenderer.resolveCategory(e):String(e.category||"").toLowerCase().trim(),isPackage:e=>{const a=l._utils.resolveCategory(e);return String(e.type||"").toLowerCase()==="package"||a==="bundles"}},render:e=>{const a=document.getElementById("trips-grid");if(a){if(a.className="trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto",!l.state.hasShownSkeleton&&!window.hasShownSkeleton){l.state.hasShownSkeleton=!0,window.hasShownSkeleton=!0,l._renderSkeleton(a),setTimeout(()=>{l.renderRealCards(e,a)},1500);return}l.renderRealCards(e,a)}},_renderSkeleton:e=>{const a=Array(4).fill(0).map(()=>`
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
        `).join("");e.innerHTML=a},renderRealCards:(e,a)=>{a.innerHTML="";const o=e.filter(i=>String(i.featured||"").toUpperCase()==="TRUE");if(!o||o.length===0){l._renderEmptyState(a);return}const t=document.createDocumentFragment(),s=l._utils.getLang();o.forEach((i,r)=>{const n=l.createTripCard(i,s,r);n&&t.appendChild(n)}),a.appendChild(t)},_renderEmptyState:e=>{const a=l._utils.getLang(),o=l._utils.getI18n(a),t=o&&o.global&&typeof o.global.no_exclusive_experiences=="string"?o.global.no_exclusive_experiences:"";e.innerHTML=`<div class="col-span-full text-center py-20">
            <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${t}</p>
        </div>`},createTripCard:(e,a,o)=>{const t=l._utils.getI18n(a),s=l._utils.isPackage(e),{title:i,description:r}=l._resolveTextData(e,t),{priceRowHTML:n,dealBannerHTML:d}=l._resolvePriceData(e,t,s),g=l._resolveImage(e,s),c=l._resolveBadge(e,a,t),w=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean),u=w.length>1&&w[0]||"",f=u?`/${u}/`:"/",v=typeof window<"u"&&window.FABIO_BASE_URL||f,x=window.ImagePaths?window.ImagePaths.ui.placeholder:`${v}assets/images/ui/placeholder.webp`,k=window.ImagePaths?window.ImagePaths.ui.fallbackLogo:`${v}assets/images/logo/logo-fabio-square.webp`,$=t.global&&t.global.price_from?t.global.price_from:"",_=t.global&&t.global.discover?t.global.discover:"",y=t.global&&t.global.discover_package?t.global.discover_package:_,S=s?y:_,I=s?"global.discover_package":"global.discover",L=t.global&&t.global.premium_package?t.global.premium_package:"Premium Package",P=e.package_id||e.trip_id||"",b=encodeURIComponent(P),T=s?`package-details.html?id=${b}`:`details.html?id=${b}`,h=["catalog-card","trip-card"];s&&h.push("premium-package-card");const C=s?" standard-badge-premium":"",E=e.trip_id||e.package_id||"",B=`
            <article class="${h.join(" ")}" data-trip-id="${E}">
                <div class="catalog-card-image">
                    <img src="${g}" alt="${i}" class="catalog-card-img"
                         loading="lazy" onerror="this.onerror=function(){this.onerror=null; this.src='${k}';}; this.src='${x}';">
                    <div class="card-badges">
                        ${d}
                        ${c?`<span class="standard-badge${C}">${c}</span>`:""}
                    </div>
                </div>
                <div class="card-content">
                    ${s?`<div class="text-[10px] tracking-[0.22em] uppercase text-gold mb-1" data-i18n="global.premium_package">${L}</div>`:""}
                    <h3 class="catalog-card-title">${i}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${r}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${$}</span>
                            ${n}
                        </div>
                        <button class="card-btn" onclick="sessionStorage.setItem('fabio_nav_source','details'); window.location.href = '${T}'" data-i18n="${I}">${S}</button>
                    </div>
                </div>
            </article>
        `,p=document.createElement("div");return p.className="h-full w-full",p.innerHTML=B.trim(),p.firstElementChild},_resolveTextData:(e,a)=>{const o=e.trip_id||e.package_id||"",s=l._utils.isPackage(e)&&a&&a.packages?a.packages:a&&a.trips?a.trips:null,i=s&&s[o]?s[o]:null;return{title:i?i.title:(o||"").replace(/_/g," "),description:i?i.short_desc:""}},_resolvePriceData:(e,a,o)=>{const t=parseFloat(e.p_adult)||0,s=parseFloat(e.d_adult)||0;let i="",r="";if(s>0){const n=t>0?Math.round((t-s)/t*100):0,d=a.global&&a.global.limited_time_deal?a.global.limited_time_deal:"";o?r=`
                    <div class="discount-ribbon">
                        <span>-${n}%</span>
                    </div>
                `:r=`
                    <div class="deal-banner">
                        <span class="deal-percent">-${n}%</span>
                    </div>
                `,i=`
                <div class="price-row">
                    <span class="price-old">€${t}</span>
                    <span class="price-new">€${s}</span>
                    <span class="deal-inline">${d}</span>
                </div>
            `}else t>0?i=`
                <div class="price-row">
                    <span class="price-new">€${t}</span>
                </div>
            `:i='<div class="price-skeleton"></div>';return{priceRowHTML:i,dealBannerHTML:r}},_resolveImage:(e,a)=>{const t=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean),s=t.length>1&&t[0]||"",i=s?`/${s}/`:"/",r=typeof window<"u"&&window.FABIO_BASE_URL||i,n=window.ImagePaths?window.ImagePaths.resolveTripContext(e):{location:"",category:"",tripId:e.trip_id||""};let d=window.ImagePaths?window.ImagePaths.getPoster(n.location,n.category,n.tripId):`${r}assets/images/trips/${e.trip_id}/poster.webp`;if(a){const g=e.location||e.Location||e.loc||e.Loc||"sharm",c=String(g).toLowerCase().trim(),m=e.package_id||e.trip_id;d=`${r}assets/images/packages/${c}/${m}/poster.webp`}return d},_resolveBadge:(e,a,o)=>{const s=(o.global||{}).badges||{};if(e.badge_key){const i=String(e.badge_key).trim();return s[i]||s[i.toLowerCase()]||""}return a==="it"?e.badge_it||"":e.badge_en||""}};window.TripsRenderer=l;const R={render:()=>{const e=document.getElementById("trips-grid");if(!e)return;const a=[{id:"sharm",title:"Sharm El Sheikh",img:"/assets/images/locations/sharm.jpg"},{id:"cairo",title:"Cairo",img:"/assets/images/locations/cairo.jpg"},{id:"luxor_and_aswan",title:"Luxor & Aswan",img:"/assets/images/locations/luxor_aswan.jpg"},{id:"desert",title:"Sinai Desert",img:"/assets/images/locations/desert.jpg"}];e.className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4 mx-auto";const o=document.createDocumentFragment();a.forEach((t,s)=>{const i=document.createElement("article");i.className="catalog-card trip-card",i.innerHTML=`
                <div class="catalog-card-image">
                    <img src="${t.img}" alt="${t.title}" class="catalog-card-img" loading="lazy"
                         onerror="this.onerror=null; this.src='${window.ImagePaths?window.ImagePaths.ui.fallbackLogo:"/assets/images/logo/logo-fabio-square.webp"}';">
                    <div class="card-badges"></div>
                </div>
                <div class="card-content">
                    <h3 class="catalog-card-title">${t.title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc"></p>
                    <div class="card-footer">
                        <div class="price-block"></div>
                        <a class="card-btn" href="explore.html?loc=${t.id}" data-i18n="global.discover">Explore</a>
                    </div>
                </div>
            `,o.appendChild(i)}),e.innerHTML="",e.appendChild(o)}};window.LocationRenderer=R;
