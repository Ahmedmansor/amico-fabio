function _renderTextFields(txt, g, lang) {
    return `
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
            <span id="nation-selected" class="flex items-center gap-2 text-gray-400">${txt.select_country}</span>
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
    `;
}
function _renderPaxControls(txt, prices,state) {
    return `
      <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-white/5">
        <div class="text-sm"><div class="text-white font-bold">${txt.adults}</div><div class="text-gold text-xs">€${prices.adult}</div></div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="BookingManager.updatePax('adults', -1, ${prices.minPax})" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">-</button>
          <span id="count-adults" class="font-bold w-4 text-center text-white">${state.adults}</span>
          <button type="button" onclick="BookingManager.updatePax('adults', 1, ${prices.minPax})" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">+</button>
        </div>
      </div>
      <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-white/5">
        <div class="text-sm"><div class="text-white font-bold">${txt.children}</div><div class="text-gold text-xs">€${prices.child}</div></div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="BookingManager.updatePax('children', -1, 0)" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">-</button>
          <span id="count-children" class="font-bold w-4 text-center text-white">${state.children}</span>
          <button type="button" onclick="BookingManager.updatePax('children', 1, 0)" class="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gold hover:text-black transition">+</button>
        </div>
      </div>
    `;
}
function _renderAddons(txt, lang,state) {
    if (state.addons.length === 0) return '';

    let html = `<div class="border-t border-gray-800 my-3 pt-2"><label class="block text-xs text-gold mb-2 font-bold uppercase tracking-wider">${txt.addons}</label><div class="space-y-2">`;
    state.addons.forEach(addon => {
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
    return html;
}
export const flagSvg=(colors, pattern = 'h3') => {
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
export function formHtml(state,prices,g,lang){
const txt={name:g.full_name,nation:g.nationality,date:g.trip_date,adults:g.adults_12_plus||g.pricing.adult,children:g.children_2_11||g.pricing.child,addons:g.addons_extras,select_country:g.select_country};
return (_renderTextFields(txt,g,lang)+_renderPaxControls(txt,prices,state)+_renderAddons(txt,lang,state)).replace(/onclick="BookingManager.updatePax\('([^']+)', (-?1), [^)]*\)"/g,(_,type,change)=>`data-pax="${type}" data-change="${change}"`).replace(/ onchange="[^"]*"/g,'');
}
