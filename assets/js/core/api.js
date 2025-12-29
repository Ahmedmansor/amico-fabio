// 1. تعريف البيانات التجريبية (Fallback) لضمان عدم ظهور صفحة بيضاء
const DUMMY_DATA = {
    Trips_Prices: [
        { trip_id: "yacht_white", p_adult: "35", badge_en: "Top 🔥", badge_it: "Top 🔥", is_active: "TRUE", featured: "TRUE" },
        { trip_id: "safari_quad", p_adult: "25", badge_en: "Popular", badge_it: "Popolare", is_active: "TRUE", featured: "TRUE" },
        { trip_id: "cairo_pyramids", p_adult: "100", badge_en: "Must See", badge_it: "Imperdibile", is_active: "TRUE", featured: "TRUE" }
    ],
    Global_Settings: [
        { key: "promo_banner", val_it: "Offerta Speciale!", val_en: "Special Offer!", is_active: "TRUE" }
    ],
    Trip_Addons: []
};

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
    Trip_Addons: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=468088862&single=true&output=csv"
};

/**
 * Robust CSV Parser
 * Handles quoted fields and commas within quotes.
 * @param {string} csvText 
 * @returns {Array<Object>} Array of objects with keys from the header row.
 */
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = parseCSVLine(lines[i]);
        if (currentLine.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = currentLine[index].trim();
            });
            data.push(row);
        }
    }
    return data;
}

/**
 * Helper to parse a single CSV line, respecting quotes.
 * @param {string} text 
 * @returns {Array<string>}
 */
function parseCSVLine(text) {
    const result = [];
    let start = 0;
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            let field = text.substring(start, i);
            // Remove surrounding quotes if present
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.substring(1, field.length - 1);
            }
            result.push(field.replace(/""/g, '"')); // Handle escaped quotes
            start = i + 1;
        }
    }

    // Add the last field
    let lastField = text.substring(start);
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.substring(1, lastField.length - 1);
    }
    result.push(lastField.replace(/""/g, '"'));

    return result;
}

/**
 * Fetches all data sources and returns a unified object.
 * @returns {Promise<Object>} { trips, settings, addons }
 */
async function fetchAllData() {
    try {
        console.log("Fetching data with 5s timeout...");
        const [tripsResponse, settingsResponse, addonsResponse] = await Promise.all([
            fetchWithTimeout(DATA_CONFIG.Trips_Prices),
            fetchWithTimeout(DATA_CONFIG.Global_Settings),
            fetchWithTimeout(DATA_CONFIG.Trip_Addons)
        ]);

        if (!tripsResponse.ok || !settingsResponse.ok || !addonsResponse.ok) {
            throw new Error("Failed to fetch one or more data sources.");
        }

        const tripsText = await tripsResponse.text();
        const settingsText = await settingsResponse.text();
        const addonsText = await addonsResponse.text();

        return {
            Trips_Prices: parseCSV(tripsText),
            Global_Settings: parseCSV(settingsText),
            Trip_Addons: parseCSV(addonsText)
        };
    } catch (error) {
        console.warn("Data Fetch Failed or Timed Out. Using Dummy Data.", error);
        // Return dummy data immediately so UI renders
        return DUMMY_DATA;
    }
}

// Expose to window for global access (simplest approach without modules for now)
window.api = {
    fetchAllData,
    DUMMY_DATA
};
