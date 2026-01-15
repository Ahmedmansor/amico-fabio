const ExploreRenderer = {
  state: {
    loc: null,
    sort: 'default',
    category: 'all',
    allRawTrips: [],
    filteredTrips: [],
    currentPage: 1,
    itemsPerPage: 10,
    hasLoadedOnce: false
  },

  init: async () => {
    const params = new URLSearchParams(window.location.search);
    const currentLoc = params.get('loc') || 'all';
    const navSource = sessionStorage.getItem('fabio_nav_source');

    // 1. State Recovery 
    if (navSource === 'details') {
      const sSort = sessionStorage.getItem('fabio_explore_sort');
      const sCat = sessionStorage.getItem('fabio_explore_cat');
      ExploreRenderer.state.sort = sSort || 'default';
      ExploreRenderer.state.category = sCat || 'all';
      const sPage = sessionStorage.getItem('fabio_explore_page');
      if (sPage) ExploreRenderer.state.currentPage = parseInt(sPage);
    } else {
      ExploreRenderer.state.sort = 'default';
      ExploreRenderer.state.category = 'all';
      ExploreRenderer.state.currentPage = 1;
      sessionStorage.setItem('fabio_explore_sort', 'default');
      sessionStorage.setItem('fabio_explore_cat', 'all');
      sessionStorage.removeItem('fabio_data_cache'); // Clear cache on fresh entry 
    }

    ExploreRenderer.state.loc = currentLoc;
    sessionStorage.setItem('fabio_last_loc', currentLoc);

    // 2. Cache Strategy 
    const cachedRaw = sessionStorage.getItem('fabio_data_cache');
    let usedCache = false;

    if (navSource === 'details' && cachedRaw) {
      try {
        const cachedData = JSON.parse(cachedRaw);
        if (cachedData) {
          ExploreRenderer.processData(cachedData);
          usedCache = true;
        }
      } catch (e) { console.error('Cache parse error', e); }
    }

    // 3. Network Strategy (Fallback) 
    if (!usedCache) {
      if (ExploreRenderer.renderFilterSkeleton) ExploreRenderer.renderFilterSkeleton();
      if (ExploreRenderer.renderCardSkeleton) ExploreRenderer.renderCardSkeleton(6);

      if (window.api && window.api.fetchAllData) {
        const data = await window.api.fetchAllData();
        sessionStorage.setItem('fabio_data_cache', JSON.stringify(data));
        ExploreRenderer.processData(data);
      } else {
        if (ExploreRenderer.renderOrEmpty) ExploreRenderer.renderOrEmpty();
      }
    }

    sessionStorage.removeItem('fabio_nav_source');
  },

  processData: (data) => {
    const tripsData = data.Trips_Prices || [];
    const packagesData = data.Packages || [];
    const combined = [...tripsData, ...packagesData];

    ExploreRenderer.state.allRawTrips = combined.filter(t => {
      const pickCI = (obj, name) => {
        const key = Object.keys(obj || {}).find(k => k.toLowerCase().trim() === name);
        return key ? obj[key] : '';
      };
      const explicitRaw = pickCI(t, 'location') || pickCI(t, 'loc') || pickCI(t, 'city') || '';
      const explicit = String(explicitRaw).toLowerCase().trim();
      const loc = String(ExploreRenderer.state.loc || 'all').toLowerCase().trim();

      const isLocMatch = loc === 'all' ||
        (loc === 'luxor_and_aswan' ? (explicit.includes('luxor') || explicit.includes('aswan')) : explicit.includes(loc));

      const isActive = String(t.is_active).toLowerCase() === 'true' || t.is_active === '1' || t.is_active === true;
      return isLocMatch && isActive;
    });

    if (ExploreRenderer.renderDynamicFilters) ExploreRenderer.renderDynamicFilters();
    if (ExploreRenderer.applyFiltersAndRender) ExploreRenderer.applyFiltersAndRender();
  },

  resolveCategory: (trip) => {
    const explicit = String((trip && trip.category) || '').toLowerCase().trim();
    if (explicit) return explicit;
    if (window.ImagePaths && typeof window.ImagePaths.resolveTripContext === 'function') {
      const ctx = window.ImagePaths.resolveTripContext(trip || {});
      const cat = String((ctx && ctx.category) || '').toLowerCase().trim();
      if (cat) return cat;
    }
    return 'others';
  },
  renderDynamicFilters: () => {
    const chipsHost = document.getElementById('filter-chips');
    if (!chipsHost) return;
    const uniqueCats = new Set(ExploreRenderer.state.allRawTrips.map(t => ExploreRenderer.resolveCategory(t)));
    const categories = ['all', ...Array.from(uniqueCats).sort()];
    const lang = localStorage.getItem('fabio_lang') || 'it';
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const filtersDict = (i18n.global && i18n.global.filters) ? i18n.global.filters : {};

    chipsHost.innerHTML = categories.map(cat => {
      const isActive = ExploreRenderer.state.category === cat;
      const label = filtersDict[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
      const base = 'inline-flex items-center justify-center h-8 px-3 rounded-full text-xs min-w-[64px] transition-colors';
      const style = isActive ? 'bg-transparent text-white border border-gold' : 'bg-black/60 text-white border border-gray-700 hover:border-gray-500';
      return `<button class="${base} ${style}" onclick="ExploreRenderer.handleFilterClick('${cat}')">${label}</button>`;
    }).join('');

    const sortSel = document.getElementById('price-sort');
    if (sortSel) {
      sortSel.value = ExploreRenderer.state.sort;
      sortSel.onchange = (e) => {
        ExploreRenderer.state.sort = e.target.value;
        try { sessionStorage.setItem('fabio_explore_sort', ExploreRenderer.state.sort); } catch (err) { }
        ExploreRenderer.applyFiltersAndRender();
      };
    }
  },

  handleFilterClick: (cat) => {
    ExploreRenderer.state.category = cat;
    ExploreRenderer.state.currentPage = 1;
    try { sessionStorage.setItem('fabio_explore_cat', cat); } catch (err) { }
    ExploreRenderer.renderDynamicFilters();
    ExploreRenderer.applyFiltersAndRender();
  },

  applyFiltersAndRender: () => {
    let list = [...ExploreRenderer.state.allRawTrips];
    if (ExploreRenderer.state.category !== 'all') {
      list = list.filter(t => ExploreRenderer.resolveCategory(t) === ExploreRenderer.state.category);
    }
    list = ExploreRenderer.sortTrips(list);
    ExploreRenderer.state.filteredTrips = list;
    const totalPages = Math.ceil(ExploreRenderer.state.filteredTrips.length / ExploreRenderer.state.itemsPerPage);
    if (totalPages > 0 && ExploreRenderer.state.currentPage > totalPages) ExploreRenderer.state.currentPage = totalPages;
    if (ExploreRenderer.state.currentPage < 1) ExploreRenderer.state.currentPage = 1;
    ExploreRenderer.renderPage();
  },

  sortTrips: (list) => {
    const s = ExploreRenderer.state.sort;
    const priceVal = (t) => {
      const dd = parseFloat(t.d_adult || '0');
      const pp = parseFloat(t.p_adult || '0');
      return dd > 0 ? dd : pp;
    };
    const score = (t) => {
      const bi = String(t.badge_it || '').trim() ? 2 : 0;
      const be = String(t.badge_en || '').trim() ? 1 : 0;
      return bi + be;
    };
    return list.sort((a, b) => {
      if (s === 'price_asc') return priceVal(a) - priceVal(b);
      if (s === 'price_desc') return priceVal(b) - priceVal(a);
      const scoreDiff = score(b) - score(a);
      return scoreDiff !== 0 ? scoreDiff : priceVal(a) - priceVal(b);
    });
  },
  renderPage: () => {
    const grid = document.getElementById('explore-grid');
    const paginationHost = document.getElementById('pagination-controls');
    if (!grid) return;

    if (ExploreRenderer.state.filteredTrips.length === 0) {
      const lang = localStorage.getItem('fabio_lang') || 'it';
      const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
      const msg = i18n.global?.no_exclusive_experiences || "No experiences found.";
      grid.innerHTML = `<div class="col-span-full text-center py-20"><p class="text-gray-400 text-xl font-playfair italic">${msg}</p></div>`;
      if (paginationHost) paginationHost.classList.add('hidden');
      return;
    }

    const startIndex = (ExploreRenderer.state.currentPage - 1) * ExploreRenderer.state.itemsPerPage;
    const endIndex = startIndex + ExploreRenderer.state.itemsPerPage;
    const pageItems = ExploreRenderer.state.filteredTrips.slice(startIndex, endIndex);
    const totalPages = Math.ceil(ExploreRenderer.state.filteredTrips.length / ExploreRenderer.state.itemsPerPage);
    const lang = localStorage.getItem('fabio_lang') || 'it';

    grid.innerHTML = '';
    pageItems.forEach((trip, i) => {
      const card = window.TripsRenderer ? window.TripsRenderer.createTripCard(trip, lang, i) : null;
      if (card) grid.appendChild(card);
    });

    ExploreRenderer.updateCardsWithPrices(pageItems);

    if (paginationHost) {
      if (totalPages > 1) {
        paginationHost.classList.remove('hidden');
        paginationHost.innerHTML = ` 
          <button class="w-10 h-10 rounded-full border border-gold text-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-colors" ${ExploreRenderer.state.currentPage === 1 ? 'disabled' : ''} onclick="ExploreRenderer.changePage(${ExploreRenderer.state.currentPage - 1})">←</button> 
          <span class="text-white font-playfair text-lg">Page <span class="text-gold">${ExploreRenderer.state.currentPage}</span> of ${totalPages}</span> 
          <button class="w-10 h-10 rounded-full border border-gold text-gold flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold hover:text-black transition-colors" ${ExploreRenderer.state.currentPage === totalPages ? 'disabled' : ''} onclick="ExploreRenderer.changePage(${ExploreRenderer.state.currentPage + 1})">→</button> 
        `;
      } else {
        paginationHost.classList.add('hidden');
      }
    }

    if (window.AOS) window.AOS.refresh();
    if (ExploreRenderer.state.hasLoadedOnce) {
      const section = document.querySelector('section');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
    ExploreRenderer.state.hasLoadedOnce = true;
  },

  changePage: (newPage) => {
    ExploreRenderer.state.currentPage = newPage;
    try { sessionStorage.setItem('fabio_explore_page', newPage); } catch (e) { }
    ExploreRenderer.renderPage();
  },
  renderFilterSkeleton: () => {
    const chipsHost = document.getElementById('filter-chips');
    if (chipsHost) chipsHost.innerHTML = Array(4).fill(0).map(() => `<div class="chip-skeleton"></div>`).join('');
  },

  renderCardSkeleton: (n) => {
    const grid = document.getElementById('explore-grid');
    if (grid) grid.innerHTML = Array(n).fill(0).map(() => ` 
      <div class="bg-[#1a1510] rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border border-white/5 relative min-h-[400px]"> 
        <div class="h-[220px] w-full bg-gray-800/50 relative overflow-hidden animate-pulse"></div> 
        <div class="p-6 flex-grow space-y-6"> 
          <div class="h-7 bg-gray-800/50 rounded-lg w-3/4 animate-pulse"></div> 
        </div> 
      </div>`).join('');
  },

  updateCardsWithPrices: (trips) => {
    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    trips.forEach(t => {
      const el = document.querySelector(`article.catalog-card[data-trip-id="${t.trip_id}"]`);
      if (!el) return;
      const pb = el.querySelector('.price-block');
      if (pb) {
        const dd = parseFloat(t.d_adult || '0');
        const pp = parseFloat(t.p_adult || '0');
        let html = '';
        if (dd > 0) html = `<div class="price-row fade-in-soft"><span class="price-old">€${pp}</span><span class="price-new">€${dd}</span></div>`;
        else if (pp > 0) html = `<div class="price-row fade-in-soft"><span class="price-new">€${pp}</span></div>`;
        const skeleton = pb.querySelector('.price-skeleton');
        const existingRow = pb.querySelector('.price-row');
        if (html && (skeleton || !existingRow)) {
          if (skeleton) skeleton.remove();
          if (!existingRow) pb.insertAdjacentHTML('beforeend', html);
        }
        const rows = pb.querySelectorAll('.price-row');
        if (rows.length > 1) {
          rows.forEach((r, i) => { if (i > 0) r.remove(); });
        }
      }
      const badgeWrap = el.querySelector('.card-badges');
      const std = lang === 'en' ? (t.badge_en || '') : (t.badge_it || '');
      if (badgeWrap && std && !badgeWrap.querySelector('.standard-badge')) {
        badgeWrap.insertAdjacentHTML('beforeend', `<span class="standard-badge fade-in-soft">${std}</span>`);
      }
    });
  },

  renderOrEmpty: () => {
    const grid = document.getElementById('explore-grid');
    if (grid) grid.innerHTML = '';
  }
};
window.ExploreRenderer = ExploreRenderer;
window.addEventListener('langChanged', () => {
  ExploreRenderer.state.hasLoadedOnce = false;
  ExploreRenderer.renderDynamicFilters();
  ExploreRenderer.renderPage();
});
