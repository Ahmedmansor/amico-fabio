const ExploreRenderer = {
  state: {
    loc: null,
    sort: 'default',
    category: 'all',
    trips: []
  },
  init: async () => {
    const params = new URLSearchParams(window.location.search);
    const currentLoc = params.get('loc') || 'all';

    const navSource = sessionStorage.getItem('fabio_nav_source');
    if (navSource === 'details') {
      const sSort = sessionStorage.getItem('fabio_explore_sort');
      const sCat = sessionStorage.getItem('fabio_explore_cat');
      ExploreRenderer.state.sort = sSort || 'default';
      ExploreRenderer.state.category = sCat || 'all';
    } else {
      ExploreRenderer.state.sort = 'default';
      ExploreRenderer.state.category = 'all';
      sessionStorage.setItem('fabio_explore_sort', 'default');
      sessionStorage.setItem('fabio_explore_cat', 'all');
    }

    ExploreRenderer.state.loc = currentLoc;
    sessionStorage.setItem('fabio_last_loc', currentLoc);

    ExploreRenderer.renderFilters();

    ExploreRenderer.renderInitialFromI18n();
    let data = null;
    if (window.api && window.api.fetchAllData) {
      data = await window.api.fetchAllData();
    }
    const trips = (data && data.Trips_Prices) ? data.Trips_Prices : [];
    ExploreRenderer.state.trips = ExploreRenderer.applyLocationFilter(trips, ExploreRenderer.state.loc);

    ExploreRenderer.updateCardsWithPrices(ExploreRenderer.state.trips);
    ExploreRenderer.renderOrEmpty();
    sessionStorage.removeItem('fabio_nav_source');
  },
  renderFilters: () => {
    const chipsHost = document.getElementById('filter-chips');
    if (!chipsHost) return;
    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const gf = (i18n.global && i18n.global.filters) ? i18n.global.filters : {};
    const chips = [
      { key: 'all', label: gf.all || 'All' },
      { key: 'sea', label: gf.sea || 'Sea' },
      { key: 'culture', label: gf.culture || 'Culture' },
      { key: 'desert', label: gf.desert || 'Desert' }
    ];
    chipsHost.innerHTML = '';
    chips.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'px-4 py-2 rounded-full text-sm min-w-[72px] transition-colors ' +
        (ExploreRenderer.state.category === ch.key ? 'bg-transparent text-white border border-gold' : 'bg-black/60 text-white border border-gray-700');
      btn.textContent = ch.label;
      btn.addEventListener('click', () => {
        ExploreRenderer.state.category = ch.key;
        try { sessionStorage.setItem('fabio_explore_cat', ExploreRenderer.state.category); } catch (err) { }
        ExploreRenderer.renderFilters();
        ExploreRenderer.renderOrEmpty();
      });
      chipsHost.appendChild(btn);
    });
    const sortSel = document.getElementById('price-sort');
    if (sortSel) {
      sortSel.value = ExploreRenderer.state.sort;
      sortSel.addEventListener('change', (e) => {
        ExploreRenderer.state.sort = e.target.value;
        try { sessionStorage.setItem('fabio_explore_sort', ExploreRenderer.state.sort); } catch (err) { }
        ExploreRenderer.renderOrEmpty();
      });
    }
  },
  getTripIdsByLocation: (loc) => {
    const map = {
      sharm: ['ras_mohammed_white_island_vip', 'ras_mohammed_bus_half_day', 'tiran_island_boat_vip', 'desert_quad_bike_safari'],
      cairo: ['cairo_pyramids_classic', 'cairo_pyramids_by_plane'],
      luxor_and_aswan: ['luxor_day_trip', 'aswan_day_trip'],
      all: ['ras_mohammed_white_island_vip', 'ras_mohammed_bus_half_day', 'tiran_island_boat_vip', 'desert_quad_bike_safari', 'cairo_pyramids_classic', 'cairo_pyramids_by_plane', 'luxor_day_trip', 'aswan_day_trip']
    };
    return map[loc] || map.all;
  },
  renderInitialFromI18n: () => {
    const grid = document.getElementById('explore-grid');
    if (!grid) return;
    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const ids = ExploreRenderer.getTripIdsByLocation(ExploreRenderer.state.loc);
    grid.innerHTML = '';
    const stubs = ids.map(id => ({ trip_id: id }));
    const filteredStubs = ExploreRenderer.applyCategoryFilter(stubs, ExploreRenderer.state.category);
    filteredStubs.forEach((stub, i) => {
      const tripObj = { trip_id: stub.trip_id, badge_en: '', badge_it: '', p_adult: '', d_adult: '' };
      const card = window.TripsRenderer ? window.TripsRenderer.createTripCard(tripObj, lang, i) : null;
      if (card) grid.appendChild(card);
    });
    if (window.AOS) window.AOS.refresh();
  },
  applyLocationFilter: (trips, loc) => {
    if (!Array.isArray(trips)) return [];
    if (!loc || loc === 'all') return trips.slice();
    const pickCI = (obj, name) => {
      const key = Object.keys(obj || {}).find(k => k.toLowerCase().trim() === name);
      return key ? obj[key] : '';
    };
    return trips.filter(t => {
      const explicitRaw = pickCI(t, 'location') || pickCI(t, 'loc') || pickCI(t, 'city') || '';
      const explicit = String(explicitRaw).toLowerCase().trim();
      if (!explicit) return false;
      if (loc === 'luxor_and_aswan') return explicit.includes('luxor') || explicit.includes('aswan');
      return explicit.includes(loc);
    });
  },
  getCategory: (tripId) => {
    const sea = ['ras_mohammed_white_island_vip', 'ras_mohammed_bus_half_day', 'tiran_island_boat_vip'];
    const culture = ['cairo_pyramids_classic', 'cairo_pyramids_by_plane', 'luxor_day_trip', 'aswan_day_trip'];
    const desert = ['desert_quad_bike_safari'];
    if (sea.includes(tripId)) return 'sea';
    if (culture.includes(tripId)) return 'culture';
    if (desert.includes(tripId)) return 'desert';
    return 'all';
  },
  applyCategoryFilter: (trips, category) => {
    if (!category || category === 'all') return trips.slice();
    const pickCI = (obj, name) => {
      const key = Object.keys(obj || {}).find(k => k.toLowerCase().trim() === name);
      return key ? obj[key] : '';
    };
    return trips.filter(t => {
      const cat = String(pickCI(t, 'category') || '').toLowerCase().trim();
      if (cat) return cat === category;
      return ExploreRenderer.getCategory(t.trip_id) === category;
    });
  },
  sortTrips: (list) => {
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
    const s = ExploreRenderer.state.sort;
    if (s === 'price_asc' || s === 'price_desc') {
      const asc = s === 'price_asc';
      return list.slice().sort((a, b) => {
        const pa = priceVal(a);
        const pb = priceVal(b);
        if (pa !== pb) return asc ? pa - pb : pb - pa;
        const ba = score(a);
        const bb = score(b);
        return bb - ba;
      });
    }
    return list.slice().sort((a, b) => {
      const ba = score(a);
      const bb = score(b);
      if (bb !== ba) return bb - ba;
      const pa = priceVal(a);
      const pb = priceVal(b);
      return pa - pb;
    });
  },
  renderCards: () => {
    const grid = document.getElementById('explore-grid');
    if (!grid) return;
    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const filteredByLoc = ExploreRenderer.applyLocationFilter(ExploreRenderer.state.trips, ExploreRenderer.state.loc);
    const filteredByCat = ExploreRenderer.applyCategoryFilter(filteredByLoc, ExploreRenderer.state.category);
    const sorted = ExploreRenderer.sortTrips(filteredByCat);
    grid.innerHTML = '';
    sorted.forEach((trip, i) => {
      const card = window.TripsRenderer ? window.TripsRenderer.createTripCard(trip, lang, i) : null;
      if (card) grid.appendChild(card);
    });
    if (window.AOS) window.AOS.refresh();
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
        if (dd > 0) {
          const pct = pp > 0 ? Math.round(((pp - dd) / pp) * 100) : 0;
          html = `
            <div class="price-row fade-in-soft">
              <span class="price-old">€${pp}</span>
              <span class="price-new">€${dd}</span>
              <span class="deal-inline"></span>
            </div>
          `;
        } else if (pp > 0) {
          html = `
            <div class="price-row fade-in-soft">
              <span class="price-new">€${pp}</span>
            </div>
          `;
        }
        if (html) {
          const skeleton = pb.querySelector('.price-skeleton');
          if (skeleton) skeleton.remove();
          pb.insertAdjacentHTML('beforeend', html);
        }
      }
      const badgeWrap = el.querySelector('.card-badges');
      const std = lang === 'en' ? (t.badge_en || '') : (t.badge_it || '');
      if (badgeWrap) {
        const existing = badgeWrap.querySelector('.standard-badge');
        if (std && !existing) {
          badgeWrap.insertAdjacentHTML('beforeend', `<span class="standard-badge fade-in-soft">${std}</span>`);
        }
      }
    });
  },
  renderOrEmpty: () => {
    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const msg = dict && dict.global && typeof dict.global.no_exclusive_experiences === 'string' ? dict.global.no_exclusive_experiences : '';
    const grid = document.getElementById('explore-grid');
    if (!grid) return;
    const filteredByLoc = ExploreRenderer.applyLocationFilter(ExploreRenderer.state.trips, ExploreRenderer.state.loc);
    const filteredByCat = ExploreRenderer.applyCategoryFilter(filteredByLoc, ExploreRenderer.state.category);
    if (!filteredByCat || filteredByCat.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-20">
        <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${msg}</p>
      </div>`;
      return;
    }
    ExploreRenderer.renderCards();
  }
};
window.ExploreRenderer = ExploreRenderer;
window.addEventListener('langChanged', () => {
  ExploreRenderer.renderFilters();
  ExploreRenderer.renderInitialFromI18n();
  ExploreRenderer.renderCards();
});
