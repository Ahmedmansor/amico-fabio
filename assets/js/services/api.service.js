/**
 * ApiService - Data Fetching Service
 * Handles fetching and parsing data from Google Sheets CSVs
 */
export class ApiService {
  static DATA_CONFIG = {
    Trips_Prices: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=0&single=true&output=csv",
    Global_Settings: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=1501122855&single=true&output=csv",
    Trip_Addons: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=468088862&single=true&output=csv",
    Packages: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvcO6TH0o6KOqLY6vy-jp-ZcBEeLq_dGmAzmcOCWUeIOSfOAJLPJAFa1D80a4Bv-XVLbdYOJxclEwj/pub?gid=457429210&single=true&output=csv"
  };

  static CACHE_KEY = 'fabio_trips_cache';
  static DEFAULT_TIMEOUT = 5000; // 5 seconds

  /**
   * Fetch with timeout support
   * @param {string} resource - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  static async fetchWithTimeout(resource, options = {}) {
    const { timeout = this.DEFAULT_TIMEOUT } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  /**
   * Robust CSV Parser
   * Handles quoted fields and commas within quotes
   * @param {string} csvText - CSV text to parse
   * @returns {Array<Object>} Array of objects with keys from header row
   */
  static parseCSV(csvText) {
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
    const result = [];

    for (let r = 0; r < dataRows.length; r++) {
      const rowArr = dataRows[r];
      const obj = {};
      
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c];
        const val = rowArr[c] !== undefined 
          ? String(rowArr[c]).replace(/\r?\n/g, ' ').trim() 
          : '';
        obj[key] = val;
      }
      
      result.push(obj);
    }

    return result;
  }

  /**
   * Normalize trip ID (handle aliases)
   * @param {string} id - Trip ID to normalize
   * @returns {string} Normalized trip ID
   */
  static normalizeTripId(id) {
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

    const key = String(id || '').trim();
    return map.hasOwnProperty(key) ? map[key] : key;
  }

  /**
   * Normalize trips array
   * @param {Array} trips - Array of trip objects
   * @returns {Array} Normalized trips
   */
  static normalizeTrips(trips) {
    if (!Array.isArray(trips)) return [];
    
    return trips.map(trip => {
      const normalized = { ...trip };
      normalized.trip_id = this.normalizeTripId(normalized.trip_id);
      return normalized;
    });
  }

  /**
   * Normalize packages array
   * @param {Array} packages - Array of package objects
   * @returns {Array} Normalized packages
   */
  static normalizePackages(packages) {
    if (!Array.isArray(packages)) return [];

    return packages.map(pkg => {
      const normalized = { ...pkg };
      const rawPkgId = String(normalized.package_id || '').trim();
      
      if (rawPkgId) {
        normalized.package_id = rawPkgId;
        normalized.trip_id = this.normalizeTripId(rawPkgId);
      }

      const rawIncluded = String(normalized.included_trip_ids || '').trim();
      if (rawIncluded) {
        normalized.included_trip_ids = rawIncluded
          .split(',')
          .map(x => this.normalizeTripId(x.trim()))
          .filter(Boolean);
      } else {
        normalized.included_trip_ids = [];
      }

      normalized.type = 'package';
      return normalized;
    });
  }

  /**
   * Get cached data from sessionStorage
   * @returns {Object|null} Cached data or null
   */
  static getCachedData() {
    try {
      const cached = sessionStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const obj = JSON.parse(cached);
        if (obj && obj.Trips_Prices && obj.Global_Settings && obj.Trip_Addons) {
          if (!obj.Packages) obj.Packages = [];
          return obj;
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }
    return null;
  }

  /**
   * Set cached data to sessionStorage
   * @param {Object} data - Data to cache
   */
  static setCachedData(data) {
    try {
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error setting cache:', error);
    }
  }

  /**
   * Clear cached data
   */
  static clearCache() {
    try {
      sessionStorage.removeItem(this.CACHE_KEY);
      console.log('Cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Fetch all data sources and return unified object
   * @param {boolean} forceRefresh - Force refresh from server (skip cache)
   * @returns {Promise<Object>} { Trips_Prices, Global_Settings, Trip_Addons, Packages }
   */
  static async fetchAllData(forceRefresh = false) {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = this.getCachedData();
        if (cached) {
          console.log('✓ Using cached data');
          return cached;
        }
      }

      console.log('Fetching data from Google Sheets...');

      // Fetch all data sources in parallel
      const [tripsResponse, settingsResponse, addonsResponse, packagesResponse] = await Promise.all([
        this.fetchWithTimeout(this.DATA_CONFIG.Trips_Prices),
        this.fetchWithTimeout(this.DATA_CONFIG.Global_Settings),
        this.fetchWithTimeout(this.DATA_CONFIG.Trip_Addons),
        this.fetchWithTimeout(this.DATA_CONFIG.Packages)
      ]);

      // Check if all responses are OK
      if (!tripsResponse.ok || !settingsResponse.ok || !addonsResponse.ok || !packagesResponse.ok) {
        throw new Error('Failed to fetch one or more data sources');
      }

      // Parse CSV responses
      const tripsText = await tripsResponse.text();
      const settingsText = await settingsResponse.text();
      const addonsText = await addonsResponse.text();
      const packagesText = await packagesResponse.text();

      const tripsParsed = this.normalizeTrips(this.parseCSV(tripsText));
      const packagesParsed = this.normalizePackages(this.parseCSV(packagesText));

      const result = {
        Trips_Prices: tripsParsed,
        Global_Settings: this.parseCSV(settingsText),
        Trip_Addons: this.parseCSV(addonsText),
        Packages: packagesParsed
      };

      // Cache the result
      this.setCachedData(result);
      console.log('✓ Data fetched and cached successfully');

      return result;
    } catch (error) {
      console.warn('Data fetch failed or timed out:', error);

      // Try to use cached data as fallback
      const cached = this.getCachedData();
      if (cached) {
        console.log('Using cached data as fallback');
        return cached;
      }

      // Return empty data structure as last resort
      console.warn('No cached data available, returning empty data');
      return {
        Trips_Prices: [],
        Global_Settings: [],
        Trip_Addons: [],
        Packages: []
      };
    }
  }

  /**
   * Fetch only trips data
   * @returns {Promise<Array>} Array of trips
   */
  static async fetchTrips() {
    const data = await this.fetchAllData();
    return data.Trips_Prices || [];
  }

  /**
   * Fetch only packages data
   * @returns {Promise<Array>} Array of packages
   */
  static async fetchPackages() {
    const data = await this.fetchAllData();
    return data.Packages || [];
  }

  /**
   * Fetch only settings data
   * @returns {Promise<Array>} Array of settings
   */
  static async fetchSettings() {
    const data = await this.fetchAllData();
    return data.Global_Settings || [];
  }

  /**
   * Fetch only addons data
   * @returns {Promise<Array>} Array of addons
   */
  static async fetchAddons() {
    const data = await this.fetchAllData();
    return data.Trip_Addons || [];
  }
}
