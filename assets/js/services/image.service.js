/**
 * ImageService - Image Path Resolution Service
 * Handles image path resolution and dynamic image loading
 */
import imagePathsData from '../data/image-paths.json';

export class ImageService {
  static imagePaths = imagePathsData;
  static BASE_PATH = '/';

  /**
   * Get the base path based on current location
   * @returns {string} Base path
   */
  static getBasePath() {
    // Always use absolute paths starting with / for consistency across all directories
    return this.BASE_PATH;
  }

  /**
   * Resolve a path with the correct base
   * @param {string} path - Relative path to resolve
   * @returns {string} Resolved absolute path
   */
  static resolve(path) {
    if (!path) return '';
    
    // Remove leading slash if present to avoid duplication
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return this.getBasePath() + cleanPath;
  }

  /**
   * Get UI image path
   * @param {string} key - UI image key (e.g., 'placeholder', 'headerLogo')
   * @returns {string} Resolved image path
   */
  static getUIImage(key) {
    const path = this.imagePaths.ui?.[key];
    if (!path) {
      console.warn(`UI image key not found: '${key}'`);
      return this.resolve(this.imagePaths.ui?.placeholder || '');
    }
    return this.resolve(path);
  }

  /**
   * Get landing image path
   * @param {string} section - Section name (e.g., 'whoFabio', 'locations')
   * @param {string} key - Image key within the section
   * @returns {string} Resolved image path
   */
  static getLandingImage(section, key) {
    const sectionData = this.imagePaths.landing?.[section];
    
    if (!sectionData) {
      console.warn(`Landing section not found: '${section}'`);
      return '';
    }

    // Handle arrays (like hero images)
    if (Array.isArray(sectionData)) {
      const index = parseInt(key, 10);
      const path = sectionData[index];
      return path ? this.resolve(path) : '';
    }

    // Handle objects
    const path = sectionData[key];
    if (!path) {
      console.warn(`Landing image not found: '${section}.${key}'`);
      return '';
    }

    return this.resolve(path);
  }

  /**
   * Get secrets/commandments image path
   * @param {string} key - Secrets image key
   * @returns {string} Resolved image path
   */
  static getSecretsImage(key) {
    const path = this.imagePaths.secrets?.[key];
    if (!path) {
      console.warn(`Secrets image key not found: '${key}'`);
      return '';
    }
    return this.resolve(path);
  }

  /**
   * Get adventures image path
   * @param {string} key - Adventures image key
   * @returns {string} Resolved image path
   */
  static getAdventuresImage(key) {
    const path = this.imagePaths.adventures?.[key];
    if (!path) {
      console.warn(`Adventures image key not found: '${key}'`);
      return '';
    }
    return this.resolve(path);
  }

  /**
   * Get icon path
   * @param {string} category - Icon category (e.g., 'people', 'legal', 'social')
   * @param {string} key - Icon key within category
   * @returns {string} Resolved icon path
   */
  static getIcon(category, key) {
    if (category === 'close') {
      return this.resolve(this.imagePaths.icons?.closeIcon || '');
    }

    const categoryData = this.imagePaths.icons?.[category];
    if (!categoryData) {
      console.warn(`Icon category not found: '${category}'`);
      return '';
    }

    const path = categoryData[key];
    if (!path) {
      console.warn(`Icon not found: '${category}.${key}'`);
      return '';
    }

    return this.resolve(path);
  }

  /**
   * Build trip folder path
   * @param {string} location - Location (e.g., 'sharm', 'cairo')
   * @param {string} category - Category (e.g., 'sea', 'desert', 'culture')
   * @param {string} tripId - Trip ID
   * @returns {string} Trip folder path
   */
  static getTripFolder(location, category, tripId) {
    const loc = this.normalizeParam(location);
    const cat = this.normalizeParam(category);
    const id = this.normalizeParam(tripId);

    // Standard path: assets/images/trips/sharm/sea/trip_id/
    if (cat) {
      return this.resolve(`assets/images/trips/${loc}/${cat}/${id}/`);
    }
    return this.resolve(`assets/images/trips/${loc}/${id}/`);
  }

  /**
   * Get trip poster image
   * @param {string} location - Location
   * @param {string} category - Category
   * @param {string} tripId - Trip ID
   * @returns {string} Poster image path
   */
  static getPoster(location, category, tripId) {
    return this.getTripFolder(location, category, tripId) + 'poster.webp';
  }

  /**
   * Get trip gallery images array
   * @param {string} location - Location
   * @param {string} category - Category
   * @param {string} tripId - Trip ID
   * @param {number} totalCount - Total number of images
   * @returns {string[]} Array of gallery image paths
   */
  static getGalleryArray(location, category, tripId, totalCount) {
    const folder = this.getTripFolder(location, category, tripId);
    let count = parseInt(totalCount || '0', 10);

    // If count not provided, try to get from metadata
    if (!Number.isFinite(count) || count <= 0) {
      count = this.getImageCountFromMetadata(tripId);
    }

    const gallery = [];
    if (count <= 1) return gallery;

    // Gallery images start from 1.webp
    for (let i = 1; i <= count - 1; i++) {
      gallery.push(`${folder}${i}.webp`);
    }

    return gallery;
  }

