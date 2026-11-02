import {currencyRates} from '../data/settings';
import {formatPrice, resolveCurrency, type CurrencyCode} from '../domain/currency';

export const currencyStorageKey = 'fabio_currency';
let selected: CurrencyCode = 'EUR';
try { selected = resolveCurrency(localStorage.getItem(currencyStorageKey), currencyRates); } catch { /* Storage is optional. */ }

export function currentCurrency() { return selected; }
export function displayPrice(eur: number) {
  return formatPrice(eur, selected, currencyRates, document.documentElement.lang);
}
export function renderPrices(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-price-eur]').forEach(node => {
    const raw = node.dataset.priceEur;
    if (raw === undefined || raw.trim() === '' || !Number.isFinite(Number(raw)) || Number(raw) < 0) return;
    node.textContent = displayPrice(Number(raw));
  });
}
export function setPrice(node: HTMLElement, eur: number) {
  node.dataset.priceEur = String(eur);
  node.textContent = displayPrice(eur);
}
function apply(value: unknown) {
  selected = resolveCurrency(value, currencyRates);
  document.querySelectorAll('[data-current-currency]').forEach(node => { node.textContent = selected; });
  document.querySelectorAll<HTMLElement>('[data-currency]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.currency === selected)));
  document.querySelectorAll<HTMLElement>('[data-currency-notice]').forEach(node => { node.hidden = selected === 'EUR'; });
  renderPrices();
  document.dispatchEvent(new CustomEvent('fabio:currency-change', {detail: {currency: selected}}));
}
function init() {
  apply(selected);
  document.querySelectorAll<HTMLButtonElement>('[data-currency]').forEach(button => {
    if (button.dataset.currencyBound) return;
    button.dataset.currencyBound = 'true';
    button.addEventListener('click', () => {
      apply(button.dataset.currency);
      try { localStorage.setItem(currencyStorageKey, selected); } catch { /* Keep selection in memory. */ }
      const disclosure = button.closest('details');
      if (disclosure) { disclosure.open = false; disclosure.querySelector('summary')?.focus(); }
    });
  });
}
// Also works if a future page adopts Astro client navigation.
document.addEventListener('astro:page-load', init);
window.addEventListener('storage', event => { if (event.key === currencyStorageKey || event.key === null) apply(event.newValue); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
else init();
