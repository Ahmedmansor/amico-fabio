const PackagesModel = {
  state: {
    packageId: "",
    apiData: null,
    langData: null,
    lang: "it",
    allTrips: [],
    includedTrips: [],
    intervals: []
  },

  getLang: () => {
    const stored = localStorage.getItem("fabio_lang");
    const htmlLang = document.documentElement.lang;
    return stored || htmlLang || "it";
  },

  getI18n: (lang) => {
    if (lang === "en") return window.i18nEn || {};
    return window.i18nIt || {};
  },

  findPackageById: (packagesList, pkgId) => {
    if (!Array.isArray(packagesList)) return null;
    const q = String(pkgId || "").trim();
    return (
      packagesList.find((p) => {
        const pid = String(p.package_id || "").trim();
        const tid = String(p.trip_id || "").trim();
        return pid === q || tid === q;
      }) || null
    );
  },

  setStateFromData: (pkg, tripsList, langData, lang) => {
    const tripKey = pkg ? pkg.trip_id || pkg.package_id || "" : "";
    PackagesModel.state.packageId = tripKey;
    PackagesModel.state.apiData = pkg || null;
    PackagesModel.state.langData = langData || null;
    PackagesModel.state.lang = lang || "it";
    PackagesModel.state.allTrips = Array.isArray(tripsList) ? tripsList : [];
  },

  setIncludedTrips: (items) => {
    PackagesModel.state.includedTrips = Array.isArray(items) ? items : [];
  },

  clearIntervals: () => {
    if (Array.isArray(PackagesModel.state.intervals)) {
      PackagesModel.state.intervals.forEach((id) => {
        clearInterval(id);
      });
    }
    PackagesModel.state.intervals = [];
  },

  addInterval: (id) => {
    PackagesModel.state.intervals.push(id);
  },

  prepareIncludedTripItems: (ids, allTrips, langDict) => {
    const tripsDict = (langDict && langDict.trips) || {};
    const items = [];
    if (!Array.isArray(ids)) return items;
    ids.forEach((id) => {
      const tid = String(id || "").trim();
      if (!tid) return;
      const apiTrip = Array.isArray(allTrips)
        ? allTrips.find((t) => String(t.trip_id || "").trim() === tid)
        : null;
      const langTrip = tripsDict[tid] || null;
      if (!apiTrip && !langTrip) return;
      items.push({ id: tid, apiTrip, langTrip });
    });
    return items;
  }
};

window.PackagesModel = PackagesModel;