  /**
   * Get image count from metadata (if available)
   * @param {string} tripId - Trip ID
   * @returns {number} Image count
   */
  static getImageCountFromMetadata(tripId) {
    // This will be loaded from trips-metadata.json
    // For now, return default
    return 1;
  }

  /**
   * Resolve trip context from trip object
   * @param {Object} trip - Trip object
   * @returns {Object} Context with location, category, and tripId
   */
  static resolveTripContext(trip) {
    const id = this.normalizeParam(
      this.pickCI(trip, 'trip_id') || 
      this.pickCI(trip, 'id') || 
      this.pickCI(trip, 'package_id') || 
      ''
    );
    
    const explicitLoc = this.normalizeParam(
      this.pickCI(trip, 'location') || 
      this.pickCI(trip, 'loc') || 
      this.pickCI(trip, 'city') || 
      ''
    );
    
    const explicitCat = this.normalizeParam(
      this.pickCI(trip, 'category') || 
      ''
    );

    // If not explicitly present, infer from ID
    const location = explicitLoc || this.inferLocation(id);
    const category = explicitCat || this.inferCategory(id);

    return { location, category, tripId: id };
  }

  /**
   * Infer location from trip ID
   * @param {string} tripId - Trip ID
   * @returns {string} Inferred location
   */
  static inferLocation(tripId) {
    const id = this.normalizeParam(tripId);

    const sharmTrips = [
      'ras_mohammed', 'tiran', 'seascope', 'private_boat', 'sina_dream',
      'dinner_cruise', 'swim_with_dolphins', 'water_sports', 'dahab', 
      'albatros', 'dolphin_show', 'super_safari', 'moto_safari', 
      'vip_cena_romantica', 'sharm_old_market', 'mount_sinai', 
      'santa_caterina', 'cairo_bus', 'cairo_plane', 'petra', 
      'luxor_plane', 'sharm_confidential', 'dolce_vita', 'mille_e_una_notte',
      'indiana_jones', 'il_grande_blu'
    ];

    const cairoTrips = ['cairo_pyramids'];
    const luxorTrips = ['luxor_day_trip', 'aswan_day_trip', 'luxor_and_aswan'];

    if (sharmTrips.some(k => id.includes(k)) || id.includes('sharm')) {
      return 'sharm';
    }
    if (cairoTrips.some(k => id.includes(k)) || id.includes('cairo')) {
      return 'cairo';
    }
    if (luxorTrips.some(k => id.includes(k)) || id.includes('luxor')) {
      return 'luxor_aswan';
    }

    return 'sharm'; // Default fallback
  }

  /**
   * Infer category from trip ID
   * @param {string} tripId - Trip ID
   * @returns {string} Inferred category
   */
  static inferCategory(tripId) {
    const id = this.normalizeParam(tripId);

    const explicitDesert = ['vip_cena_romantica'];
    const explicitCulture = ['sharm_old_market', 'mount_sinai', 'santa_caterina'];
    
    if (explicitDesert.some(k => id === k)) return 'desert';
    if (explicitCulture.some(k => id === k)) return 'culture';

    const seaKeywords = ['ras', 'mohammed', 'tiran', 'boat', 'dolphin', 'sea', 
                         'water', 'aqua', 'cruise', 'sub', 'dahab', 'blue_hole'];
    const desertKeywords = ['safari', 'quad', 'bike', 'dinner', 'bedouin', 
                            'mountain', 'camel', 'sinai', 'caterina', 'romantica', 'cena'];
    const cultureKeywords = ['cairo', 'luxor', 'aswan', 'petra', 'museum', 
                             'pyramids', 'market', 'shopping', 'old_market', 'bazaar', 'souq'];
    const bundlesKeywords = ['confidential', 'package', 'bundle', 'offer', 
                             'dolce_vita', 'mille_e_una_notte', 'indiana_jones', 'il_grande_blu'];

    if (bundlesKeywords.some(k => id.includes(k))) return 'bundles';
    if (seaKeywords.some(k => id.includes(k))) return 'sea';
    if (cultureKeywords.some(k => id.includes(k))) return 'culture';
    if (desertKeywords.some(k => id.includes(k))) return 'desert';

    return 'sea'; // Default fallback
  }

  /**
   * Normalize parameter (lowercase, trim)
   * @param {any} value - Value to normalize
   * @returns {string} Normalized string
   */
  static normalizeParam(value) {
    return String(value || '').trim().toLowerCase();
  }

  /**
   * Pick value from object (case-insensitive)
   * @param {Object} obj - Object to search
   * @param {string} name - Key name
   * @returns {any} Found value or empty string
   */
  static pickCI(obj, name) {
    if (!obj || typeof obj !== 'object') return '';
    
    const key = Object.keys(obj).find(k => 
      k.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    return key ? obj[key] : '';
  }

  /**
   * Check if a file exists (async)
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} True if file exists
   */
  static async exists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all image paths data
   * @returns {Object} All image paths
   */
  static getAll() {
    return this.imagePaths;
  }
}
