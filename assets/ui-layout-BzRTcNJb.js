const l={init:()=>{l.renderHeroPortal(),l.renderWhatsApp()},renderHeroPortal:()=>{const e=document.getElementById("hero-portal");if(!e)return;const o=(localStorage.getItem("fabio_lang")||document.documentElement.lang||localStorage.getItem("lang")||"it")==="en"?window.i18nEn||{}:window.i18nIt||{},s=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean)[0]||"",d=s?`/${s}/`:"/",i=typeof window<"u"&&window.FABIO_BASE_URL||d,c=window.ImagePaths&&window.ImagePaths.landing&&window.ImagePaths.landing.hero?window.ImagePaths.landing.hero:[`${i}assets/images/comandamenti-images/1.webp`,`${i}assets/images/comandamenti-images/2.webp`,`${i}assets/images/comandamenti-images/3.webp`];e.innerHTML=`
            <div class="relative w-full h-[500px] md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group mx-auto">
                <!-- Background Stack (Flutter-like) -->
                <div id="hero-slider" class="absolute inset-0 bg-black">
                    ${c.map((g,r)=>`
                        <img src="${g}" 
                             class="hero-portal-img absolute inset-0 w-full h-full object-cover ${r===0?"active":""}" 
                             data-index="${r}">
                    `).join("")}
                </div>

                <!-- Overlay Gradient -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-20"></div>

                <!-- Foreground Content -->
                <div class="absolute inset-0 flex flex-col items-center justify-end pb-16 z-30 text-center px-4">
                    <h2 class="text-4xl md:text-5xl font-playfair font-bold text-gold mb-4 leading-tight drop-shadow-xl tracking-wide" data-i18n="global.secrets_title">
                        ${o.global.secrets_title||"Non partire senza conoscere i 10 comandamenti di Fabio"}
                    </h2>
                    
                    <p class="text-cream text-lg md:text-xl font-light tracking-widest uppercase mb-8 opacity-90" data-i18n="global.ultimate_guide">
                        ${o.global.ultimate_guide||""}
                    </p>
                    
                    <a href="sharm-secrets.html" class="px-10 py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:scale-105 transform" data-i18n="global.read_secrets">
                        ${o.global.read_secrets||""}
                    </a>
                </div>
            </div>
        `;let a=0;const n=e.querySelectorAll(".hero-portal-img");n.length>1&&setInterval(()=>{n[a].classList.remove("active"),a=(a+1)%n.length,n[a].classList.add("active")},3e3)},renderPromoBanner:()=>{const e=document.getElementById("promo-banner");e&&e.remove()},renderWhatsApp:()=>{if(document.getElementById("whatsapp-float")||document.querySelector(".floating-whatsapp")||/\/details\.html$/i.test(window.location.pathname))return;const t=document.createElement("div");t.id="whatsapp-float",t.className="fab-base floating-whatsapp",t.onclick=()=>window.open("https://wa.me/201063239261","_blank"),t.innerHTML=`
            <span class="floating-whatsapp-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" class="floating-whatsapp-svg">
                    <path d="M16 3C9.4 3 4.1 8.1 4.1 14.6c0 2.5.8 4.8 2.3 6.8L5 27.5l6.3-1.9c1.8 1 3.8 1.5 5.8 1.5 6.6 0 11.9-5.1 11.9-11.6C29 8.1 22.6 3 16 3zm0 2.3c5.3 0 9.6 4.1 9.6 9.3 0 5.1-4.3 9.3-9.6 9.3-1.8 0-3.5-.5-5-1.3l-.4-.2-3.7 1.1 1.1-3.5-.2-.4c-1.2-1.5-1.8-3.3-1.8-5.1C6 9.4 10.3 5.3 16 5.3zm-3.4 4c-.3 0-.7.1-1 .1-.3.1-.8.4-.9.9-.2.5-.5 1.5-.5 1.7 0 .2-.1.6.3 1.1.4.5 1.1 1.7 2.4 2.8 1.3 1.2 2.9 1.9 3.4 2.1.5.2 1 .2 1.3.1.4-.1 1.3-.6 1.5-1.1.2-.5.2-1 .2-1.1s-.1-.3-.3-.4c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1-.2.3-.7.8-.9 1-.2.1-.4.1-.6 0-.2-.1-.9-.3-1.7-1-.6-.6-1-1.3-1.2-1.5-.1-.3 0-.5.1-.6.1-.1.2-.2.3-.4.1-.1.1-.3 0-.4-.1-.1-.9-2.3-1.1-2.6-.1-.3-.3-.3-.4-.3z"></path>
                </svg>
            </span>
        `,document.body.appendChild(t)},setupInteractions:()=>{}};window.UILayout=l;window.addEventListener("langChanged",()=>{window.UILayout&&(typeof window.UILayout.renderPromoBanner=="function"&&window.UILayout.renderPromoBanner(),typeof window.UILayout.renderHeroPortal=="function"&&window.UILayout.renderHeroPortal())});
