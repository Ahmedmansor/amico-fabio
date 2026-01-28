const PackagesView = {
  state: {
    modalAutoTimer: null,
    modalAutoList: [],
    modalAutoIndex: 0
  },

  applyHeroImage: (imgEl, src) => {
    if (!imgEl || !src) return;
    imgEl.classList.remove("hero-img-animate");
    void imgEl.offsetWidth;
    imgEl.src = src;
    imgEl.classList.add("hero-img-animate");
  },

  startAutoModalHero: (slides, imgEl, startIndex = 0) => {
    if (!imgEl || !Array.isArray(slides) || slides.length < 2) return;
    if (PackagesView.state.modalAutoTimer) {
      clearInterval(PackagesView.state.modalAutoTimer);
      PackagesView.state.modalAutoTimer = null;
    }
    PackagesView.state.modalAutoList = slides.slice();
    PackagesView.state.modalAutoIndex = Math.max(
      0,
      Math.min(startIndex, slides.length - 1)
    );
    PackagesView.state.modalAutoTimer = setInterval(() => {
      const list = PackagesView.state.modalAutoList || [];
      if (!list.length) return;
      const next = (PackagesView.state.modalAutoIndex + 1) % list.length;
      PackagesView.state.modalAutoIndex = next;
      PackagesView.applyHeroImage(imgEl, list[next]);
    }, 2000);
  },

  setModalHeroImage: (imgEl, src) => {
    if (!imgEl || !src) return;
    PackagesView.applyHeroImage(imgEl, src);
    const list = PackagesView.state.modalAutoList || [];
    if (list.length) {
      const idx = list.indexOf(src);
      PackagesView.startAutoModalHero(list, imgEl, idx >= 0 ? idx : 0);
    }
  },
  renderNotFound: (i18n, lang) => {
    const dict = i18n.global || {};
    const msg =
      typeof dict.experience_not_found === "string"
        ? dict.experience_not_found
        : lang === "en"
          ? "Package not found."
          : "Pacchetto non trovato.";
    const main = document.querySelector("main");
    if (main) {
      main.innerHTML =
        '<div class="h-screen flex items-center justify-center text-white"><h1 class="text-3xl font-playfair text-gold" data-i18n="global.experience_not_found">' +
        msg +
        "</h1></div>";
    }
  },

  renderPackageShell: (state, langDict) => {
    const apiData = state.apiData;
    const langData = state.langData;
    const tripId = state.packageId;
    const lang = state.lang;
    const dict =
      langDict || (lang === "en" ? window.i18nEn || {} : window.i18nIt || {});
    const globalDict = dict.global || {};
    PackagesView.setupSEO(langData, tripId);
    const isPackage =
      String((apiData && apiData.type) || "package").toLowerCase() ===
      "package";
    const images = PackagesView.resolvePackageImages(
      apiData,
      tripId,
      isPackage
    );
    PackagesView.setupHero(images.posterSrc, images.ctx, isPackage, tripId);
    PackagesView.renderBasicDetails(langData, apiData, globalDict, tripId);
    PackagesView.renderMainPrice(apiData, globalDict);
    PackagesView.setupGallery(apiData, images, tripId);
  },

  setupSEO: (langData, tripId) => {
    const title = (langData && langData.title) || tripId;
    document.title = "Fabio Tours | " + title;
    const metaDesc =
      document.querySelector('meta[name="description"]') ||
      (function () {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    const descText =
      (langData && (langData.short_desc || langData.full_description)) || "";
    const cleanDesc =
      typeof descText === "string"
        ? descText.replace(/\s+/g, " ").trim().slice(0, 200)
        : "";
    metaDesc.setAttribute("content", cleanDesc);
    const metaKeywords =
      document.querySelector('meta[name="keywords"]') ||
      (function () {
        const m = document.createElement("meta");
        m.setAttribute("name", "keywords");
        document.head.appendChild(m);
        return m;
      })();
    const tags = Array.isArray(langData && langData.seo_tags)
      ? langData.seo_tags
      : [];
    metaKeywords.setAttribute("content", tags.join(", "));
  },

  resolvePackageImages: (apiData, tripId, isPackage) => {
    let ctx = { location: "", category: "", tripId };
    let posterSrc = "";
    if (isPackage) {
      const locRaw =
        (apiData && (apiData.location || apiData.category || "sharm")) ||
        "sharm";
      const loc = String(locRaw).toLowerCase().trim();
      posterSrc = window.ImagePaths && typeof window.ImagePaths.getPackagePoster === 'function'
        ? window.ImagePaths.getPackagePoster(loc, tripId)
        : "assets/images/packages/" + loc + "/" + tripId + "/poster.webp";
    } else {
      ctx = window.ImagePaths
        ? window.ImagePaths.resolveTripContext({
          trip_id: tripId,
          ...(apiData || {})
        })
        : { location: "", category: "", tripId };
      posterSrc = window.ImagePaths
        ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId)
        : "assets/images/trips/" + tripId + "/poster.webp";
    }
    return { posterSrc, ctx };
  },

  setupHero: (posterSrc, ctx, isPackage, tripId) => {
    const bgEl = document.getElementById("hero-bg-img");
    const fallbackSrc = window.ImagePaths
      ? window.ImagePaths.ui.fallbackLogo
      : "assets/images/logo/logo-fabio-square.webp";
    if (bgEl) {
      bgEl.src = posterSrc;
      bgEl.classList.add("hero-img-animate");
      if (
        !isPackage &&
        window.ImagePaths &&
        typeof window.ImagePaths.resolvePosterOrPlaceholder === "function"
      ) {
        window.ImagePaths
          .resolvePosterOrPlaceholder(ctx.location, ctx.category, tripId)
          .then((src) => {
            bgEl.src = src;
            bgEl.classList.add("hero-img-animate");
          });
      } else {
        const imgTest = new Image();
        imgTest.src = posterSrc;
        imgTest.onerror = () => {
          bgEl.src = fallbackSrc;
          bgEl.classList.add("hero-img-animate");
        };
      }
    }
  },

  renderBasicDetails: (langData, apiData, globalDict, titleFallback) => {
    const els = {
      title: document.getElementById("detail-title"),
      badge: document.getElementById("detail-badge"),
      duration: document.getElementById("detail-duration"),
      desc: document.getElementById("detail-desc"),
      fullDesc: document.getElementById("detail-full-desc"),
      important: document.getElementById("detail-important"),
      highlights: document.getElementById("detail-highlights"),
      includes: document.getElementById("detail-includes"),
      excludes: document.getElementById("detail-excludes"),
      program: document.getElementById("detail-program")
    };
    const title = (langData && langData.title) || titleFallback;
    if (els.title) els.title.textContent = title;
    const badgesDict = globalDict.badges || {};
    let badgeText = "";
    if (apiData && apiData.badge_key) {
      const rawKey = String(apiData.badge_key).trim();
      badgeText =
        badgesDict[rawKey] ||
        badgesDict[rawKey.toUpperCase()] ||
        badgesDict[rawKey.toLowerCase()] ||
        "";
    }
    if (els.badge) {
      els.badge.textContent = badgeText;
      els.badge.style.display = badgeText ? "inline-block" : "none";
    }
    if (langData) {
      const daily =
        typeof globalDict.daily === "string" ? globalDict.daily : "";
      if (els.duration) els.duration.textContent = langData.duration || daily;
      if (els.desc) els.desc.innerHTML = langData.short_desc || "";
      if (els.fullDesc)
        els.fullDesc.innerHTML = langData.full_description || "";
      if (els.important)
        els.important.textContent = langData.important_notes || "";
      PackagesView.renderList(els.highlights, langData.highlights);
      PackagesView.renderList(els.includes, langData.includes, true);
      PackagesView.renderList(els.excludes, langData.not_included, true);
      if (els.program && langData.program) {
        PackagesView.renderProgram(els.program, langData.program);
      }
    }
  },

  renderMainPrice: (apiData, globalDict) => {
    const pAdult = apiData ? parseFloat(apiData.p_adult || "0") : 0;
    const dAdult = apiData ? parseFloat(apiData.d_adult || "0") : 0;
    const pChild = apiData ? parseFloat(apiData.p_child || "0") : 0;
    const dChild = apiData ? parseFloat(apiData.d_child || "0") : 0;
    const minPax = apiData ? parseInt(apiData.min_pax || "1", 10) : 1;
    const priceEl = document.getElementById("detail-price");
    const iconMarkup = (key, fallback) => {
      const icons =
        window.ImagePaths &&
          window.ImagePaths.icons &&
          window.ImagePaths.icons.people
          ? window.ImagePaths.icons.people
          : null;
      const src = icons && icons[key] ? icons[key] : "";
      return src
        ? '<img src="' + src + '" alt="" class="price-icon-img">'
        : '<span class="price-icon">' + fallback + "</span>";
    };
    const adultHero =
      dAdult > 0
        ? '<span class="inline-flex items-center gap-2">' +
        iconMarkup("personMale", "👤") +
        '<span class="line-through text-gray-400">€' +
        pAdult +
        '</span><span class="text-gold font-bold">€' +
        dAdult +
        "</span></span>"
        : '<span class="inline-flex items-center gap-2">' +
        iconMarkup("personMale", "👤") +
        '<span class="text-gold font-bold">€' +
        pAdult +
        "</span></span>";
    if (priceEl) priceEl.innerHTML = adultHero;
    const headlinePrice = dAdult > 0 ? dAdult : pAdult;
    const cardPriceEl = document.getElementById("card-price");
    if (cardPriceEl) cardPriceEl.textContent = "€" + headlinePrice;
    const totalEl = document.getElementById("live-total-price");
    if (totalEl) totalEl.textContent = "€" + headlinePrice;
    const breakdownEl = document.getElementById("card-price-breakdown");
    if (breakdownEl) {
      const pricingDict = globalDict.pricing || {};
      const lblMinPax = pricingDict.min_pax || "Min Pax";
      const adultRow =
        dAdult > 0
          ? '<div class="flex items-center gap-2">' +
          iconMarkup("personMale", "👤") +
          '<span class="line-through text-gray-400">€' +
          pAdult +
          '</span><span class="text-white font-bold">€' +
          dAdult +
          "</span></div>"
          : '<div class="flex items-center gap-2">' +
          iconMarkup("personMale", "👤") +
          '<span class="text-white font-bold">€' +
          pAdult +
          "</span></div>";
      const childRow =
        dChild > 0 || pChild > 0
          ? dChild > 0
            ? '<div class="flex items-center gap-2">' +
            iconMarkup("child", "👶") +
            '<span class="line-through text-gray-400">€' +
            pChild +
            '</span><span class="text-white font-bold">€' +
            dChild +
            "</span></div>"
            : '<div class="flex items-center gap-2">' +
            iconMarkup("child", "👶") +
            '<span class="text-white font-bold">€' +
            pChild +
            "</span></div>"
          : "";
      const minPaxRow =
        '<div class="flex items-center gap-2">' +
        iconMarkup("persons", "👥") +
        '<span class="text-gray-300">' +
        lblMinPax +
        ": " +
        minPax +
        "</span></div>";
      breakdownEl.innerHTML = adultRow + childRow + minPaxRow;
    }
  },

  setupGallery: (apiData, imagesData, tripId) => {
    const galleryEl = document.getElementById("gallery-grid");
    const bgEl = document.getElementById("hero-bg-img");
    if (!galleryEl || galleryEl.children.length > 0) return;
    const ctx = imagesData.ctx;
    const posterSrc = imagesData.posterSrc;
    const totalRaw =
      window.ImagePaths && typeof window.ImagePaths.pickCI === "function"
        ? window.ImagePaths.pickCI(apiData || {}, "img_count")
        : "";
    const total = parseInt(totalRaw || "0", 10);
    const list =
      window.ImagePaths &&
        typeof window.ImagePaths.getGalleryArray === "function"
        ? window.ImagePaths.getGalleryArray(
          ctx.location,
          ctx.category,
          tripId,
          total
        )
        : [];
    PackagesView.createGalleryThumb(
      posterSrc,
      galleryEl,
      bgEl,
      "w-32 h-32 md:w-40 md:h-40"
    );
    if (Array.isArray(list) && list.length > 0) {
      list.forEach((src) => {
        PackagesView.createGalleryThumb(
          src,
          galleryEl,
          bgEl,
          "w-32 h-32 md:w-40 md:h-40"
        );
      });
    }
  },

  setupStickyBar: () => {
    const stickyMobile = document.getElementById("sticky-mobile-book");
    if (stickyMobile) {
      setTimeout(() => {
        stickyMobile.classList.remove("translate-y-32");
      }, 200);
      PackagesView.setupStickyBehavior();
    }
  },

  renderIncludedTrips: (apiData, allTrips, langDict) => {
    PackagesView.clearIncludedTrips();
    const grid = document.getElementById("included-trips-grid");
    const subtitleEl = document.getElementById("included-trips-subtitle");
    if (!grid) return;
    const ids = Array.isArray(apiData && apiData.included_trip_ids)
      ? apiData.included_trip_ids
      : [];
    if (!ids.length) {
      if (subtitleEl) subtitleEl.textContent = "";
      return;
    }
    PackagesView.setIncludedTripsSubtitle(subtitleEl, langDict);
    const items = PackagesModel.prepareIncludedTripItems(
      ids,
      allTrips,
      langDict
    );
    PackagesModel.setIncludedTrips(items);
    const frag = document.createDocumentFragment();
    const globalDict = langDict.global || {};
    items.forEach((item) => {
      PackagesView.renderIncludedTripCard(item, frag, globalDict);
    });
    grid.appendChild(frag);
  },

  clearIncludedTrips: () => {
    PackagesModel.clearIntervals();
    const grid = document.getElementById("included-trips-grid");
    if (grid) grid.innerHTML = "";
  },

  setIncludedTripsSubtitle: (el, langDict) => {
    if (!el) return;
    const lang = PackagesModel.state.lang;
    const defaultText =
      lang === "en"
        ? "Each experience in this bundle can be explored in detail below."
        : "Ogni esperienza inclusa in questo pacchetto può essere esplorata in dettaglio qui sotto.";
    el.textContent = defaultText;
  },

  renderIncludedTripCard: (item, container, globalDict) => {
    const title = (item.langTrip && item.langTrip.title) || item.id;
    const desc = (item.langTrip && item.langTrip.short_desc) || "";
    const dur =
      (item.langTrip && item.langTrip.duration) || globalDict.daily || "";
    const images = PackagesView.getImagesForTrip(item.id, item.apiTrip);
    const uniqueImages = [...new Set(images)].filter(Boolean);
    const imgId = "trip-img-" + item.id;
    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "text-left bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gold hover:shadow-lg transition flex gap-4 group overflow-hidden";
    card.setAttribute("data-trip-id", item.id);
    card.innerHTML =
      '<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">' +
      '<img id="' +
      imgId +
      '" src="' +
      uniqueImages[0] +
      '" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" loading="lazy" alt="' +
      title +
      '">' +
      "</div>" +
      '<div class="flex flex-col gap-1 flex-1 min-w-0 justify-center">' +
      '<h4 class="text-white font-semibold text-sm md:text-base truncate pr-2 group-hover:text-gold transition-colors">' +
      title +
      "</h4>" +
      '<p class="text-gold text-xs font-bold uppercase tracking-wider">' +
      dur +
      "</p>" +
      '<p class="text-gray-400 text-xs line-clamp-2 leading-relaxed">' +
      desc +
      "</p>" +
      "</div>";
    card.addEventListener("click", () => {
      PackagesView.openIncludedTripModal(item);
    });
    container.appendChild(card);
    PackagesView.setupSlideshow(uniqueImages, imgId);
  },

  getImagesForTrip: (tripId, apiTrip) => {
    const ctx = window.ImagePaths
      ? window.ImagePaths.resolveTripContext({
        trip_id: tripId,
        ...(apiTrip || {})
      })
      : { location: "", category: "", tripId };
    const posterSrc = window.ImagePaths
      ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId)
      : "assets/images/trips/" + tripId + "/poster.webp";
    const totalRaw =
      window.ImagePaths && typeof window.ImagePaths.pickCI === "function"
        ? window.ImagePaths.pickCI(apiTrip || {}, "img_count")
        : "";
    const total = parseInt(totalRaw || "0", 10);
    const gallery =
      window.ImagePaths &&
        typeof window.ImagePaths.getGalleryArray === "function"
        ? window.ImagePaths.getGalleryArray(
          ctx.location,
          ctx.category,
          tripId,
          total
        )
        : [];
    return [posterSrc, ...gallery];
  },

  openIncludedTripModal: (item) => {
    const modal = document.getElementById("included-trip-modal");
    if (!modal) return;

    const lang = PackagesModel.state.lang;
    const i18n = lang === "en" ? window.i18nEn || {} : window.i18nIt || {};
    const apiTrip = item.apiTrip || {};
    const langTrip = item.langTrip || {};
    const tripId = item.id;
    const globalDict = i18n.global || {};

    PackagesView.populateModalHero(tripId, apiTrip, lang, langTrip);
    PackagesView.populateModalInfo(tripId, langTrip, globalDict);
    PackagesView.populateModalLists(langTrip);
    modal.classList.remove("hidden");

    const scrollableContainer = modal.querySelector('.overflow-y-auto');
    if (scrollableContainer) {
      scrollableContainer.scrollTop = 0;
    }

    if (document && document.body) {
      document.body.style.overflow = "hidden";
    }

    PackagesView.bindModalClose();
  },

  populateModalHero: (tripId, apiTrip, lang, langTrip) => {
    const heroEl = document.getElementById("included-trip-modal-hero-img");
    const galleryEl = document.getElementById("included-trip-modal-gallery");
    const badgeEl = document.getElementById("included-trip-badge");
    const images = PackagesView.getImagesForTrip(tripId, apiTrip);
    const posterSrc = images[0];
    if (heroEl) {
      PackagesView.applyHeroImage(heroEl, posterSrc);
      const ctx = window.ImagePaths
        ? window.ImagePaths.resolveTripContext({
          trip_id: tripId,
          ...(apiTrip || {})
        })
        : { location: "", category: "", tripId };
      if (
        window.ImagePaths &&
        typeof window.ImagePaths.resolvePosterOrPlaceholder === "function"
      ) {
        window.ImagePaths
          .resolvePosterOrPlaceholder(ctx.location, ctx.category, tripId)
          .then((src) => {
            PackagesView.applyHeroImage(heroEl, src);
          });
      }
    }
    const badgeText = apiTrip
      ? lang === "en"
        ? apiTrip.badge_en
        : apiTrip.badge_it
      : "";
    if (badgeEl) {
      if (badgeText) {
        badgeEl.textContent = badgeText;
        badgeEl.classList.remove("hidden");
        badgeEl.classList.add("inline-block");
      } else {
        badgeEl.classList.add("hidden");
        badgeEl.classList.remove("inline-block");
      }
    }
    if (galleryEl) {
      galleryEl.innerHTML = "";
      const uniqueImages = [...new Set(images)].filter(Boolean);
      uniqueImages.forEach((src) => {
        PackagesView.createGalleryThumb(
          src,
          galleryEl,
          heroEl,
          "w-24 h-24 md:w-28 md:h-28"
        );
      });
      PackagesView.startAutoModalHero(uniqueImages, heroEl, 0);
    }
  },

  populateModalInfo: (tripId, langTrip, globalDict) => {
    const titleEl = document.getElementById("included-trip-title");
    const durEl = document.getElementById("included-trip-duration");
    const descEl = document.getElementById("included-trip-desc");
    const fullDescEl = document.getElementById("included-trip-full-desc");
    const importantEl = document.getElementById("included-trip-important");
    if (titleEl) titleEl.textContent = langTrip.title || tripId;
    const daily =
      typeof globalDict.daily === "string" ? globalDict.daily : "";
    if (durEl) durEl.textContent = langTrip.duration || daily;
    if (descEl) descEl.textContent = langTrip.short_desc || "";
    if (fullDescEl) fullDescEl.innerHTML = langTrip.full_description || "";
    if (importantEl) importantEl.textContent = langTrip.important_notes || "";
  },

  populateModalLists: (langTrip) => {
    const highlightsEl = document.getElementById("included-trip-highlights");
    const includesEl = document.getElementById("included-trip-includes");
    const excludesEl = document.getElementById("included-trip-excludes");
    const programEl = document.getElementById("included-trip-program");
    PackagesView.renderList(highlightsEl, langTrip.highlights);
    PackagesView.renderList(includesEl, langTrip.includes, true, "check");
    PackagesView.renderList(excludesEl, langTrip.not_included, true, "cross");
    if (programEl) {
      programEl.innerHTML = "";
      if (Array.isArray(langTrip.program)) {
        const frag = document.createDocumentFragment();
        langTrip.program.forEach((step) => {
          const row = document.createElement("div");
          row.className = "flex items-start gap-4";
          row.innerHTML =
            '<div class="text-gold font-bold min-w-[70px] pt-1">' +
            (step.time || "") +
            "</div>" +
            '<div class="flex-1">' +
            '<div class="text-white font-semibold text-base mb-1">' +
            (step.activity || "") +
            "</div>" +
            '<div class="text-gray-400 text-sm leading-relaxed">' +
            (step.details || "") +
            "</div>" +
            "</div>";
          frag.appendChild(row);
        });
        programEl.appendChild(frag);
      }
    }
  },

  populateModalPrice: (apiTrip, globalDict) => {
    const priceEl = document.getElementById("included-trip-price");
    const priceBreakdownEl = document.getElementById(
      "included-trip-price-breakdown"
    );
    const pAdult = apiTrip ? parseFloat(apiTrip.p_adult || "0") : 0;
    const dAdult = apiTrip ? parseFloat(apiTrip.d_adult || "0") : 0;
    const pChild = apiTrip ? parseFloat(apiTrip.p_child || "0") : 0;
    const dChild = apiTrip ? parseFloat(apiTrip.d_child || "0") : 0;
    const minPax = apiTrip ? parseInt(apiTrip.min_pax || "1", 10) : 1;
    const adultHero =
      dAdult > 0
        ? '<span class="inline-flex items-center gap-2"><span class="line-through text-gray-400 text-lg">€' +
        pAdult +
        '</span><span class="text-gold font-bold text-3xl">€' +
        dAdult +
        "</span></span>"
        : '<span class="inline-flex items-center gap-2"><span class="text-gold font-bold text-3xl">€' +
        pAdult +
        "</span></span>";
    if (priceEl) priceEl.innerHTML = adultHero;
    if (priceBreakdownEl) {
      const dictPricing = globalDict.pricing || {};
      const lblMinPax = dictPricing.min_pax || "Min Pax";
      const adultRow =
        dAdult > 0
          ? '<div class="flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€' +
          pAdult +
          '</span><span class="text-white font-bold">€' +
          dAdult +
          "</span></div>"
          : '<div class="flex items-center gap-2"><span>👤</span><span class="text-white font-bold">€' +
          pAdult +
          "</span></div>";
      const childRow =
        dChild > 0 || pChild > 0
          ? dChild > 0
            ? '<div class="flex items-center gap-2"><span>👶</span><span class="line-through text-gray-400">€' +
            pChild +
            '</span><span class="text-white font-bold">€' +
            dChild +
            "</span></div>"
            : '<div class="flex items-center gap-2"><span>👶</span><span class="text-white font-bold">€' +
            pChild +
            "</span></div>"
          : "";
      const minPaxRow =
        '<div class="flex items-center gap-2 text-gray-400 text-sm mt-1 pt-1 border-t border-gray-800 w-full"><span>👥</span><span>' +
        lblMinPax +
        ": " +
        minPax +
        "</span></div>";
      priceBreakdownEl.innerHTML = adultRow + childRow + minPaxRow;
    }
  },

  setupSlideshow: (uniqueImages, imgId) => {
    if (uniqueImages.length > 1) {
      let idx = 0;
      const interval = setInterval(() => {
        const el = document.getElementById(imgId);
        if (!el) return;
        el.style.opacity = "0";
        setTimeout(() => {
          const target = document.getElementById(imgId);
          if (!target) return;
          idx = (idx + 1) % uniqueImages.length;
          target.src = uniqueImages[idx];
          target.style.opacity = "1";
        }, 200);
      }, 3000);
      PackagesModel.addInterval(interval);
    }
  },

  setupStickyBehavior: () => {
    const sticky = document.getElementById("sticky-mobile-book");
    const formCard = document.getElementById("booking-card-container");
    if (!sticky || !formCard) return;
    const stickyTxt =
      sticky.querySelector('span[data-i18n="global.book_package_now"]') ||
      sticky.querySelector('span[data-i18n="global.book_now"]');
    const primaryTxt =
      document.querySelector(
        '#btn-submit-booking span[data-i18n="global.book_package_now"]'
      ) || document.querySelector("#btn-submit-booking span");
    const runAnim = () => {
      if (stickyTxt) {
        stickyTxt.classList.add("animate-wiggle");
        setTimeout(() => stickyTxt.classList.remove("animate-wiggle"), 1200);
      }
      if (primaryTxt) {
        primaryTxt.classList.add("animate-wiggle");
        setTimeout(() => primaryTxt.classList.remove("animate-wiggle"), 1200);
      }
    };
    setInterval(runAnim, 8000);
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e && e.isIntersecting && e.intersectionRatio > 0.1) {
          sticky.classList.add("opacity-0", "pointer-events-none");
          sticky.classList.remove("opacity-100");
        } else {
          sticky.classList.add("opacity-100");
          sticky.classList.remove("opacity-0", "pointer-events-none");
        }
      },
      { root: null, threshold: [0, 0.1, 1] }
    );
    io.observe(formCard);
  },

  renderList: (host, arr, bullet, iconType) => {
    if (!host) return;
    host.innerHTML = "";
    if (!Array.isArray(arr) || arr.length === 0) return;
    const frag = document.createDocumentFragment();
    let iconSvg = "";
    if (bullet) {
      if (iconType === "check") {
        iconSvg =
          '<svg class="w-4 h-4 text-green-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      } else if (iconType === "cross") {
        iconSvg =
          '<svg class="w-4 h-4 text-red-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      }
    }
    arr.forEach((item) => {
      const li = document.createElement("li");
      if (bullet && iconSvg) {
        li.className = "flex items-start gap-2";
        li.innerHTML = iconSvg + "<span>" + item + "</span>";
      } else {
        li.textContent = item;
      }
      if (!bullet) li.style.listStyle = "none";
      frag.appendChild(li);
    });
    host.appendChild(frag);
  },

  renderProgram: (host, program) => {
    if (!host) return;
    host.innerHTML = "";
    if (!Array.isArray(program)) return;
    const frag = document.createDocumentFragment();
    program.forEach((step) => {
      const time = step.time || "";
      const activity = step.activity || "";
      const details = step.details || "";
      const row = document.createElement("div");
      row.className = "flex items-start gap-4 mb-4";
      row.innerHTML =
        '<div class="text-gold font-bold min-w-[72px]">' +
        time +
        "</div>" +
        "<div>" +
        '<div class="text-white font-semibold">' +
        activity +
        "</div>" +
        '<div class="text-gray-400 text-sm">' +
        details +
        "</div>" +
        "</div>";
      frag.appendChild(row);
    });
    host.appendChild(frag);
  },

  createGalleryThumb: (src, host, bgEl, classes) => {
    if (!host || !src) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      classes +
      " relative rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 border border-gray-100 shadow-md snap-center group transition";
    btn.innerHTML =
      '<img src="' +
      src +
      '" class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" loading="lazy">' +
      '<div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">' +
      '<svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>' +
      "</div>";
    btn.addEventListener("click", () => {
      if (!bgEl) return;
      const tag = bgEl.tagName ? bgEl.tagName.toLowerCase() : "";
      if (tag === "img") {
        PackagesView.setModalHeroImage(bgEl, src);
      } else {
        bgEl.style.backgroundImage = "url('" + src + "')";
      }
    });
    host.appendChild(btn);
  },

  bindModalClose: () => {
    const modal = document.getElementById("included-trip-modal");
    const closeBtn = document.getElementById("included-trip-modal-close");
    if (!modal) return;
    const close = () => {
      modal.classList.add("hidden");
      if (document && document.body) {
        document.body.style.overflow = "";
      }
      if (PackagesView.state.modalAutoTimer) {
        clearInterval(PackagesView.state.modalAutoTimer);
        PackagesView.state.modalAutoTimer = null;
      }
    };
    if (closeBtn && !closeBtn.__bound) {
      closeBtn.__bound = true;
      closeBtn.addEventListener("click", close);
    }
    if (!modal.__boundClick) {
      modal.__boundClick = true;
      modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
      });
    }
  }
};

window.PackagesView = PackagesView;
