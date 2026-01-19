const PackagesController = {
  init: async () => {
    const params = new URLSearchParams(window.location.search);
    const pkgId = params.get("id");
    if (!pkgId) {
      window.location.href = "index.html";
      return;
    }
    const lang = PackagesModel.getLang();
    const i18n = PackagesModel.getI18n(lang);
    if (!window.PackagesService || typeof window.PackagesService.loadAll !== "function") {
      PackagesView.renderNotFound(i18n, lang);
      return;
    }
    try {
      const data = await window.PackagesService.loadAll();
      if (!data) {
        PackagesView.renderNotFound(i18n, lang);
        return;
      }
      const pkg = PackagesModel.findPackageById(data.packagesList, pkgId);
      if (!pkg) {
        PackagesView.renderNotFound(i18n, lang);
        return;
      }
      const tripKey = pkg.trip_id || pkg.package_id;
      const langTrips = i18n.trips || {};
      const langData = langTrips[tripKey] || null;
      PackagesModel.setStateFromData(pkg, data.tripsList, langData, lang);
      PackagesView.renderPackageShell(PackagesModel.state, i18n);
      const addonsList = Array.isArray(data.addonsList)
        ? data.addonsList.filter((x) => String(x.trip_id || "") === tripKey)
        : [];
      if (window.BookingManager && typeof window.BookingManager.init === "function") {
        window.BookingManager.init(tripKey, pkg, langData, addonsList);
      }
      PackagesView.setupStickyBar();
      PackagesView.renderIncludedTrips(pkg, PackagesModel.state.allTrips, i18n);
    } catch (e) {
      PackagesView.renderNotFound(i18n, lang);
    }
  }
};

window.PackagesController = PackagesController;

window.addEventListener("langChanged", () => {
  if (window.PackagesController && typeof window.PackagesController.init === "function") {
    window.PackagesController.init();
  }
});

