; (function () {
  const parts = (typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname.split('/') : []);
  const repo = parts.filter(Boolean)[0] || '';
  const fallbackBase = repo ? `/${repo}/` : '/';
  const BASE = (typeof window !== 'undefined' && window.FABIO_BASE_URL) || fallbackBase;
  const p = (path) => BASE + path;

  // --- Helper Functions ---
  function normalizeParam(v) {
    return String(v || '').trim().toLowerCase();
  }

  function pickCI(obj, name) {
    const key = Object.keys(obj || {}).find(k => k.toLowerCase().trim() === name);
    return key ? obj[key] : '';
  }

  // --- Location Inference Logic (Fallback for missing data) ---
  function inferLocation(tripId) {
    const id = normalizeParam(tripId);

    // Sharm El Sheikh Trips List
    const sharm = [
      // Sea
      'ras_mohammed_white_island_vip', 'ras_mohammed_bus_half_day', 'tiran_island_boat_vip',
      'seascope_semi_submarine', 'private_boat_vip_king', 'sina_dream_vip_day',
      'dinner_cruise_night_show', 'swim_with_dolphins_vip', 'water_sports_adrenaline_combo',
      'dahab_blue_hole_super_safari', 'albatros_aqua_park_full_day', 'dolphin_show_family',
      // Desert
      'super_safari_5_senses', 'vip_romantic_dinner_desert', 'vip_cena_romantica',
      //'desert_quad_bike_safari'
      //culture
      'mount_sinai_sunrise_adventure', 'santa_caterina_monastery_morning', 'cairo_bus_adventure_choice', 'cairo_plane_flexible_museum', 'petra_jordan_expedition',
      , 'luxor_plane_classic',

      // Packages
      'sharm_confidential', 'sharm_confidential_l\'esperienza_totale'
    ];

    // Cairo Trips List
    const cairo = [
      'cairo_pyramids_classic', 'cairo_pyramids_by_plane',

    ];

    // Luxor & Aswan Trips List
    const luxor = [
      'luxor_day_trip', 'aswan_day_trip',
      'luxor_and_aswan'
    ];



    if (sharm.some(k => id.includes(k)) || id.includes('sharm')) return 'sharm';
    if (cairo.some(k => id.includes(k)) || id.includes('cairo')) return 'cairo';
    if (luxor.some(k => id.includes(k)) || id.includes('luxor')) return 'luxor_and_aswan';
    if (petra.some(k => id.includes(k))) return 'petra'; // If folder exists

    return 'sharm'; // Default Fallback
  }

  // --- Category Inference Logic (Sea, Desert, Culture, Bundles) ---
  function inferCategory(tripId) {
    const id = normalizeParam(tripId);

    // Category Keywords
    const sea = ['ras', 'mohammed', 'tiran', 'boat', 'dolphin', 'sea', 'water', 'aqua', 'cruise', 'sub', 'dahab', 'blue_hole'];
    const desert = ['safari', 'quad', 'bike', 'dinner', 'bedouin', 'mountain', 'camel', 'sinai', 'caterina'];
    const culture = ['cairo', 'luxor', 'aswan', 'petra', 'museum', 'pyramids'];
    const bundles = ['confidential', 'package', 'bundle', 'offer'];

    if (bundles.some(k => id.includes(k))) return 'bundles'; // New Packages Category
    if (sea.some(k => id.includes(k))) return 'sea';
    if (culture.some(k => id.includes(k))) return 'culture';
    if (desert.some(k => id.includes(k))) return 'desert';

    return 'sea'; // Default Fallback
  }

  // --- Check File Existence ---
  async function exists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // --- Build Folder Path ---
  function getTripFolder(location, category, tripId) {
    const loc = normalizeParam(location);
    const cat = normalizeParam(category);
    const id = normalizeParam(tripId);

    // Standard path: assets/images/trips/sharm/sea/trip_id/
    if (cat) return `${BASE}assets/images/trips/${loc}/${cat}/${id}/`;
    return `${BASE}assets/images/trips/${loc}/${id}/`;
  }

  // --- Main Image Functions (WebP Enforced) ---

  function getPoster(location, category, tripId) {
    // Always return WebP since we standardized formats
    return getTripFolder(location, category, tripId) + 'poster.webp';
  }

  async function resolvePosterOrPlaceholder(location, category, tripId) {
    const p = getPoster(location, category, tripId);
    // Optional: Enable the check below if you want to verify file existence first
    // if (await exists(p)) return p;

    // Returning path directly assuming assets are optimized and present
    return p;
  }

  function manifestCount(tripId) {
    const id = normalizeParam(tripId);
    // Get image count from metadata object if available
    const map = (typeof window !== 'undefined' && window.TripsMetadata) ? window.TripsMetadata : {};
    const keys = Object.keys(map || {});
    const k = keys.find(x => String(x).trim().toLowerCase() === id);
    const val = k ? map[k] : undefined;
    const n = parseInt(val !== undefined ? String(val) : '1', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function getGalleryArray(location, category, tripId, totalCount) {
    const folder = getTripFolder(location, category, tripId);
    let n = parseInt(totalCount || '0', 10);

    // If count not provided via API, fallback to metadata
    if (!Number.isFinite(n) || n <= 0) n = manifestCount(tripId);
    const out = [];
    if (n <= 1) return out;

    // Assuming gallery images start from 1.webp
    for (let i = 1; i <= n - 1; i++) {
      out.push(`${folder}${i}.webp`);
    }
    return out;
  }

  function resolveTripContext(trip) {
    // Attempt to extract ID, Location, and Category from trip object
    const id = normalizeParam(pickCI(trip, 'trip_id') || pickCI(trip, 'id') || pickCI(trip, 'package_id') || '');
    const explicitLoc = normalizeParam(pickCI(trip, 'location') || pickCI(trip, 'loc') || pickCI(trip, 'city') || '');
    const explicitCat = normalizeParam(pickCI(trip, 'category') || '');

    // If not explicitly present, infer from ID
    const loc = explicitLoc || inferLocation(id);
    const cat = explicitCat || inferCategory(id);

    return { location: loc, category: cat, tripId: id };
  }

  // --- Base Path Logic ---
  // Moved to top
  // const basePath = window.location.pathname.includes('/sharm-secrets/') ? '../' : '';
  // const p = (path) => basePath + path;

  const ImagePaths = {
    ui: {
      placeholder: p('assets/images/ui/placeholder.webp'),
      headerLogo: p('assets/images/logo/fabio-header-logo.webp'),
      crossRootsLogo: p('assets/images/logo/cross-roots-logo.webp'),
      //menuIcon
      menuIcon: p('assets/images/icons/menu-icon.webp'),
      // Changed extension to webp for the new logo
      fallbackLogo: p('assets/images/logo/logo-fabio-square.webp')
    },
    landing: {
      hero: [
        p('assets/images/comandamenti-images/1.webp'),
        p('assets/images/comandamenti-images/2.webp'),
        p('assets/images/comandamenti-images/3.webp')
      ],
      whoFabio: {
        bg: p('assets/images/home-who-fabio/home-who-fabio-bg.webp'),
        person: p('assets/images/home-who-fabio/home-who-fabio-preson.webp')
      },
      locations: {
        sharm: p('assets/images/home-fabio-tours-sections/sharm.webp'),
        cairo: p('assets/images/home-fabio-tours-sections/cairo.webp'),
        luxor: p('assets/images/home-fabio-tours-sections/Luxor-and-aswan.webp')
      }
    },
    secrets: {
      fabio: p('assets/images/10-comandamenti-images/fabio.webp'),
      cars: p('assets/images/10-comandamenti-images/modern-sanitized-private-cars.webp'),
      drivers: p('assets/images/10-comandamenti-images/autisti-professionisti.webp'),
      boats: p('assets/images/10-comandamenti-images/imbarcazioni-vip.webp'),
      coins: p('assets/images/10-comandamenti-images/euro-coins-no.webp'),
      sim: p('assets/images/10-comandamenti-images/sim-card-solo-negozi-ufficiali.webp'),
      taxi: p('assets/images/10-comandamenti-images/taxi-prezzo-concordato.webp'),
      antinal: p('assets/images/10-comandamenti-images/antinal.webp'),
      dress: p('assets/images/10-comandamenti-images/dress-code.webp'),
      negotiate: p('assets/images/10-comandamenti-images/negoziare.webp'),
      corals: p('assets/images/10-comandamenti-images/coralli.webp'),
      baksheesh: p('assets/images/10-comandamenti-images/baksheesh.webp'),
      water: p('assets/images/10-comandamenti-images/water.webp'),
      relax: p('assets/images/10-comandamenti-images/relax.webp'),
      farsha: p('assets/images/10-comandamenti-images/farsha-café.webp')
    },
    adventures: {
      pilot: p('assets/images/adventures/pilot.webp'),
      eiffel: p('assets/images/adventures/eiffel-tower.webp'),
      redSquare: p('assets/images/adventures/red-square.webp'),
      diving: p('assets/images/adventures/diving.webp'),
      desert: p('assets/images/adventures/dessert.webp'),
      urbano: p('assets/images/adventures/urbano.webp'),
      ogni: p('assets/images/adventures/ogni.webp'),
      advanced: p('assets/images/adventures/advanced-open-water.webp')
    },
    icons: {
      legal: {
        intro: p('assets/images/icons/legal/intro.svg'),
        owner: p('assets/images/icons/legal/owner.svg'),
        data_types: p('assets/images/icons/legal/data_types.svg'),
        method: p('assets/images/icons/legal/method.svg'),
        purpose: p('assets/images/icons/legal/purpose.svg'),
        cookies: p('assets/images/icons/legal/cookies.svg'),
        third_party: p('assets/images/icons/legal/third_party.svg'),
        rights: p('assets/images/icons/legal/rights.svg'),
        liability: p('assets/images/icons/legal/liability.svg'),
        definitions: p('assets/images/icons/legal/definitions.svg'),
        contact: p('assets/images/icons/legal/contact.svg'),
        // Fallback icon
        default: p('assets/images/icons/legal/intro.svg')
      },
      social: {
        facebook: p('assets/images/icons/social/facebook.svg'),
        instagram: p('assets/images/icons/social/instagram.svg')
      }
    },
    pickCI,
    normalizeParam,
    getTripFolder,
    getPoster,
    resolvePosterOrPlaceholder,
    getGalleryArray,
    resolveTripContext,
    exists,
  };

  // --- Auto-Bind Landing Images (Clean Code Implementation) ---
  function bindLandingImages() {
    const targets = document.querySelectorAll('[data-landing-img]');
    targets.forEach(el => {
      const key = el.getAttribute('data-landing-img');
      if (!key) return;

      // Resolve key (e.g., "landing.hero.0" or "ui.placeholder")
      const parts = key.split('.');
      let val = ImagePaths; // Start from root
      for (const p of parts) {
        val = val && val[p];
      }

      if (typeof val === 'string') {
        el.src = val;
      }
    });
  }

  // Run immediately if DOM is ready, or wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLandingImages);
  } else {
    bindLandingImages();
  }

  window.ImagePaths = ImagePaths;
})();
