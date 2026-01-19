const PackagesService = {
  loadAll: async () => {
    if (!window.api || typeof window.api.fetchAllData !== "function") return null;
    const data = await window.api.fetchAllData();
    const packagesList = Array.isArray(data.Packages) ? data.Packages : [];
    const tripsList = Array.isArray(data.Trips_Prices) ? data.Trips_Prices : [];
    const addonsList = Array.isArray(data.Trip_Addons) ? data.Trip_Addons : [];
    return { packagesList, tripsList, addonsList };
  }
};

window.PackagesService = PackagesService;

