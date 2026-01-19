const PackageRenderer = {
  state: {
    packageId: '',
    apiData: null,
    langData: null,
    lang: 'it',
    includedTrips: [],
    allTrips: [],
    intervals: []
  },

  /**
   * Initialize the renderer by fetching data and resolving the package.
   */
  init: async () => {
    const params = new URLSearchParams(window.location.search);
    const pkgId = params.get('id');
    if (!pkgId) {
      window.location.href = 'index.html';
      return;
    }

    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});

    if (!window.api || !window.api.fetchAllData) {
      PackageRenderer.renderNotFound(i18n, lang);
      return;
    }

    try {
      const data = await window.api.fetchAllData();
      const packagesList = Array.isArray(data.Packages) ? data.Packages : [];
      const tripsList = Array.isArray(data.Trips_Prices) ? data.Trips_Prices : [];

      // Find package by package_id or trip_id
      const pkg = packagesList.find(p => {
        const pid = String(p.package_id || '').trim();
        const tid = String(p.trip_id || '').trim();
        const q = String(pkgId || '').trim();
        return pid === q || tid === q;
      });

      if (!pkg) {
        PackageRenderer.renderNotFound(i18n, lang);
        return;
      }

      const tripKey = pkg.trip_id || pkg.package_id;
      const langTrips = i18n.trips || {};
      const langData = langTrips[tripKey] || null;

      PackageRenderer.state.packageId = tripKey;
      PackageRenderer.state.apiData = pkg;
      PackageRenderer.state.langData = langData;
      PackageRenderer.state.lang = lang;
      PackageRenderer.state.allTrips = tripsList;

      PackageRenderer.render(pkg, langData, lang, tripsList, data.Trip_Addons || [], i18n);
    } catch (e) {
      console.error('Error loading package:', e);
      PackageRenderer.renderNotFound(i18n, lang);
    }
  },

  renderNotFound: (i18n, lang) => {
    const dict = i18n.global || {};
    const msg = typeof dict.experience_not_found === 'string' ? dict.experience_not_found : (lang === 'en' ? 'Package not found.' : 'Pacchetto non trovato.');
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `<div class="h-screen flex items-center justify-center text-white"><h1 class="text-3xl font-playfair text-gold" data-i18n="global.experience_not_found">${msg}</h1></div>`;
    }
  },

  /**
   * Main render function for the package details page.
   */
  render: (apiData, langData, lang, allTrips, allAddons, i18n) => {
    const tripId = PackageRenderer.state.packageId;
    const langDict = i18n || (lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {}));
    const globalDict = langDict.global || {};

    PackageRenderer._setupSEO(langData, tripId);

    const isPackage = String((apiData && apiData.type) || 'package').toLowerCase() === 'package';
    const images = PackageRenderer._resolvePackageImages(apiData, tripId, isPackage);

    PackageRenderer._setupHero(images.posterSrc, images.ctx, isPackage, tripId);
    PackageRenderer._renderBasicDetails(langData, apiData, globalDict, tripId);
    PackageRenderer._renderMainPrice(apiData, globalDict);
    PackageRenderer._setupGallery(apiData, images, tripId);

    // Booking Init
    PackageRenderer.state.apiData = apiData;
    PackageRenderer.state.langData = langData;
    const addonsList = Array.isArray(allAddons) ? allAddons.filter(x => String(x.trip_id || '') === tripId) : [];

    if (window.BookingManager && typeof window.BookingManager.init === 'function') {
      window.BookingManager.init(tripId, apiData, langData, addonsList);
    }

    PackageRenderer._setupStickyBar();
    PackageRenderer.renderIncludedTrips(apiData, allTrips, langDict);
  },

  _setupSEO: (langData, tripId) => {
    const title = (langData && langData.title) || tripId;
    document.title = `Fabio Tours | ${title}`;

    // Meta Description
    const metaDesc = document.querySelector('meta[name="description"]') || (function () {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
      return m;
    })();
    const descText = (langData && (langData.short_desc || langData.full_description)) || '';
    const cleanDesc = typeof descText === 'string' ? descText.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
    metaDesc.setAttribute('content', cleanDesc);

    // Meta Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]') || (function () {
      const m = document.createElement('meta');
      m.setAttribute('name', 'keywords');
      document.head.appendChild(m);
      return m;
    })();
    const tags = Array.isArray(langData && langData.seo_tags) ? langData.seo_tags : [];
    metaKeywords.setAttribute('content', tags.join(', '));
  },

  _resolvePackageImages: (apiData, tripId, isPackage) => {
    let ctx = { location: '', category: '', tripId };
    let posterSrc = '';

    if (isPackage) {
      const locRaw = (apiData && (apiData.location || apiData.category || 'sharm')) || 'sharm';
      const loc = String(locRaw).toLowerCase().trim();
      posterSrc = `assets/images/packages/${loc}/${tripId}/poster.webp`;
    } else {
      ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext({ trip_id: tripId, ...(apiData || {}) }) : { location: '', category: '', tripId };
      posterSrc = window.ImagePaths ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId) : `assets/images/trips/${tripId}/poster.webp`;
    }
    return { posterSrc, ctx };
  },

  _setupHero: (posterSrc, ctx, isPackage, tripId) => {
    const bgEl = document.getElementById('hero-bg');
    const fallbackSrc = window.ImagePaths ? window.ImagePaths.ui.fallbackLogo : 'assets/logo-fabio-square.jpg';

    if (bgEl) {
      bgEl.style.backgroundImage = `url('${posterSrc}')`;
      if (!isPackage && window.ImagePaths && typeof window.ImagePaths.resolvePosterOrPlaceholder === 'function') {
        window.ImagePaths.resolvePosterOrPlaceholder(ctx.location, ctx.category, tripId).then(src => {
          bgEl.style.backgroundImage = `url('${src}')`;
        });
      } else {
        const imgTest = new Image();
        imgTest.src = posterSrc;
        imgTest.onerror = () => { bgEl.style.backgroundImage = `url('${fallbackSrc}')`; };
      }
    }
  },

  _renderBasicDetails: (langData, apiData, globalDict, titleFallback) => {
    const els = {
      title: document.getElementById('detail-title'),
      badge: document.getElementById('detail-badge'),
      duration: document.getElementById('detail-duration'),
      desc: document.getElementById('detail-desc'),
      fullDesc: document.getElementById('detail-full-desc'),
      important: document.getElementById('detail-important'),
      highlights: document.getElementById('detail-highlights'),
      includes: document.getElementById('detail-includes'),
      excludes: document.getElementById('detail-excludes'),
      program: document.getElementById('detail-program')
    };

    const title = (langData && langData.title) || titleFallback;
    if (els.title) els.title.textContent = title;

    // Badge
    const badgesDict = globalDict.badges || {};
    let badgeText = '';
    if (apiData && apiData.badge_key) {
      const rawKey = String(apiData.badge_key).trim();
      badgeText = badgesDict[rawKey] || badgesDict[rawKey.toUpperCase()] || badgesDict[rawKey.toLowerCase()] || '';
    }
    if (els.badge) {
      els.badge.textContent = badgeText;
      els.badge.style.display = badgeText ? 'inline-block' : 'none';
    }

    // Text Content
    if (langData) {
      const daily = typeof globalDict.daily === 'string' ? globalDict.daily : '';
      if (els.duration) els.duration.textContent = langData.duration || daily;
      if (els.desc) els.desc.innerHTML = langData.short_desc || '';
      if (els.fullDesc) els.fullDesc.innerHTML = langData.full_description || '';
      if (els.important) els.important.textContent = langData.important_notes || '';

      PackageRenderer.renderList(els.highlights, langData.highlights);
      PackageRenderer.renderList(els.includes, langData.includes, true);
      PackageRenderer.renderList(els.excludes, langData.not_included, true);

      if (els.program && langData.program) {
        PackageRenderer.renderProgram(els.program, langData.program);
      }
    }
  },

  _renderMainPrice: (apiData, globalDict) => {
    const pAdult = apiData ? parseFloat(apiData.p_adult || '0') : 0;
    const dAdult = apiData ? parseFloat(apiData.d_adult || '0') : 0;
    const pChild = apiData ? parseFloat(apiData.p_child || '0') : 0;
    const dChild = apiData ? parseFloat(apiData.d_child || '0') : 0;
    const minPax = apiData ? parseInt(apiData.min_pax || '1', 10) : 1;

    // Main Hero Price
    const priceEl = document.getElementById('detail-price');
    const adultHero = dAdult > 0
      ? `<span class="inline-flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-gold font-bold">€${dAdult}</span></span>`
      : `<span class="inline-flex items-center gap-2"><span>👤</span><span class="text-gold font-bold">€${pAdult}</span></span>`;
    if (priceEl) priceEl.innerHTML = adultHero;

    // Sticky/Card Price
    const headlinePrice = dAdult > 0 ? dAdult : pAdult;
    const cardPriceEl = document.getElementById('card-price');
    if (cardPriceEl) cardPriceEl.textContent = `€${headlinePrice}`;

    const totalEl = document.getElementById('live-total-price');
    if (totalEl) totalEl.textContent = `€${headlinePrice}`;

    // Breakdown
    const breakdownEl = document.getElementById('card-price-breakdown');
    if (breakdownEl) {
      const pricingDict = globalDict.pricing || {};
      const lblMinPax = pricingDict.min_pax || 'Min Pax';

      const adultRow = dAdult > 0
        ? `<div class="flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-white font-bold">€${dAdult}</span></div>`
        : `<div class="flex items-center gap-2"><span>👤</span><span class="text-white font-bold">€${pAdult}</span></div>`;

      const childRow = (dChild > 0 || pChild > 0)
        ? (dChild > 0
          ? `<div class="flex items-center gap-2"><span>👶</span><span class="line-through text-gray-400">€${pChild}</span><span class="text-white font-bold">€${dChild}</span></div>`
          : `<div class="flex items-center gap-2"><span>👶</span><span class="text-white font-bold">€${pChild}</span></div>`)
        : '';

      const minPaxRow = `<div class="flex items-center gap-2"><span>👥</span><span class="text-gray-300">${lblMinPax}: ${minPax}</span></div>`;
      breakdownEl.innerHTML = `${adultRow}${childRow}${minPaxRow}`;
    }
  },

  _setupGallery: (apiData, imagesData, tripId) => {
    const galleryEl = document.getElementById('gallery-grid');
    const bgEl = document.getElementById('hero-bg');
    if (!galleryEl || galleryEl.children.length > 0) return;

    const { ctx, posterSrc } = imagesData;
    const totalRaw = window.ImagePaths && typeof window.ImagePaths.pickCI === 'function' ? window.ImagePaths.pickCI(apiData || {}, 'img_count') : '';
    const total = parseInt(totalRaw || '0', 10);
    const list = window.ImagePaths && typeof window.ImagePaths.getGalleryArray === 'function'
      ? window.ImagePaths.getGalleryArray(ctx.location, ctx.category, tripId, total)
      : [];

    PackageRenderer._createGalleryThumb(posterSrc, galleryEl, bgEl, 'w-40 h-24');
    if (Array.isArray(list) && list.length > 0) {
      list.forEach(src => PackageRenderer._createGalleryThumb(src, galleryEl, bgEl, 'w-40 h-24'));
    }
  },

  _setupStickyBar: () => {
    const stickyMobile = document.getElementById('sticky-mobile-book');
    if (stickyMobile) {
      setTimeout(() => { stickyMobile.classList.remove('translate-y-32'); }, 200);
      PackageRenderer.setupStickyBehavior();
    }
  },

  renderIncludedTrips: (apiData, allTrips, langDict) => {
    PackageRenderer._clearIncludedTrips();

    const grid = document.getElementById('included-trips-grid');
    const subtitleEl = document.getElementById('included-trips-subtitle');
    if (!grid) return;

    const ids = Array.isArray(apiData && apiData.included_trip_ids) ? apiData.included_trip_ids : [];
    if (!ids.length) {
      if (subtitleEl) subtitleEl.textContent = '';
      return;
    }

    PackageRenderer._setIncludedTripsSubtitle(subtitleEl, langDict);

    const items = PackageRenderer._prepareIncludedTripItems(ids, allTrips, langDict);
    PackageRenderer.state.includedTrips = items;

    const frag = document.createDocumentFragment();
    const globalDict = langDict.global || {};

    items.forEach(item => {
      PackageRenderer._renderIncludedTripCard(item, frag, globalDict);
    });
    grid.appendChild(frag);
  },

  _clearIncludedTrips: () => {
    if (PackageRenderer.state.intervals) {
      PackageRenderer.state.intervals.forEach(clearInterval);
    }
    PackageRenderer.state.intervals = [];
    const grid = document.getElementById('included-trips-grid');
    if (grid) grid.innerHTML = '';
  },

  _setIncludedTripsSubtitle: (el, langDict) => {
    if (!el) return;
    const lang = PackageRenderer.state.lang;
    const defaultText = lang === 'en'
      ? 'Each experience in this bundle can be explored in detail below.'
      : 'Ogni esperienza inclusa in questo pacchetto può essere esplorata in dettaglio qui sotto.';
    el.textContent = defaultText;
  },

  _prepareIncludedTripItems: (ids, allTrips, langDict) => {
    const tripsDict = langDict.trips || {};
    const items = [];
    ids.forEach(id => {
      const tid = String(id || '').trim();
      if (!tid) return;
      const apiTrip = allTrips.find(t => String(t.trip_id || '').trim() === tid);
      const langTrip = tripsDict[tid] || null;
      if (!apiTrip && !langTrip) return;
      items.push({ id: tid, apiTrip, langTrip });
    });
    return items;
  },

  _renderIncludedTripCard: (item, container, globalDict) => {
    const title = (item.langTrip && item.langTrip.title) || item.id;
    const desc = (item.langTrip && item.langTrip.short_desc) || '';
    const dur = (item.langTrip && item.langTrip.duration) || (globalDict.daily || '');

    // Get images
    const images = PackageRenderer._getImagesForTrip(item.id, item.apiTrip);
    const uniqueImages = [...new Set(images)].filter(Boolean);
    const imgId = `trip-img-${item.id}`;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'text-left bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gold hover:shadow-lg transition flex gap-4 group overflow-hidden';
    card.setAttribute('data-trip-id', item.id);

    card.innerHTML = `
      <div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">
          <img id="${imgId}" src="${uniqueImages[0]}" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" loading="lazy" alt="${title}">
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-0 justify-center">
          <h4 class="text-white font-semibold text-sm md:text-base truncate pr-2 group-hover:text-gold transition-colors">${title}</h4>
          <p class="text-gold text-xs font-bold uppercase tracking-wider">${dur}</p>
          <p class="text-gray-400 text-xs line-clamp-2 leading-relaxed">${desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      PackageRenderer.openIncludedTripModal(item);
    });
    container.appendChild(card);

    PackageRenderer.setupSlideshow(uniqueImages, imgId);
  },

  /**
   * Helper to resolve images for a trip
   */
  _getImagesForTrip: (tripId, apiTrip) => {
    const ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext({ trip_id: tripId, ...(apiTrip || {}) }) : { location: '', category: '', tripId: tripId };
    const posterSrc = window.ImagePaths ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId) : `assets/images/trips/${tripId}/poster.webp`;

    const totalRaw = window.ImagePaths && typeof window.ImagePaths.pickCI === 'function' ? window.ImagePaths.pickCI(apiTrip || {}, 'img_count') : '';
    const total = parseInt(totalRaw || '0', 10);
    const gallery = window.ImagePaths && typeof window.ImagePaths.getGalleryArray === 'function'
      ? window.ImagePaths.getGalleryArray(ctx.location, ctx.category, tripId, total)
      : [];

    return [posterSrc, ...gallery];
  },

  openIncludedTripModal: (item) => {
    const modal = document.getElementById('included-trip-modal');
    if (!modal) return;

    const lang = PackageRenderer.state.lang;
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const apiTrip = item.apiTrip || {};
    const langTrip = item.langTrip || {};
    const tripId = item.id;
    const globalDict = i18n.global || {};

    PackageRenderer._populateModalHero(tripId, apiTrip, lang, langTrip);
    PackageRenderer._populateModalInfo(tripId, langTrip, globalDict);
    PackageRenderer._populateModalLists(langTrip);
    PackageRenderer._populateModalPrice(apiTrip, globalDict);

    // Show Modal & Scroll Lock
    modal.classList.remove('hidden');
    if (document && document.body) {
      document.body.style.overflow = 'hidden';
    }
    PackageRenderer.bindModalClose();
  },

  _populateModalHero: (tripId, apiTrip, lang, langTrip) => {
    const heroEl = document.getElementById('included-trip-modal-hero');
    const galleryEl = document.getElementById('included-trip-modal-gallery');
    const badgeEl = document.getElementById('included-trip-badge');

    const images = PackageRenderer._getImagesForTrip(tripId, apiTrip);
    const posterSrc = images[0];

    // Hero
    if (heroEl) {
      heroEl.style.backgroundImage = `url('${posterSrc}')`;
      const ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext({ trip_id: tripId, ...(apiTrip || {}) }) : { location: '', category: '', tripId };
      if (window.ImagePaths && typeof window.ImagePaths.resolvePosterOrPlaceholder === 'function') {
        window.ImagePaths.resolvePosterOrPlaceholder(ctx.location, ctx.category, tripId).then(src => {
          heroEl.style.backgroundImage = `url('${src}')`;
        });
      }
    }

    // Badge
    const badgeText = apiTrip ? (lang === 'en' ? apiTrip.badge_en : apiTrip.badge_it) : '';
    if (badgeEl) {
      if (badgeText) {
        badgeEl.textContent = badgeText;
        badgeEl.classList.remove('hidden');
        badgeEl.classList.add('inline-block');
      } else {
        badgeEl.classList.add('hidden');
        badgeEl.classList.remove('inline-block');
      }
    }

    // Gallery Thumbs
    if (galleryEl) {
      galleryEl.innerHTML = '';
      const uniqueImages = [...new Set(images)].filter(Boolean);
      uniqueImages.forEach(src => PackageRenderer._createGalleryThumb(src, galleryEl, heroEl, 'w-24 h-16'));
    }
  },

  _populateModalInfo: (tripId, langTrip, globalDict) => {
    const titleEl = document.getElementById('included-trip-title');
    const durEl = document.getElementById('included-trip-duration');
    const descEl = document.getElementById('included-trip-desc');
    const fullDescEl = document.getElementById('included-trip-full-desc');
    const importantEl = document.getElementById('included-trip-important');

    if (titleEl) titleEl.textContent = langTrip.title || tripId;

    const daily = typeof globalDict.daily === 'string' ? globalDict.daily : '';
    if (durEl) {
      durEl.innerHTML = `
            <svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${langTrip.duration || daily}</span>
        `;
    }

    if (descEl) descEl.textContent = langTrip.short_desc || '';
    if (fullDescEl) fullDescEl.innerHTML = langTrip.full_description || '';
    if (importantEl) importantEl.textContent = langTrip.important_notes || '';
  },

  _populateModalLists: (langTrip) => {
    const highlightsEl = document.getElementById('included-trip-highlights');
    const includesEl = document.getElementById('included-trip-includes');
    const excludesEl = document.getElementById('included-trip-excludes');
    const programEl = document.getElementById('included-trip-program');

    PackageRenderer.renderList(highlightsEl, langTrip.highlights);
    PackageRenderer.renderList(includesEl, langTrip.includes, true, 'check');
    PackageRenderer.renderList(excludesEl, langTrip.not_included, true, 'cross');

    if (programEl) {
      programEl.innerHTML = '';
      if (Array.isArray(langTrip.program)) {
        const frag = document.createDocumentFragment();
        langTrip.program.forEach(step => {
          const row = document.createElement('div');
          row.className = 'flex items-start gap-4';
          row.innerHTML = `<div class="text-gold font-bold min-w-[70px] pt-1">${step.time || ''}</div><div class="flex-1"><div class="text-white font-semibold text-base mb-1">${step.activity || ''}</div><div class="text-gray-400 text-sm leading-relaxed">${step.details || ''}</div></div>`;
          frag.appendChild(row);
        });
        programEl.appendChild(frag);
      }
    }
  },

  _populateModalPrice: (apiTrip, globalDict) => {
    const priceEl = document.getElementById('included-trip-price');
    const priceBreakdownEl = document.getElementById('included-trip-price-breakdown');

    const pAdult = apiTrip ? parseFloat(apiTrip.p_adult || '0') : 0;
    const dAdult = apiTrip ? parseFloat(apiTrip.d_adult || '0') : 0;
    const pChild = apiTrip ? parseFloat(apiTrip.p_child || '0') : 0;
    const dChild = apiTrip ? parseFloat(apiTrip.d_child || '0') : 0;
    const minPax = apiTrip ? parseInt(apiTrip.min_pax || '1', 10) : 1;

    // Hero Price
    const adultHero = dAdult > 0
      ? `<span class="inline-flex items-center gap-2"><span class="line-through text-gray-400 text-lg">€${pAdult}</span><span class="text-gold font-bold text-3xl">€${dAdult}</span></span>`
      : `<span class="inline-flex items-center gap-2"><span class="text-gold font-bold text-3xl">€${pAdult}</span></span>`;
    if (priceEl) priceEl.innerHTML = adultHero;

    // Breakdown
    if (priceBreakdownEl) {
      const dictPricing = globalDict.pricing || {};
      const lblMinPax = dictPricing.min_pax || 'Min Pax';

      const adultRow = dAdult > 0
        ? `<div class="flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-white font-bold">€${dAdult}</span></div>`
        : `<div class="flex items-center gap-2"><span>👤</span><span class="text-white font-bold">€${pAdult}</span></div>`;

      const childRow = (dChild > 0 || pChild > 0)
        ? (dChild > 0
          ? `<div class="flex items-center gap-2"><span>👶</span><span class="line-through text-gray-400">€${pChild}</span><span class="text-white font-bold">€${dChild}</span></div>`
          : `<div class="flex items-center gap-2"><span>👶</span><span class="text-white font-bold">€${pChild}</span></div>`)
        : '';

      const minPaxRow = `<div class="flex items-center gap-2 text-gray-400 text-sm mt-1 pt-1 border-t border-gray-800 w-full"><span>👥</span><span>${lblMinPax}: ${minPax}</span></div>`;

      priceBreakdownEl.innerHTML = `${adultRow}${childRow}${minPaxRow}`;
    }
  },

  setupSlideshow: (uniqueImages, imgId) => {
    if (uniqueImages.length > 1) {
      let idx = 0;
      const interval = setInterval(() => {
        const el = document.getElementById(imgId);
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(() => {
          const target = document.getElementById(imgId);
          if (!target) return;
          idx = (idx + 1) % uniqueImages.length;
          target.src = uniqueImages[idx];
          target.style.opacity = '1';
        }, 200);
      }, 3000);
      PackageRenderer.state.intervals.push(interval);
    }
  },

  setupStickyBehavior: () => {
    const sticky = document.getElementById('sticky-mobile-book');
    const formCard = document.getElementById('booking-card-container');
    if (!sticky || !formCard) return;

    const stickyTxt = sticky.querySelector('span[data-i18n="global.book_package_now"]') || sticky.querySelector('span[data-i18n="global.book_now"]');
    const primaryTxt = document.querySelector('#btn-submit-booking span[data-i18n="global.book_package_now"]') || document.querySelector('#btn-submit-booking span');
    const runAnim = () => {
      if (stickyTxt) {
        stickyTxt.classList.add('animate-wiggle');
        setTimeout(() => stickyTxt.classList.remove('animate-wiggle'), 1200);
      }
      if (primaryTxt) {
        primaryTxt.classList.add('animate-wiggle');
        setTimeout(() => primaryTxt.classList.remove('animate-wiggle'), 1200);
      }
    };
    setInterval(runAnim, 8000);

    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && e.isIntersecting && e.intersectionRatio > 0.1) {
        sticky.classList.add('opacity-0', 'pointer-events-none');
        sticky.classList.remove('opacity-100');
      } else {
        sticky.classList.add('opacity-100');
        sticky.classList.remove('opacity-0', 'pointer-events-none');
      }
    }, { root: null, threshold: [0, 0.1, 1] });

    io.observe(formCard);
  },

  renderList: (host, arr, bullet, iconType) => {
    if (!host) return;
    host.innerHTML = '';
    if (!Array.isArray(arr) || arr.length === 0) return;
    const frag = document.createDocumentFragment();

    let iconSvg = '';
    if (bullet) {
      if (iconType === 'check') {
        iconSvg = `<svg class="w-4 h-4 text-green-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
      } else if (iconType === 'cross') {
        iconSvg = `<svg class="w-4 h-4 text-red-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      }
    }

    arr.forEach(item => {
      const li = document.createElement('li');
      if (bullet && iconSvg) {
        li.className = 'flex items-start gap-2';
        li.innerHTML = `${iconSvg}<span>${item}</span>`;
      } else {
        li.textContent = item;
      }

      if (!bullet) li.style.listStyle = 'none';
      frag.appendChild(li);
    });
    host.appendChild(frag);
  },

  renderProgram: (host, program) => {
    if (!host) return;
    host.innerHTML = '';
    if (!Array.isArray(program)) return;
    const frag = document.createDocumentFragment();
    program.forEach(step => {
      const time = step.time || '';
      const activity = step.activity || '';
      const details = step.details || '';
      const row = document.createElement('div');
      row.className = 'flex items-start gap-4 mb-4';
      row.innerHTML = `<div class="text-gold font-bold min-w-[72px]">${time}</div><div><div class="text-white font-semibold">${activity}</div><div class="text-gray-400 text-sm">${details}</div></div>`;
      frag.appendChild(row);
    });
    host.appendChild(frag);
  },

  _createGalleryThumb: (src, host, bgEl, classes) => {
    if (!host || !src) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${classes} rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-gray-700 hover:border-gold transition`;
    btn.innerHTML = `<img src="${src}" class="w-full h-full object-cover" loading="lazy">`;
    btn.addEventListener('click', () => {
      if (bgEl) bgEl.style.backgroundImage = `url('${src}')`;
    });
    host.appendChild(btn);
  },

  bindModalClose: () => {
    const modal = document.getElementById('included-trip-modal');
    const closeBtn = document.getElementById('included-trip-modal-close');
    if (!modal) return;

    const close = () => {
      modal.classList.add('hidden');
      if (document && document.body) {
        document.body.style.overflow = '';
      }
    };

    // Prevent duplicate binding
    if (closeBtn && !closeBtn.__bound) {
      closeBtn.__bound = true;
      closeBtn.addEventListener('click', close);
    }
    if (!modal.__boundClick) {
      modal.__boundClick = true;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }
  }
};

window.PackageRenderer = PackageRenderer;
window.addEventListener('langChanged', () => {
  if (window.PackageRenderer && typeof window.PackageRenderer.init === 'function') {
    window.PackageRenderer.init();
  }
});
