import { browserGuestStorage, guestWishlistPrefix, readGuestWishlist, saveGuestFavorite } from '../data/guest-storage';

const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-favorite]')];
const page = document.querySelector<HTMLElement>('[data-wishlist-page]');
const items = [...document.querySelectorAll<HTMLElement>('[data-wishlist-item]')];
const empty = page?.querySelector<HTMLElement>('[data-wishlist-empty]');
const pageError = page?.querySelector<HTMLElement>('[data-wishlist-error]');

function refresh() {
  const result = readGuestWishlist(browserGuestStorage());
  const ids = result.ok ? new Set(result.value) : null;
  for (const button of buttons) {
    button.hidden = false;
    if (!ids) continue; // Retain the last known state on a read failure.
    const saved = ids.has(button.dataset.favoriteId!);
    const label = (saved ? button.dataset.remove : button.dataset.save)!;
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${label}: ${button.dataset.favoriteTitle}`);
    button.querySelector('[data-favorite-label]')!.textContent = label;
  }
  if (!page) return;
  if (pageError) {
    pageError.hidden = result.ok;
    pageError.textContent = result.ok ? '' : page.dataset.unavailable!;
  }
  if (!ids) { if (empty) empty.hidden = true; return; }
  let visible = 0;
  for (const item of items) {
    item.hidden = !ids.has(item.dataset.tripId!);
    if (!item.hidden) visible++;
  }
  if (empty) empty.hidden = visible > 0;
}

for (const button of buttons) button.addEventListener('click', () => {
  const error = button.parentElement!.querySelector<HTMLElement>('[data-favorite-error]')!;
  error.hidden = true;
  const wasFocused = document.activeElement === button;
  const desired = button.getAttribute('aria-pressed') !== 'true';
  const result = saveGuestFavorite(browserGuestStorage(), button.dataset.favoriteId!, desired);
  if (!result.ok) {
    error.textContent = button.dataset.error!;
    error.hidden = false;
    return;
  }
  refresh();
  // Removing a card must not strand keyboard focus in a hidden subtree.
  if (wasFocused && button.closest<HTMLElement>('[data-wishlist-item]')?.hidden) {
    (items.find(item => !item.hidden)?.querySelector<HTMLButtonElement>('[data-favorite]')
      ?? page?.querySelector<HTMLAnchorElement>('.wishlist-browse'))?.focus();
  }
});
window.addEventListener('storage', event => {
  const storage = browserGuestStorage();
  if (storage && event.storageArea === storage && (event.key === null || event.key.startsWith(guestWishlistPrefix))) refresh();
});
window.addEventListener('pageshow', refresh);
window.addEventListener('focus', refresh);
refresh();
