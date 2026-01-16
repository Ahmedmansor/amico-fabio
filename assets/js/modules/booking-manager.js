const BookingManager = {
  state: {
    tripId: null,
    apiData: null,
    langData: null,
    adults: 1,
    children: 0,
    addons: [],
    selectedAddons: new Set(),
    formData: { name: '', nation: '', date: '' }
  },

  utils: {
    getLang: () => localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it',
    getI18n: (lang) => lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {}),
    getPrices: (apiData) => {
      const adult = parseFloat(apiData?.d_adult || apiData?.p_adult || 0);
      const child = parseFloat(apiData?.d_child || apiData?.p_child || 0);
      const minPax = parseInt(apiData?.min_pax || 1);
      return { adult, child, minPax };
    },
    formatEUR: (n) => `€${n}`,
    getAddonLabel: (addon, lang) => lang === 'it' ? (addon.label_it || addon.label_en) : (addon.label_en || addon.label_it),
    buildExtrasListString: (state, lang) => {
      return Array.from(state.selectedAddons).map(id => {
        const a = state.addons.find(ad => ad.addon_id === id);
        if (!a) return id;
        return BookingManager.utils.getAddonLabel(a, lang);
      }).join(', ');
    }
  },

  init: (tripId, apiData, langData, addons) => {
    BookingManager.state.tripId = tripId;
    BookingManager.state.apiData = apiData;
    BookingManager.state.langData = langData;
    BookingManager.state.addons = Array.isArray(addons) ? addons : [];
    BookingManager.state.adults = parseInt(apiData?.min_pax || 1);
    BookingManager.renderForm();
  },

  renderForm: () => {
    const container = document.getElementById('trip-booking-form');
    const btnSubmit = document.getElementById('btn-submit-booking');
    if (!container) return;

    const lang = BookingManager.utils.getLang();
    const dataset = BookingManager.utils.getI18n(lang);
    const g = dataset.global || {};
    const pricingDict = g.pricing || {};
    const txt = {
      name: g.full_name || (lang === 'en' ? 'Full Name' : 'Nome Completo'),
      nation: g.nationality || (lang === 'en' ? 'Nationality' : 'Nazionalità'),
      date: g.trip_date || (lang === 'en' ? 'Trip Date' : 'Data del Viaggio'),
      adults: g.adults_12_plus || pricingDict.adult || (lang === 'en' ? 'Adults (12+)' : 'Adulti (+12)'),
      children: g.children_2_11 || pricingDict.child || (lang === 'en' ? 'Children (2-11)' : 'Bambini (2-11)'),
      addons: g.addons_extras || (lang === 'en' ? 'Add-ons & Extras' : 'Extra & Supplementi')
    };

    const prices = BookingManager.utils.getPrices(BookingManager.state.apiData);

    let html = `
      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="block text-xs text-gray-400 mb-1">${txt.name} <span class="text-gold">*</span></label>
          <input type="text" id="inp-name" class="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-gold outline-none transition-colors" placeholder="${g.placeholders && g.placeholders.full_name ? g.placeholders.full_name : (lang === 'en' ? 'John Doe' : 'Fabio Mansour')}">
          <div id="err-name" class="text-red-500 text-xs mt-1 hidden"></div>
        </div>
        <div class="relative">
          <label class="block text-xs text-gray-400 mb-1">${txt.nation} <span class="text-gold">*</span></label>
          <input type="hidden" id="inp-nation" value="">
          <button type="button" id="nation-picker" class="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-gold outline-none flex items-center justify-between">
            <span id="nation-selected" class="flex items-center gap-2 text-gray-400">${g.select_country || (lang === 'en' ? 'Select country...' : 'Seleziona paese...')}</span>
            <span class="text-gray-500">▼</span>
          </button>
          <div id="nation-list" class="absolute left-0 right-0 mt-1 bg-black/80 border border-gray-700 rounded-lg max-h-56 overflow-auto z-20 hidden shadow-xl"></div>
          <div id="err-nation" class="text-red-500 text-xs mt-1 hidden"></div>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-400 mb-1">${txt.date} <span class="text-gold">*</span></label>
        <input type="date" id="inp-date" class="w-full bg-black/50 border border-gray-700 rounded p-2 text-white focus:border-gold outline-none" min="${new Date().toISOString().split('T')[0]}">
        <div id="err-date" class="text-red-500 text-xs mt-1 hidden"></div>
      </div>
      <div class="border-t border-gray-800 my-3"></div>

      <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-white/5">
        <div class="text-sm"><div class="text-white font-bold">${txt.adults}</div><div class="text-gold text-xs">€${prices.adult}</div></div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="BookingManager.updatePax('adults', -1, ${prices.minPax})" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">-</button>
          <span id="count-adults" class="font-bold w-4 text-center text-white">${BookingManager.state.adults}</span>
          <button type="button" onclick="BookingManager.updatePax('adults', 1, ${prices.minPax})" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">+</button>
        </div>
      </div>
      <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-white/5">
        <div class="text-sm"><div class="text-white font-bold">${txt.children}</div><div class="text-gold text-xs">€${prices.child}</div></div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="BookingManager.updatePax('children', -1, 0)" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">-</button>
          <span id="count-children" class="font-bold w-4 text-center text-white">${BookingManager.state.children}</span>
          <button type="button" onclick="BookingManager.updatePax('children', 1, 0)" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">+</button>
        </div>
      </div>
    `;

    if (BookingManager.state.addons.length > 0) {
      html += `<div class="border-t border-gray-800 my-3 pt-2"><label class="block text-xs text-gold mb-2 font-bold uppercase tracking-wider">${txt.addons}</label><div class="space-y-2">`;
      BookingManager.state.addons.forEach(addon => {
        const label = lang === 'it' ? addon.label_it : addon.label_en;
        const price = parseFloat(addon.price || 0);
        html += `
          <label class="flex items-center justify-between cursor-pointer hover:bg-gray-800 p-2 rounded transition border border-transparent hover:border-gray-700">
            <div class="flex items-center">
              <input type="checkbox" value="${addon.addon_id}" data-price="${price}" onchange="BookingManager.toggleAddon(this)">
              <span class="ml-3 text-white">${label}</span>
            </div>
            <span class="text-gold font-bold">€${price}</span>
          </label>
        `;
      });
      html += `</div></div>`;
    }

    container.innerHTML = html;
    const adultsEl = document.getElementById('count-adults');
    const childrenEl = document.getElementById('count-children');
    if (adultsEl) adultsEl.textContent = String(BookingManager.state.adults);
    if (childrenEl) childrenEl.textContent = String(BookingManager.state.children);

    const inpDate = document.getElementById('inp-date');
    if (inpDate && typeof inpDate.showPicker === 'function') {
      inpDate.addEventListener('click', () => inpDate.showPicker());
      inpDate.addEventListener('focus', () => inpDate.showPicker());
    }
    if (btnSubmit) {
      btnSubmit.onclick = () => BookingManager.validateAndShowInvoice();
    }

    const nationHidden = document.getElementById('inp-nation');
    const nationPicker = document.getElementById('nation-picker');
    const nationSelected = document.getElementById('nation-selected');
    const nationList = document.getElementById('nation-list');
    if (nationPicker && nationList && nationHidden && nationSelected) {
      const flagSvg = (colors, pattern = 'h3') => {
        const w = 24, h = 16;
        if (pattern === 'v3') {
          return `<svg class="w-4 h-3" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
              <rect width="${w / 3}" height="${h}" x="0" y="0" fill="${colors[0] || '#ccc'}" />
              <rect width="${w / 3}" height="${h}" x="${w / 3}" y="0" fill="${colors[1] || '#999'}" />
              <rect width="${w / 3}" height="${h}" x="${2 * w / 3}" y="0" fill="${colors[2] || '#666'}" />
          </svg>`;
        }
        if (pattern === 'h2') {
          return `<svg class="w-4 h-3" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
              <rect width="${w}" height="${h / 2}" x="0" y="0" fill="${colors[0] || '#ccc'}" />
              <rect width="${w}" height="${h / 2}" x="0" y="${h / 2}" fill="${colors[1] || '#999'}" />
          </svg>`;
        }
        return `<svg class="w-4 h-3" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${w}" height="${h / 3}" x="0" y="0" fill="${colors[0] || '#ccc'}" />
            <rect width="${w}" height="${h / 3}" x="0" y="${h / 3}" fill="${colors[1] || '#999'}" />
            <rect width="${w}" height="${h / 3}" x="0" y="${2 * h / 3}" fill="${colors[2] || '#666'}" />
        </svg>`;
      };
      const countries = [
        { v: "Afghan", t: "Afghanistan", c: ["#1f4e79", "#fff", "#009a49"], p: "h3" },
        { v: "Albanian", t: "Albania", c: ["#e41e26", "#e41e26", "#e41e26"], p: "h3" },
        { v: "Algerian", t: "Algeria", c: ["#006233", "#fff", "#d52b1e"], p: "v3" },
        { v: "American", t: "United States", c: ["#b22234", "#fff", "#3c3b6e"], p: "h3" },
        { v: "Andorran", t: "Andorra", c: ["#0033a0", "#ffcd00", "#c8102e"], p: "v3" },
        { v: "Angolan", t: "Angola", c: ["#d80027", "#000", "#d80027"], p: "h3" },
        { v: "Argentine", t: "Argentina", c: ["#75aadb", "#fff", "#75aadb"], p: "h3" },
        { v: "Armenian", t: "Armenia", c: ["#d90012", "#0033a0", "#f2a800"], p: "h3" },
        { v: "Australian", t: "Australia", c: ["#012169", "#fff", "#c8102e"], p: "h3" },
        { v: "Austrian", t: "Austria", c: ["#ed2939", "#fff", "#ed2939"], p: "h3" },
        { v: "Azerbaijani", t: "Azerbaijan", c: ["#00a3dd", "#ed2939", "#009a49"], p: "h3" },
        { v: "Bahraini", t: "Bahrain", c: ["#fff", "#ce1126", "#ce1126"], p: "h3" },
        { v: "Bangladeshi", t: "Bangladesh", c: ["#006a4e", "#f42a41", "#006a4e"], p: "h3" },
        { v: "Belgian", t: "Belgium", c: ["#000", "#ffcd00", "#ef3340"], p: "v3" },
        { v: "Bolivian", t: "Bolivia", c: ["#d52b1e", "#ffd500", "#007934"], p: "h3" },
        { v: "Bosnian", t: "Bosnia and Herzegovina", c: ["#002f6c", "#fcd116", "#fff"], p: "h3" },
        { v: "Brazilian", t: "Brazil", c: ["#009b3a", "#ffdf00", "#002776"], p: "h3" },
        { v: "British", t: "United Kingdom", c: ["#00247d", "#fff", "#cf142b"], p: "h3" },
        { v: "Bulgarian", t: "Bulgaria", c: ["#fff", "#00966e", "#d62612"], p: "h3" },
        { v: "Cambodian", t: "Cambodia", c: ["#032ea1", "#e00025", "#032ea1"], p: "h3" },
        { v: "Canadian", t: "Canada", c: ["#ff0000", "#fff", "#ff0000"], p: "h3" },
        { v: "Chilean", t: "Chile", c: ["#0039a6", "#fff", "#d2232c"], p: "h3" },
        { v: "Chinese", t: "China", c: ["#de2910", "#ffde00", "#de2910"], p: "h3" },
        { v: "Colombian", t: "Colombia", c: ["#fcd116", "#003893", "#ce1126"], p: "h3" },
        { v: "Croatian", t: "Croatia", c: ["#ff0000", "#fff", "#171796"], p: "h3" },
        { v: "Cypriot", t: "Cyprus", c: ["#fff", "#d4af37", "#fff"], p: "h3" },
        { v: "Czech", t: "Czech Republic", c: ["#fff", "#11457e", "#d7141a"], p: "h3" },
        { v: "Danish", t: "Denmark", c: ["#c8102e", "#fff", "#c8102e"], p: "h3" },
        { v: "Dutch", t: "Netherlands", c: ["#ae1c28", "#fff", "#21468b"], p: "h3" },
        { v: "Egyptian", t: "Egypt", c: ["#ce1126", "#fff", "#000000"], p: "h3" },
        { v: "Emirati", t: "United Arab Emirates", c: ["#00732f", "#fff", "#000"], p: "h3" },
        { v: "Estonian", t: "Estonia", c: ["#0072ce", "#000", "#fff"], p: "h3" },
        { v: "Finnish", t: "Finland", c: ["#fff", "#003580", "#fff"], p: "h3" },
        { v: "French", t: "France", c: ["#0055a4", "#fff", "#ef4135"], p: "v3" },
        { v: "Georgian", t: "Georgia", c: ["#fff", "#d40000", "#fff"], p: "h3" },
        { v: "German", t: "Germany", c: ["#000", "#dd0000", "#ffce00"], p: "h3" },
        { v: "Greek", t: "Greece", c: ["#0d5eaf", "#fff", "#0d5eaf"], p: "h3" },
        { v: "Hungarian", t: "Hungary", c: ["#cd2a3e", "#fff", "#436f4d"], p: "h3" },
        { v: "Icelandic", t: "Iceland", c: ["#02529c", "#fff", "#dc1c3c"], p: "h3" },
        { v: "Indian", t: "India", c: ["#ff9933", "#fff", "#138808"], p: "h3" },
        { v: "Indonesian", t: "Indonesia", c: ["#ce1126", "#fff", "#fff"], p: "h3" },
        { v: "Irish", t: "Ireland", c: ["#169b62", "#fff", "#ff883e"], p: "v3" },
        { v: "Israeli", t: "Israel", c: ["#fff", "#0038b8", "#fff"], p: "h3" },
        { v: "Italian", t: "Italy", c: ["#009246", "#fff", "#ce2b37"], p: "v3" },
        { v: "Japanese", t: "Japan", c: ["#fff", "#bc002d", "#fff"], p: "h3" },
        { v: "Jordanian", t: "Jordan", c: ["#007a3d", "#000", "#ce1126"], p: "h3" },
        { v: "Kazakh", t: "Kazakhstan", c: ["#00afca", "#f6d049", "#00afca"], p: "h3" },
        { v: "Kenyan", t: "Kenya", c: ["#000", "#bb1f2d", "#2f5d35"], p: "h3" },
        { v: "Kuwaiti", t: "Kuwait", c: ["#007a3d", "#fff", "#000"], p: "h3" },
        { v: "Latvian", t: "Latvia", c: ["#9e2438", "#fff", "#9e2438"], p: "h3" },
        { v: "Lebanese", t: "Lebanon", c: ["#f00000", "#fff", "#f00000"], p: "h3" },
        { v: "Lithuanian", t: "Lithuania", c: ["#fdb913", "#006a44", "#c1272d"], p: "h3" },
        { v: "Luxembourgish", t: "Luxembourg", c: ["#00a3e0", "#fff", "#ed2939"], p: "h3" },
        { v: "Malaysian", t: "Malaysia", c: ["#010080", "#fff", "#d00000"], p: "h3" },
        { v: "Maltese", t: "Malta", c: ["#fff", "#e4002b", "#fff"], p: "v3" },
        { v: "Mexican", t: "Mexico", c: ["#006847", "#fff", "#ce1126"], p: "v3" },
        { v: "Moroccan", t: "Morocco", c: ["#c1272d", "#c1272d", "#c1272d"], p: "h3" },
        { v: "Nepalese", t: "Nepal", c: ["#003893", "#dc143c", "#003893"], p: "h3" },
        { v: "New Zealander", t: "New Zealand", c: ["#00247d", "#fff", "#cf142b"], p: "h3" },
        { v: "Norwegian", t: "Norway", c: ["#ef2b2d", "#fff", "#002868"], p: "h3" },
        { v: "Pakistani", t: "Pakistan", c: ["#00401a", "#fff", "#00401a"], p: "h3" },
        { v: "Palestinian", t: "Palestine", c: ["#000", "#fff", "#007a3d"], p: "h3" },
        { v: "Peruvian", t: "Peru", c: ["#d91023", "#fff", "#d91023"], p: "h3" },
        { v: "Philippine", t: "Philippines", c: ["#0038a8", "#fff", "#ce1126"], p: "h3" },
        { v: "Polish", t: "Poland", c: ["#fff", "#dc143c", "#dc143c"], p: "h3" },
        { v: "Portuguese", t: "Portugal", c: ["#046a38", "#da291c", "#da291c"], p: "h3" },
        { v: "Qatari", t: "Qatar", c: ["#8d1b3d", "#fff", "#8d1b3d"], p: "h3" },
        { v: "Romanian", t: "Romania", c: ["#002b7f", "#fcd116", "#ce1126"], p: "v3" },
        { v: "Russian", t: "Russia", c: ["#fff", "#0039a6", "#d52b1e"], p: "h3" },
        { v: "Saudi", t: "Saudi Arabia", c: ["#006c35", "#fff", "#006c35"], p: "h3" },
        { v: "Scottish", t: "Scotland", c: ["#0065bd", "#fff", "#0065bd"], p: "h3" },
        { v: "Serbian", t: "Serbia", c: ["#c6363c", "#0f52ba", "#fff"], p: "h3" },
        { v: "Singaporean", t: "Singapore", c: ["#ed2939", "#fff", "#fff"], p: "h3" },
        { v: "Slovak", t: "Slovakia", c: ["#fff", "#0b4ea2", "#ee1c25"], p: "h3" },
        { v: "Slovenian", t: "Slovenia", c: ["#fff", "#0056a3", "#ed1c24"], p: "h3" },
        { v: "South African", t: "South Africa", c: ["#007850", "#000", "#de3831"], p: "h3" },
        { v: "South Korean", t: "South Korea", c: ["#fff", "#000", "#c60c30"], p: "h3" },
        { v: "Spanish", t: "Spain", c: ["#aa151b", "#f1bf00", "#aa151b"], p: "h3" },
        { v: "Swedish", t: "Sweden", c: ["#006aa7", "#fecc00", "#006aa7"], p: "h3" },
        { v: "Swiss", t: "Switzerland", c: ["#d52b1e", "#fff", "#d52b1e"], p: "h3" },
        { v: "Syrian", t: "Syria", c: ["#ce1126", "#fff", "#000"], p: "h3" },
        { v: "Thai", t: "Thailand", c: ["#ff0000", "#fff", "#2d2a4a"], p: "h3" },
        { v: "Tunisian", t: "Tunisia", c: ["#e70013", "#fff", "#e70013"], p: "h3" },
        { v: "Turkish", t: "Turkey", c: ["#e30a17", "#fff", "#e30a17"], p: "h3" },
        { v: "Ukrainian", t: "Ukraine", c: ["#0057b7", "#ffd700", "#0057b7"], p: "h3" },
        { v: "Uruguayan", t: "Uruguay", c: ["#00a1e4", "#fff", "#ffd700"], p: "h3" },
        { v: "Venezuelan", t: "Venezuela", c: ["#f4c300", "#003893", "#ce1126"], p: "h3" }
      ];
      countries.sort((a, b) => a.t.localeCompare(b.t));
      nationPicker.addEventListener('click', () => {
        nationList.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        const inside = e.target.closest('#nation-picker') || e.target.closest('#nation-list');
        if (!inside) nationList.classList.add('hidden');
      });
      const frag = document.createDocumentFragment();
      countries.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center gap-2 text-sm text-white';
        btn.innerHTML = `${flagSvg(c.c, c.p)} <span>${c.t}</span>`;
        btn.addEventListener('click', () => {
          nationHidden.value = c.v;
          nationSelected.innerHTML = `${flagSvg(c.c, c.p)} <span class="text-white">${c.t}</span>`;
          nationList.classList.add('hidden');
        });
        frag.appendChild(btn);
      });
      nationList.appendChild(frag);
    }
    BookingManager.calculateTotal();
  },

  updatePax: (type, change, min) => {
    let next = BookingManager.state[type] + change;
    if (next < min) next = min;
    BookingManager.state[type] = next;
    const el = document.getElementById(`count-${type}`);
    if (el) el.textContent = String(next);
    BookingManager.calculateTotal();
  },

  toggleAddon: (checkbox) => {
    if (!checkbox) return;
    if (checkbox.checked) {
      BookingManager.state.selectedAddons.add(checkbox.value);
    } else {
      BookingManager.state.selectedAddons.delete(checkbox.value);
    }
    BookingManager.calculateTotal();
  },

  calculateTotal: () => {
    const { adult, child } = BookingManager.utils.getPrices(BookingManager.state.apiData);
    let total = (BookingManager.state.adults * adult) + (BookingManager.state.children * child);
    BookingManager.state.selectedAddons.forEach(id => {
      const addon = BookingManager.state.addons.find(a => a.addon_id === id);
      if (addon) total += parseFloat(addon.price || 0);
    });
    const totalEl = document.getElementById('live-total-price');
    if (totalEl) totalEl.textContent = BookingManager.utils.formatEUR(total);
    return total;
  },

  validateAndShowInvoice: () => {
    const nameEl = document.getElementById('inp-name');
    const dateEl = document.getElementById('inp-date');
    const nationHidden = document.getElementById('inp-nation');
    const nationPicker = document.getElementById('nation-picker');
    const name = nameEl ? String(nameEl.value || '').trim() : '';
    const date = dateEl ? String(dateEl.value || '').trim() : '';
    const nation = nationHidden ? String(nationHidden.value || '').trim() : '';
    const lang = BookingManager.utils.getLang();
    const dict = BookingManager.utils.getI18n(lang);
    const g = dict.global || {};
    const errs = g.errors || {};
    const reqMsg = errs.required_field || '';
    const setErr = (errId, inputEl, ok, msg) => {
      const el = document.getElementById(errId);
      if (!el || !inputEl) return;
      if (ok) {
        el.textContent = '';
        el.classList.add('hidden');
        inputEl.classList.remove('border-red-500');
      } else {
        el.textContent = msg || reqMsg;
        el.classList.remove('hidden');
        inputEl.classList.add('border-red-500');
      }
    };
    const okName = !!name;
    const okDate = !!date;
    const okNation = !!nation;
    setErr('err-name', nameEl, okName, errs.required_name);
    setErr('err-date', dateEl, okDate, errs.required_date);
    setErr('err-nation', nationPicker || nationHidden, okNation, errs.required_nation);
    const btn = document.getElementById('btn-submit-booking');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-70');
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('opacity-70');
      }, 1200);
    }
    if (!okName || !okDate || !okNation) {
      const firstInvalid = !okName ? nameEl : (!okDate ? dateEl : (!okNation ? (nationPicker || nationHidden) : null));
      if (firstInvalid && typeof firstInvalid.focus === 'function') {
        firstInvalid.focus();
        if (typeof firstInvalid.scrollIntoView === 'function') {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    BookingManager.state.formData = { name, date, nation };
    BookingManager.showInvoiceModal();
  },

  showInvoiceModal: () => {
    const modal = document.getElementById('invoice-modal');
    const content = document.getElementById('invoice-content');
    if (!modal || !content) return;
    const s = BookingManager.state;
    const total = BookingManager.calculateTotal();
    const tripName = s.langData?.title || s.tripId;
    const lang = BookingManager.utils.getLang();
    let addonsHtml = '';
    if (s.selectedAddons.size > 0) {
      const list = Array.from(s.selectedAddons).map(id => {
        const a = s.addons.find(ad => ad.addon_id === id);
        return a ? `<li>+ ${BookingManager.utils.getAddonLabel(a, lang)} (${BookingManager.utils.formatEUR(parseFloat(a.price || 0))})</li>` : '';
      }).join('');
      addonsHtml = `<div class="border-t border-gray-700 pt-2 mt-2"><p class="text-gold text-xs uppercase mb-1">Extras:</p><ul class="list-disc pl-4 text-xs text-gray-400">${list}</ul></div>`;
    }
    content.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between border-b border-gray-700 pb-2">
          <span class="text-gray-400">Trip:</span>
          <span class="text-white font-bold text-right">${tripName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Name:</span>
          <span class="text-white">${s.formData.name}</span>
        </div>
        ${s.formData.nation ? `<div class="flex justify-between"><span class="text-gray-400">Nationality:</span><span class="text-white">${s.formData.nation}</span></div>` : ''}
        <div class="flex justify-between">
          <span class="text-gray-400">Date:</span>
          <span class="text-white">${s.formData.date}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Pax:</span>
          <span class="text-white">${s.adults} Adults, ${s.children} Kids</span>
        </div>
        ${addonsHtml}
        <div class="flex justify-between items-center bg-gray-800 p-3 rounded mt-4">
          <span class="text-gold font-bold">Total Estimate:</span>
          <span class="text-2xl text-white font-bold">${BookingManager.utils.formatEUR(total)}</span>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  },

  sendToWhatsApp: () => {
    const s = BookingManager.state;
    const totalEl = document.getElementById('live-total-price');
    const total = totalEl ? totalEl.textContent : '€0';
    const tripTitle = s.langData?.title || s.tripId;
    const lang = BookingManager.utils.getLang();
    const i18n = BookingManager.utils.getI18n(lang);
    const w = i18n.global.whatsapp;
    const addonsList = BookingManager.utils.buildExtrasListString(s, lang);
    const guests = `${s.adults} ${w.adults_word}, ${s.children} ${w.children_word}`;
    const msgTemplate = w.full_message;
    const msg = msgTemplate
      .replace('{greeting}', w.greeting.replace('{name}', s.formData.name))
      .replace('{check_availability}', w.check_availability)
      .replace('{details_heading}', w.details_heading)
      .replace('{trip_label}', w.trip_label)
      .replace('{trip}', tripTitle)
      .replace('{date_label}', w.date_label)
      .replace('{date}', s.formData.date)
      .replace('{nation_label}', w.nation_label)
      .replace('{nation}', s.formData.nation || 'N/A')
      .replace('{guests_label}', w.guests_label)
      .replace('{guests}', guests)
      .replace('{extras_label}', w.extras_label)
      .replace('{extras}', addonsList || 'N/A')
      .replace('{total_label}', w.total_label)
      .replace('{total}', total)
      .replace('{waiting_confirmation}', w.waiting_confirmation);
    const phone = "201063239261";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    const modal = document.getElementById('invoice-modal');
    if (modal) modal.classList.add('hidden');
  }
};

window.BookingManager = BookingManager;
