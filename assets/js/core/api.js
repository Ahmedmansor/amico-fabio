

/**
 * 2. دالة الـ Timeout التي نسي Trae تعريفها
 * تقوم بإلغاء الطلب إذا استغرق أكثر من وقت معين
 */
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options; // مهلة 5 ثوانٍ
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}
/**
 * Data Layer (Remote Data Source)
 * Handles fetching and parsing data from Google Sheets CSVs.
 */

const DATA_CONFIG = {
    Trips_Prices: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=0&single=true&output=csv",
    Global_Settings: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=1501122855&single=true&output=csv",
    Trip_Addons: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=468088862&single=true&output=csv",
    Packages: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=457429210&single=true&output=csv"
};

/**
 * Robust CSV Parser
 * Handles quoted fields and commas within quotes.
 * @param {string} csvText 
 * @returns {Array<Object>} Array of objects with keys from the header row.
 */
function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        const next = csvText[i + 1];
        if (ch === '"') {
            if (inQuotes && next === '"') {
                currentField += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && next === '\n') {
                i += 1;
            }
            currentRow.push(currentField);
            currentField = '';
            if (currentRow.length > 0 && currentRow.some(cell => String(cell).trim().length > 0)) {
                rows.push(currentRow);
            }
            currentRow = [];
        } else {
            currentField += ch;
        }
    }
    currentRow.push(currentField);
    if (currentRow.length > 0 && currentRow.some(cell => String(cell).trim().length > 0)) {
        rows.push(currentRow);
    }
    if (rows.length === 0) return [];
    const headers = rows[0].map(h => String(h).trim());
    const dataRows = rows.slice(1);
    const out = [];
    for (let r = 0; r < dataRows.length; r++) {
        const rowArr = dataRows[r];
        const obj = {};
        for (let c = 0; c < headers.length; c++) {
            const key = headers[c];
            const val = rowArr[c] !== undefined ? String(rowArr[c]).replace(/\r?\n/g, ' ').trim() : '';
            obj[key] = val;
        }
        out.push(obj);
    }
    return out;
}

/**
 * Helper to parse a single CSV line, respecting quotes.
 * @param {string} text 
 * @returns {Array<string>}
 */
function parseCSVLine(text) {
    // Deprecated; not used with multi-line aware parser
    return [];
};

function normalizeTripId(id) {
    const map = {
        yacht_white: 'ras_mohammed_white_island_vip',
        ras_mohammed_boat: 'ras_mohammed_white_island_vip',
        ras_mohammed_white_island_vip: 'ras_mohammed_white_island_vip',
        safari_quad: 'desert_quad_bike_safari',
        quad_safari: 'desert_quad_bike_safari',
        cairo_pyramids: 'cairo_pyramids_classic',
        cairo_by_plane: 'cairo_pyramids_by_plane',
        ras_mohammed_bus: 'ras_mohammed_bus_half_day',
        tiran_boat: 'tiran_island_boat_vip',
        tiran_island_boat_vip: 'tiran_island_boat_vip',
        luxor_tour: 'luxor_day_trip',
        aswan_tour: 'aswan_day_trip'
    };
    const k = String(id || '').trim();
    return map.hasOwnProperty(k) ? map[k] : k;
}

function normalizeTrips(trips) {
    if (!Array.isArray(trips)) return [];
    return trips.map(t => {
        const copy = { ...t };
        copy.trip_id = normalizeTripId(copy.trip_id);
        return copy;
    });
}

/**
 * Fetches all data sources and returns a unified object.
 * @returns {Promise<Object>} { trips, settings, addons }
 */
async function fetchAllData() {
    try {
        const cached = sessionStorage.getItem('fabio_trips_cache');
        if (cached) {
            const obj = JSON.parse(cached);
            if (obj && obj.Trips_Prices && obj.Global_Settings && obj.Trip_Addons) {
                if (!obj.Packages) obj.Packages = [];
                return obj;
            }
        }
        console.log("Fetching data with 5s timeout...");
        const [tripsResponse, settingsResponse, addonsResponse, packagesResponse] = await Promise.all([
            fetchWithTimeout(DATA_CONFIG.Trips_Prices),
            fetchWithTimeout(DATA_CONFIG.Global_Settings),
            fetchWithTimeout(DATA_CONFIG.Trip_Addons),
            fetchWithTimeout(DATA_CONFIG.Packages)
        ]);

        if (!tripsResponse.ok || !settingsResponse.ok || !addonsResponse.ok || !packagesResponse.ok) {
            throw new Error("Failed to fetch one or more data sources.");
        }

        const tripsText = await tripsResponse.text();
        const settingsText = await settingsResponse.text();
        const addonsText = await addonsResponse.text();
        const packagesText = await packagesResponse.text();

        const tripsParsed = normalizeTrips(parseCSV(tripsText));
        const packagesRaw = parseCSV(packagesText);
        const packagesMapped = Array.isArray(packagesRaw) ? packagesRaw.map(p => {
            const pkg = { ...p };
            const rawPkgId = String(pkg.package_id || '').trim();
            if (rawPkgId) {
                pkg.package_id = rawPkgId;
                pkg.trip_id = normalizeTripId(rawPkgId);
            }
            const rawIncluded = String(pkg.included_trip_ids || '').trim();
            if (rawIncluded) {
                pkg.included_trip_ids = rawIncluded.split(',').map(x => normalizeTripId(x.trim())).filter(Boolean);
            } else {
                pkg.included_trip_ids = [];
            }
            pkg.type = 'package';
            return pkg;
        }) : [];

        const result = {
            Trips_Prices: tripsParsed,
            Global_Settings: parseCSV(settingsText),
            Trip_Addons: parseCSV(addonsText),
            Packages: packagesMapped
        };
        try {
            sessionStorage.setItem('fabio_trips_cache', JSON.stringify(result));
        } catch (e) { }
        return result;
    } catch (error) {
        console.warn("Data Fetch Failed or Timed Out. Using Dummy Data.", error);
        const cached = sessionStorage.getItem('fabio_trips_cache');
        if (cached) {
            const obj = JSON.parse(cached);
            if (obj && obj.Trips_Prices && obj.Global_Settings && obj.Trip_Addons) {
                if (!obj.Packages) obj.Packages = [];
                return obj;
            }
        }
        return { Trips_Prices: [], Global_Settings: [], Trip_Addons: [], Packages: [] };
    }
}

// Expose to window for global access (simplest approach without modules for now)
window.api = {
    fetchAllData
};
