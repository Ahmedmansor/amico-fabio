; (function () {
  function normalizeParam(v) {
    return String(v || '').trim().toLowerCase();
  }
  function pickCI(obj, name) {
    const key = Object.keys(obj || {}).find(k => k.toLowerCase().trim() === name);
    return key ? obj[key] : '';
  }
  function inferLocation(tripId) {
    const id = normalizeParam(tripId);
    const sharm = [
      // --- SHARM SEA
      'ras_mohammed_white_island_vip',
      'ras_mohammed_bus_half_day',
      'tiran_island_boat_vip',
      'desert_quad_bike_safari',
      'seascope_semi_submarine',
      'private_boat_vip_king',
      'sina_dream_vip_day',
      'dinner_cruise_night_show',
      'swim_with_dolphins_vip',
      'water_sports_adrenaline_combo',
      'dahab_blue_hole_super_safari',
      'albatros_aqua_park_full_day',
      'dolphin_show_family',

      // --- SHARM DESERT ---
      'super_safari_5_senses',
      'vip_romantic_dinner_desert',
      'vip_cena_romantica',

      // --- SHARM CULTURE ---
      'cairo_bus_adventure_choice',
      'cairo_plane_flexible_museum',
      'luxor_plane_classic',
      'mount_sinai_sunrise_adventure',
      'petra_jordan_expedition',
      'santa_caterina_monastery_morning'
    ];
    const cairo = ['cairo_pyramids_classic', 'cairo_pyramids_by_plane'];
    const luxor = ['luxor_day_trip', 'aswan_day_trip'];
    if (sharm.includes(id)) return 'sharm';
    if (cairo.includes(id)) return 'cairo';
    if (luxor.includes(id)) return 'luxor_and_aswan';
    return '';
  }
  function inferCategory(tripId) {
    const id = normalizeParam(tripId);
    const sea = [
      'ras_mohammed_white_island_vip',
      'ras_mohammed_bus_half_day',
      'tiran_island_boat_vip',
      'seascope_semi_submarine',
      'private_boat_vip_king',
      'sina_dream_vip_day',
      'dinner_cruise_night_show',
      'swim_with_dolphins_vip',
      'water_sports_adrenaline_combo',
      'dahab_blue_hole_super_safari',
      'albatros_aqua_park_full_day',
      'dolphin_show_family'
    ];
    const culture = [
      'cairo_pyramids_classic',
      'cairo_pyramids_by_plane',
      'luxor_day_trip',
      'aswan_day_trip',
      'cairo_bus_adventure_choice',
      'cairo_plane_flexible_museum',
      'luxor_plane_classic',
      'mount_sinai_sunrise_adventure',
      'petra_jordan_expedition',
      'santa_caterina_monastery_morning'
    ];
    const desert = [
      // --- SHARM DESERT ---
      'super_safari_5_senses',
      'vip_romantic_dinner_desert',
      'vip_cena_romantica',
      'desert_quad_bike_safari'
    ];
    if (sea.includes(id)) return 'sea';
    if (culture.includes(id)) return 'culture';
    if (desert.includes(id)) return 'desert';
    return '';
  }
  async function exists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
  function getTripFolder(location, category, tripId) {
    const loc = normalizeParam(location);
    const cat = normalizeParam(category);
    const id = normalizeParam(tripId);
    if (cat) return `assets/images/trips/${loc}/${cat}/${id}/`;
    return `assets/images/trips/${loc}/${id}/`;
  }
  function getPoster(location, category, tripId) {
    return getTripFolder(location, category, tripId) + 'poster.webp';
  }
  async function resolvePosterOrPlaceholder(location, category, tripId) {
    const p = getPoster(location, category, tripId);
    if (await exists(p)) return p;
    const ph = ImagePaths.ui.placeholder;
    if (await exists(ph)) return ph;
    return ImagePaths.ui.fallbackLogo;
  }
  function manifestCount(tripId) {
    const id = normalizeParam(tripId);
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
    if (!Number.isFinite(n) || n <= 0) n = manifestCount(tripId);
    const out = [];
    if (n <= 1) return out;
    for (let i = 1; i <= n - 1; i++) {
      out.push(`${folder}${i}.webp`);
    }
    return out;
  }
  function resolveTripContext(trip) {
    const id = normalizeParam(pickCI(trip, 'trip_id') || pickCI(trip, 'id') || '');
    const explicitLoc = normalizeParam(pickCI(trip, 'location') || pickCI(trip, 'loc') || pickCI(trip, 'city') || '');
    const explicitCat = normalizeParam(pickCI(trip, 'category') || '');
    const loc = explicitLoc || inferLocation(id);
    const cat = explicitCat || inferCategory(id);
    return { location: loc, category: cat, tripId: id };
  }
  const ImagePaths = {
    ui: {
      placeholder: 'assets/images/ui/placeholder.webp',
      fallbackLogo: 'assets/logo-fabio-square.jpg'
    },
    pickCI,
    normalizeParam,
    getTripFolder,
    getPoster,
    resolvePosterOrPlaceholder,
    getGalleryArray,
    resolveTripContext,
    exists
  };
  window.ImagePaths = ImagePaths;
})(); 
