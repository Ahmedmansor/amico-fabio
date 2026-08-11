import"./modulepreload-polyfill-B5Qt9EMX.js";const m={init:()=>{const e=document.getElementById("landing-header");e&&(e.innerHTML=`
      <header class="osh-header" id="osh-main-header">
        <div class="osh-scroll-progress" id="osh-scroll-progress"></div>
        <div class="osh-header-inner">
          <a href="/offerta-sharm/" class="osh-header-logo-wrap" aria-label="Fabio Egypt Home">
            <img class="osh-header-logo"
                 src="../assets/images/logo/logo-fabio-square.webp"
                 alt="Fabio Egypt Logo"
                 width="42" height="40" loading="eager" decoding="async" />
            <div class="osh-header-brand">
              <span class="osh-header-brand-name">Fabio <span>Egypt</span></span>
            </div>
          </a>

          <button class="osh-hamburger" id="osh-hamburger-btn" aria-label="Apri menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <!-- Mobile Overlay -->
      <div class="osh-menu-overlay" id="osh-menu-overlay"></div>

      <!-- Mobile Slide-Out Menu -->
      <nav class="osh-mobile-menu" id="osh-mobile-menu" aria-label="Menu principale">
        <button class="osh-mobile-menu-close" id="osh-menu-close" aria-label="Chiudi menu">&times;</button>
        <div class="osh-mobile-menu-nav">
          <a href="#why-section">Perché noi</a>
          <a href="#programs-section">Destinazioni</a>
          <a href="#timeline-section">Come prenotare</a>
          <a href="#videos-section">Testimonianze</a>
          <a href="#faq-section">Domande frequenti</a>
          <a href="#booking-section">Richiedi un Preventivo</a>
        </div>
      </nav>
    `,m._bindMenu(),m._bindScrollProgress())},_bindScrollProgress:()=>{const e=document.getElementById("osh-scroll-progress");if(!e)return;const i=()=>{const o=document.documentElement.scrollHeight||document.body.scrollHeight,a=document.documentElement.clientHeight||window.innerHeight,s=o-a,t=window.scrollY||document.documentElement.scrollTop||0,r=s>0?Math.min(100,Math.max(0,t/s*100)):0;e.style.width=`${r}%`};i(),window.addEventListener("scroll",i,{passive:!0}),window.addEventListener("resize",i,{passive:!0})},_bindMenu:()=>{const e=document.getElementById("osh-hamburger-btn"),i=document.getElementById("osh-mobile-menu"),o=document.getElementById("osh-menu-overlay"),a=document.getElementById("osh-menu-close");if(!e||!i||!o||!a)return;const s=()=>{i.classList.add("is-open"),o.classList.add("is-visible"),document.body.style.overflow="hidden"},t=()=>{i.classList.remove("is-open"),o.classList.remove("is-visible"),document.body.style.overflow=""};e.addEventListener("click",s),a.addEventListener("click",t),o.addEventListener("click",t),i.querySelectorAll('a[href^="#"]').forEach(r=>{r.addEventListener("click",h=>{t();const v=document.querySelector(r.getAttribute("href"));v&&(h.preventDefault(),setTimeout(()=>v.scrollIntoView({behavior:"smooth"}),300))})})}},b={init:()=>{const e=document.getElementById("hero-section");if(!e)return;e.innerHTML=`
      <section class="osh-hero" id="osh-hero">
        <div class="osh-hero-bg">
          <img src="../assets/images/offerta-sharm-land-page/offerta-sharm-land-page-hero.webp"
               alt="Offerta Sharm El Sheikh — Fabio Egypt"
               loading="eager"
               fetchpriority="high"
               decoding="async" />
          <div class="osh-hero-overlay"></div>
        </div>

        <div class="osh-hero-content">
          <h1 class="osh-hero-title">L'Egitto ti aspetta</h1>
          <p class="osh-hero-subtitle">
            Tour personalizzati, assistenza in italiano<br>
            e accoglienza al tuo arrivo.
          </p>
          <div class="osh-hero-actions">
            <a href="#booking-section" class="osh-btn osh-btn--wa osh-btn--hero" id="hero-book-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16c1.87 0 3.66.502 5.225 1.45a9.84 9.84 0 0 1 1.77 1.447 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155Z"/>
              </svg>
              Richiedi un Preventivo 
            </a>
          </div>
        </div>

        <!-- Speech bubble — visible on tablet+ via CSS -->
        <div class="osh-hero-bubble">
          Hai domande?<br>Siamo qui per te!
        </div>
      </section>
    `;const i=document.getElementById("hero-book-btn");i&&i.addEventListener("click",o=>{o.preventDefault();const a=document.getElementById("booking-section");a&&a.scrollIntoView({behavior:"smooth"})})}},y={init:()=>{const e=document.getElementById("wa-float");e&&(e.innerHTML=`
      <a class="osh-wa-float"
         href="https://wa.me/201063239261?text=${encodeURIComponent("Ciao Fabio! Ho domande riguardo i vostri tour.")}"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Contattaci su WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16c1.87 0 3.66.502 5.225 1.45a9.84 9.84 0 0 1 1.77 1.447 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155ZM20.52 3.449A11.79 11.79 0 0 0 12.05.16C5.495.16.16 5.488.157 12.04a11.8 11.8 0 0 0 1.583 5.919L.003 24l6.193-1.623a11.85 11.85 0 0 0 5.65 1.44h.005c6.554 0 11.89-5.328 11.893-11.88a11.81 11.81 0 0 0-3.48-8.398l.256-.09Z"/>
        </svg>
      </a>
    `)}},w={init:()=>{const e=document.getElementById("why-section");if(!e)return;const i=[{title:"Supporto in Italiano 24/7",desc:"Assistenza dedicata nella tua lingua, prima, durante e dopo il viaggio.",icon:'<svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>'},{title:"Assistenza diretta in Egitto",desc:"Operativi sul territorio per offrirti il meglio e garantirti sicurezza.",icon:'<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'},{title:"Tour su misura e prezzi trasparenti",desc:"Esperienze personalizzate con cura per ogni dettaglio, senza costi nascosti.",icon:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'},{title:"Accoglienza personale al tuo arrivo",desc:"Saremo lì per accoglierti e accompagnarti nel tuo viaggio.",icon:'<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'}];e.innerHTML=`
      <section class="osh-section osh-section--alt" id="why-choose">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Perché scegliere Fabio Egypt?</h2>
          </div>
          <div class="osh-why-grid">
            ${i.map(o=>`
              <div class="osh-why-item">
                <div class="osh-why-icon">${o.icon}</div>
                <h3 class="osh-why-title">${o.title}</h3>
                <p class="osh-why-desc">${o.desc}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `}},E=[{title:"Il Cairo",description:"Scopri i segreti dei Faraoni con la tua guida privata parlante italiano. Un viaggio esclusivo tra le Piramidi, storia millenaria e comfort assoluto, curato in ogni dettaglio.",image:"/assets/images/offerta-sharm-land-page/distinations/cairo.webp"},{title:"Sharm El Sheikh",description:"Lusso senza compromessi e vere esperienze VIP sul Mar Rosso. Escursioni private in barca, snorkeling esclusivo e relax totale lontano dal turismo di massa.",image:"/assets/images/offerta-sharm-land-page/distinations/sharm.webp"},{title:"Dahab",description:"La città magica, atmosfera bohémien, snorkeling e barriere coralline uniche.",image:"/assets/images/offerta-sharm-land-page/distinations/dahab.webp"},{title:"Monte Sinai e Santa Caterina",description:"Un'avventura mistica nel cuore del deserto vissuta in totale privacy. Ammira un'alba mozzafiato con un'organizzazione impeccabile e servizi su misura.",image:"/assets/images/offerta-sharm-land-page/distinations/saint_catherine.webp"},{title:"Luxor e Aswan",description:"Naviga nella storia e visita i templi più maestosi d'Egitto. Un'esperienza culturale Premium con un servizio personalizzato, pensato esclusivamente per te.",image:"/assets/images/offerta-sharm-land-page/distinations/luxor_aswan.webp"},{title:"Siwa",description:"Un'oasi di pura magia nel cuore del deserto. Immergiti nelle surreali piscine di sale, esplora antiche rovine e concediti un ritiro eco-chic all'insegna del relax assoluto.",image:"/assets/images/offerta-sharm-land-page/distinations/siwa.webp"},{title:"Marsa Alam",description:"Il paradiso incontaminato del Mar Rosso. Nuota tra tartarughe e delfini in barriere coralline intatte, vivendo un'avventura marina esclusiva e lontana dal turismo di massa.",image:"/assets/images/offerta-sharm-land-page/distinations/marsa_alam.webp"},{title:"Marsa Matrouh",description:`Scopri le "Maldive del Mediterraneo". Spiagge di sabbia bianca finissima, acque turchesi cristalline e un'atmosfera di puro relax per una fuga esclusiva e indimenticabile.`,image:"/assets/images/offerta-sharm-land-page/distinations/marsa_matrouh.webp"}],z=(e="programs-section")=>{const i=document.getElementById(e);if(!i)return;i.innerHTML=`
    <section class="osh-section" id="programs-cards">
      <div class="osh-container">
        <div class="osh-section-header">
          <h2 class="osh-section-title">I nostri programmi di viaggio</h2>
          <p class="osh-section-subtitle">Scopri le destinazioni più affascinanti dell'Egitto con le nostre guide esperte</p>
        </div>
        <div class="osh-programs-grid">
          ${E.map(a=>`
            <article class="osh-program-card">
              <img class="osh-program-img" src="${a.image}" alt="${a.title}" loading="lazy" decoding="async" />
              <div class="osh-program-body">
                <h3 class="osh-program-name">${a.title}</h3>
                <p class="osh-program-desc">${a.description}</p>
              </div>
            </article>
          `).join("")}
        </div>
        <div class="osh-programs-cta">
          <a href="#booking-section" class="osh-btn osh-btn--gold-outline" id="programs-cta-btn">
            Scopri tutti i nostri viaggi
          </a>
        </div>
      </div>
    </section>
  `;const o=document.getElementById("programs-cta-btn");o&&o.addEventListener("click",a=>{a.preventDefault();const s=document.getElementById("booking-section");s&&s.scrollIntoView({behavior:"smooth"})})},M={init:z},B={init:()=>{const e=document.getElementById("timeline-section");if(!e)return;const i=[{num:1,title:"Contattaci su WhatsApp",desc:"Scrivici in qualsiasi momento, siamo qui per te!",icon:'<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'},{num:2,title:"Scegli la destinazione",desc:"Raccontaci dove vuoi andare e cosa desideri vivere.",icon:'<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'},{num:3,title:"Conferma la data di arrivo",desc:"Organizziamo tutto in base ai tuoi voli e ai tuoi orari.",icon:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'},{num:4,title:"Ti aspettiamo al tuo arrivo",desc:"Saremo lì per accoglierti e accompagnarti nel tuo viaggio.",icon:'<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'}];e.innerHTML=`
      <section class="osh-section osh-section--alt" id="timeline-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Come prenotare il tuo viaggio</h2>
          </div>
          <div class="osh-timeline">
            ${i.map(o=>`
              <div class="osh-timeline-step">
                <div class="osh-timeline-icon-wrap">
                  <span class="osh-timeline-number">${o.num}</span>
                  ${o.icon}
                  <div class="osh-timeline-line"></div>
                </div>
                <h3 class="osh-timeline-title">${o.title}</h3>
                <p class="osh-timeline-desc">${o.desc}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `}},k=[{id:"1214756632",title:"Il Parco Marino di Ras Mohamed",thumbnail:"/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_13.webp"},{id:"1214757531",title:"Il Parco Marino di Ras Mohamed",thumbnail:"/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_7.webp"},{id:"1214758552",title:"Soho square",thumbnail:"/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_10.webp"},{id:"1214760129",title:"l’escursione del safari",thumbnail:"/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_20.webp"},{id:"1214757761",title:"la nostra macchina privata VIP",thumbnail:"/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_14.webp"},{id:"1214758307",title:"la città magica di Dahab",thumbnail:"/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_40.webp"}],x='<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>',S='<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';let c=null,d=!1;const n={init:()=>{const e=document.getElementById("videos-section");e&&(e.innerHTML=`
      <section class="osh-section" id="videos-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">I nostri clienti in viaggio</h2>
          </div>

          <div class="osh-videos-scroll-wrapper">
            <div class="osh-videos-track" id="osh-videos-track">
              ${k.map((i,o)=>`
                <div class="osh-video-card" data-video-id="${i.id}" data-index="${o}">
                  <div class="osh-video-media">
                    <img class="osh-video-thumb" src="${i.thumbnail}" alt="${i.title}" loading="lazy" decoding="async" />
                    <div class="osh-video-play">
                      <div class="osh-video-play-icon">${x}</div>
                    </div>
                  </div>
                  <div class="osh-video-caption">
                    <h3 class="osh-video-caption-title">${i.title}</h3>
                    <span class="osh-video-caption-sub">Guarda il video</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </section>

      <!-- Video Lightbox Modal Overlay -->
      <div class="osh-video-modal" id="osh-video-modal" aria-hidden="true" role="dialog" aria-label="Riproduttore video">
        <div class="osh-video-modal-backdrop" id="osh-video-modal-backdrop"></div>
        <div class="osh-video-modal-container">
          <button class="osh-video-modal-close" id="osh-video-modal-close" aria-label="Chiudi video">
            ${S}
          </button>
          <div class="osh-video-modal-body" id="osh-video-modal-body"></div>
        </div>
      </div>
    `,n._bindEvents(),n._bindModalEvents(),n._startAutoScroll())},_startAutoScroll:()=>{const e=document.getElementById("osh-videos-track");e&&(c&&clearInterval(c),c=setInterval(()=>{if(d)return;const i=e.scrollWidth-e.clientWidth,o=e.querySelector(".osh-video-card"),a=o?o.clientWidth+20:320;e.scrollLeft>=i-10?e.scrollTo({left:0,behavior:"smooth"}):e.scrollBy({left:a,behavior:"smooth"})},3500))},_stopAutoScroll:()=>{c&&(clearInterval(c),c=null)},_openModal:(e,i)=>{const o=document.getElementById("osh-video-modal"),a=document.getElementById("osh-video-modal-body");if(!(!o||!a)){n._stopAutoScroll(),d=!0,a.innerHTML=`
      <iframe
        src="https://player.vimeo.com/video/${e}?autoplay=1&dnt=1"
        class="osh-video-modal-iframe"
        title="${i||"Video"}"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        webkitallowfullscreen
        mozallowfullscreen>
      </iframe>
    `,o.classList.add("is-active"),o.setAttribute("aria-hidden","false"),document.body.style.overflow="hidden";try{history.pushState({videoModalOpen:!0},"")}catch{}}},_closeModal:(e=!1)=>{const i=document.getElementById("osh-video-modal"),o=document.getElementById("osh-video-modal-body");if(!(!i||!d)){if(d=!1,i.classList.remove("is-active"),i.setAttribute("aria-hidden","true"),document.body.style.overflow="",o&&(o.innerHTML=""),!e&&history.state&&history.state.videoModalOpen)try{history.back()}catch{}n._startAutoScroll()}},_bindModalEvents:()=>{const e=document.getElementById("osh-video-modal-backdrop"),i=document.getElementById("osh-video-modal-close");e&&e.addEventListener("click",()=>n._closeModal()),i&&i.addEventListener("click",()=>n._closeModal()),document.addEventListener("keydown",o=>{o.key==="Escape"&&d&&n._closeModal()}),window.addEventListener("popstate",()=>{d&&n._closeModal(!0)})},_bindEvents:()=>{const e=document.getElementById("osh-videos-track");e&&e.querySelectorAll(".osh-video-card").forEach(i=>{i.addEventListener("click",()=>{const o=i.getAttribute("data-video-id"),a=i.querySelector(".osh-video-caption-title")?.textContent||"";n._openModal(o,a)})})}},_=[{id:"faq-1",question:"Serve il visto per Sharm El Sheikh?",answer:'Se il tuo viaggio si svolge esclusivamente a Sharm El Sheikh, non hai bisogno di acquistare il visto turistico (è sufficiente il timbro gratuito "Sinai Only" valido per 15 giorni). Tuttavia, se il tuo programma include escursioni affascinanti come Il Cairo o Luxor, il visto è obbligatorio. In ogni caso, il team di Fabio Egypt ti assisterà per rendere ogni procedura semplice e veloce.'},{id:"faq-2",question:"Le guide parlano italiano fluente?",answer:"Assolutamente sì! Tutti i nostri collaboratori sono guide turistiche ufficiali e certificate dal Ministero del Turismo Egiziano. Oltre ad avere una profonda conoscenza storica e culturale, parlano un italiano eccellente. Vogliamo garantirti un'esperienza coinvolgente, chiara e senza alcuna barriera linguistica."},{id:"faq-3",question:"Come funziona il pagamento?",answer:"Offriamo la massima flessibilità per farti viaggiare senza stress. L'opzione più semplice e da noi consigliata è il saldo in contanti (in Euro) comodamente al tuo arrivo in Egitto. Tuttavia, se preferisci non viaggiare con contanti, puoi pagare in totale sicurezza con la tua carta di credito (Visa/Mastercard). Il nostro obiettivo è il tuo comfort, fin dal primo momento."},{id:"faq-4",question:"Cosa succede se il volo è in ritardo?",answer:"Non devi preoccuparti di nulla. Il nostro team monitora costantemente lo stato del tuo volo in tempo reale tramite sistemi di tracciamento (Flight Radar). In caso di ritardo, il tuo autista privato adatterà automaticamente l'orario e saranno lì in aeroporto ad aspettarti al tuo arrivo, senza alcun costo aggiuntivo."}],I=`
  <svg class="osh-faq-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`,L=(e="faq-section")=>{const i=document.getElementById(e);i&&(i.innerHTML=`
    <section class="osh-section osh-section--alt" id="faq-block">
      <div class="osh-container osh-faq-container">
        <div class="osh-section-header">
          <h2 class="osh-section-title">Domande Frequenti</h2>
          <p class="osh-section-subtitle">Tutto quello che devi sapere prima di partire per la tua vacanza in Egitto</p>
        </div>

        <div class="osh-faq-list" role="region" aria-label="Domande Frequenti">
          ${_.map((o,a)=>`
            <div class="osh-faq-item ${a===0?"is-open":""}" id="faq-item-${o.id}">
              <button type="button" 
                      class="osh-faq-question" 
                      aria-expanded="${a===0?"true":"false"}"
                      aria-controls="faq-ans-${o.id}"
                      id="faq-btn-${o.id}">
                <span class="osh-faq-q-text">${o.question}</span>
                <span class="osh-faq-icon-wrap">${I}</span>
              </button>
              <div class="osh-faq-answer" 
                   id="faq-ans-${o.id}" 
                   role="region" 
                   aria-labelledby="faq-btn-${o.id}">
                <div class="osh-faq-answer-inner">
                  <p>${o.answer}</p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,u._bindAccordion())},u={init:L,_bindAccordion:()=>{const e=document.querySelectorAll(".osh-faq-item");e.length&&e.forEach(i=>{const o=i.querySelector(".osh-faq-question");o&&o.addEventListener("click",()=>{const a=i.classList.contains("is-open");e.forEach(s=>{if(s!==i&&s.classList.contains("is-open")){s.classList.remove("is-open");const t=s.querySelector(".osh-faq-question");t&&t.setAttribute("aria-expanded","false")}}),a?(i.classList.remove("is-open"),o.setAttribute("aria-expanded","false")):(i.classList.add("is-open"),o.setAttribute("aria-expanded","true"))})})}},q="201063239261",l={init:()=>{const e=document.getElementById("booking-section");e&&(e.innerHTML=`
      <section class="osh-booking-section" id="booking-form-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Richiedi un Preventivo </h2>
            <p class="osh-section-subtitle">Compila il modulo e ti rispondiamo subito su WhatsApp</p>
          </div>

          <div class="osh-booking-card">
            <form class="osh-form" id="lsh-booking-form" novalidate>
              <div class="osh-form-group">
                <label class="osh-form-label" for="lsh-name">Nome Completo</label>
                <input class="osh-form-input" type="text" id="lsh-name"
                       placeholder="Il tuo nome..." autocomplete="name" required />
                <span class="osh-form-error" id="lsh-name-error">Per favore inserisci il tuo nome.</span>
              </div>

              <div class="osh-form-group">
                <label class="osh-form-label" for="lsh-date">Data di Arrivo</label>
                <input class="osh-form-input" type="date" id="lsh-date" required />
                <span class="osh-form-error" id="lsh-date-error">Per favore seleziona una data.</span>
              </div>

              <div class="osh-form-group">
                <label class="osh-form-label" for="lsh-people">Numero di Persone</label>
                <input class="osh-form-input" type="number" id="lsh-people"
                       min="1" max="30" value="2" placeholder="2" required />
                <span class="osh-form-error" id="lsh-people-error">Inserisci un numero valido (1-30).</span>
              </div>

              <button class="osh-form-submit" id="whatsapp-booking-btn" type="submit">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16c1.87 0 3.66.502 5.225 1.45a9.84 9.84 0 0 1 1.77 1.447 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155ZM20.52 3.449A11.79 11.79 0 0 0 12.05.16C5.495.16.16 5.488.157 12.04a11.8 11.8 0 0 0 1.583 5.919L.003 24l6.193-1.623a11.85 11.85 0 0 0 5.65 1.44h.005c6.554 0 11.89-5.328 11.893-11.88a11.81 11.81 0 0 0-3.48-8.398l.256-.09Z" />
                </svg>
                Prenota su WhatsApp
              </button>

              <div class="osh-form-trust">
                <span class="osh-form-trust-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Risposta in 15 min
                </span>
                <span class="osh-form-trust-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                  Prenotazione Flessibile 
                </span>
                <span class="osh-form-trust-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Assistenza in Italiano
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>
    `,l._bindForm())},_bindForm:()=>{const e=document.getElementById("lsh-booking-form");e&&e.addEventListener("submit",i=>{i.preventDefault(),l._handleSubmit()})},_handleSubmit:()=>{const e=document.getElementById("lsh-name"),i=document.getElementById("lsh-date"),o=document.getElementById("lsh-people");if(!e||!i||!o)return;l._hideError("lsh-name-error"),l._hideError("lsh-date-error"),l._hideError("lsh-people-error");const a=e.value.trim(),s=i.value,t=parseInt(o.value,10);let r=!0;if(a||(l._showError("lsh-name-error"),r=!1),s||(l._showError("lsh-date-error"),r=!1),(!t||t<1||t>30)&&(l._showError("lsh-people-error"),r=!1),!r)return;const h=s.split("-"),v=`${h[2]}/${h[1]}/${h[0]}`,p=["🌴 *Nuova Prenotazione — Offerta Sharm*","",`👤 *Nome:* ${a}`,`📅 *Data di Arrivo:* ${v}`,`👥 *Numero di Persone:* ${t}`,"","Ciao Fabio! Vorrei organizzare il mio viaggio in Egitto con voi e ricevere un preventivo personalizzato. 🇪🇬"].join(`
`),g=encodeURIComponent(p),f=`https://wa.me/${q}?text=${g}`;typeof window.gtag=="function"&&window.gtag("event","generate_lead",{currency:"EUR",value:1,event_category:"Booking",event_label:"WhatsApp_Sharm_Offer"}),window.open(f,"_blank","noopener,noreferrer")},_showError:e=>{const i=document.getElementById(e);i&&i.classList.add("visible")},_hideError:e=>{const i=document.getElementById(e);i&&i.classList.remove("visible")}},A={init:()=>{const e=document.getElementById("trust-section");if(!e)return;const i=[{title:"Sede in Egitto",desc:"Operativi sul territorio per offrirti i migliori servizi in Egitto.",icon:'<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'},{title:"Supporto in Italiano",desc:"Assistenza dedicata durante il tuo viaggio in Egitto.",icon:'<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'},{title:"Sicurezza e Affidabilità",desc:"Servizi con licenza turistica del Ministero del Turismo Egiziano.",icon:'<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'},{title:"Prenotazioni Sicure",desc:"I tuoi dati sono protetti e le transazioni sono sempre sicure.",icon:'<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'},{title:"WhatsApp Sempre Attivo",desc:"Scrivici quando vuoi, saremo sempre qui!",icon:'<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'}];e.innerHTML=`
      <section class="osh-trust" id="trust-block">
        <div class="osh-trust-grid">
          ${i.map(o=>`
            <div class="osh-trust-item">
              <div class="osh-trust-icon">${o.icon}</div>
              <div class="osh-trust-text">
                <p class="osh-trust-text-title">${o.title}</p>
                <p class="osh-trust-text-desc">${o.desc}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `}},$={init:()=>{const e=document.getElementById("landing-footer");if(!e)return;const i=new Date().getFullYear();e.innerHTML=`
      <footer class="osh-footer-simple">
        <div class="osh-footer-simple-inner">
          <div class="osh-footer-brand">
            <img src="../assets/images/logo/logo-fabio-square.webp"
                 alt="Fabio Egypt" width="36" height="34" loading="lazy" decoding="async" />
            <span class="osh-footer-brand-name">FABIO EGYPT</span>
          </div>

          <p class="osh-footer-copy">
            &copy; 2025 - ${i} Fabio Egypt &mdash; Tutti i diritti riservati.
          </p>

          <div class="osh-footer-contact">
            <a href="https://wa.me/201063239261" class="osh-footer-phone-link" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.97A1 1 0 0 0 7.5 3h-4A1 1 0 0 0 2.5 4c0 9.95 8.05 18 18 18a1 1 0 0 0 1-1v-4a1 1 0 0 0-.99-1z"/>
              </svg>
              +20 106 323 9261
            </a>
          </div>

          <div class="osh-footer-socials">
            <a href="https://www.facebook.com/fabioEgyptVip/" target="_blank"
               rel="noopener noreferrer" class="osh-footer-social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/fabio_egypt_vip" target="_blank"
               rel="noopener noreferrer" class="osh-footer-social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@fabioegypt.vip?_r=1&_t=ZS-98nPDGjK3Cn" target="_blank"
               rel="noopener noreferrer" class="osh-footer-social-link" aria-label="TikTok">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@FabioEgyptItaly" target="_blank"
               rel="noopener noreferrer" class="osh-footer-social-link" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://wa.me/201063239261" target="_blank"
               rel="noopener noreferrer" class="osh-footer-social-link" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16c1.87 0 3.66.502 5.225 1.45a9.84 9.84 0 0 1 1.77 1.447 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155Z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    `}};document.addEventListener("DOMContentLoaded",()=>{m.init(),b.init(),y.init(),w.init(),M.init(),B.init(),n.init(),u.init(),l.init(),A.init(),$.init(),console.log("Offerta Sharm Landing — All widgets initialized.")});
