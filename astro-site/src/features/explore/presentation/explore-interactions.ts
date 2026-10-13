import { exploreLocations, exploreCategories, selectExploreItems, paginateExplore, restoreExploreState, type ExploreSummary, type SortOrder } from '../domain/explore';
import { filterClass } from './filter-styles';
const host = document.querySelector<HTMLElement>('[data-explore]');
if (host) {
  const locale = host.dataset.locale!;
  const params = new URLSearchParams(location.search);
  const queryLocation = params.get('loc')?.trim().toLowerCase();
  const currentLocation = queryLocation || host.dataset.location!;
  // Preserve incoming legacy-style location queries using the matching static route.
  if (queryLocation && exploreLocations.includes(queryLocation as typeof exploreLocations[number]) && queryLocation !== host.dataset.location) {
    params.delete('loc');
    const suffix = params.toString();
    location.replace(`/${locale}/explore/${queryLocation === 'all' ? '' : `${queryLocation}/`}${suffix ? `?${suffix}` : ''}`);
  } else {
    const grid = host.querySelector<HTMLElement>('#explore-grid')!;
    const elements = Array.from(grid.querySelectorAll<HTMLElement>('[data-explore-card]'));
    const items: ExploreSummary[] = elements.map(card => ({ id: card.dataset.cardKey!, location: card.dataset.location!, category: card.dataset.category!, displayPrice: Number(card.dataset.price), score: Number(card.dataset.score), sourceIndex: Number(card.dataset.sourceIndex) }));
    const byId = new Map(elements.map(card => [card.dataset.cardKey!, card]));
    const filters = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-filter]'));
    const sortInput = host.querySelector<HTMLSelectElement>('#price-sort')!;
    const pagination = host.querySelector<HTMLElement>('#pagination-controls')!;
    const previous = host.querySelector<HTMLButtonElement>('[data-previous]')!;
    const next = host.querySelector<HTMLButtonElement>('[data-next]')!;
    const storage = {
      get(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } },
      set(key: string, value: string) { try { sessionStorage.setItem(key,value); } catch { /* Static HTML works without storage. */ } },
      remove(key: string) { try { sessionStorage.removeItem(key); } catch { /* Optional preference. */ } },
    };
    const returning = storage.get('fabio_nav_source') === 'details';
    const validSort = (value: string | null): SortOrder => value === 'price_asc' || value === 'price_desc' ? value : 'default';
    const availableCategories = exploreCategories(items,currentLocation);
    filters.forEach(button => { button.hidden = !availableCategories.includes(button.dataset.filter!); });
    let { sort, category, page } = restoreExploreState(
      { sort: params.get('sort'), category: params.get('category'), page: params.get('page') },
      { sort: storage.get('fabio_explore_sort'), category: storage.get('fabio_explore_cat'), page: storage.get('fabio_explore_page') },
      returning,availableCategories);
    storage.set('fabio_last_loc', currentLocation);
    storage.remove('fabio_nav_source');
    function render(scroll = false) {
      const selected = selectExploreItems(items,currentLocation,category,sort);
      const result = paginateExplore(selected,page);
      page = result.page;
      elements.forEach(element => { element.hidden = true; });
      for (const item of selected) grid.append(byId.get(item.id)!);
      for (const item of result.items) byId.get(item.id)!.hidden = false;
      host!.querySelector<HTMLElement>('[data-empty]')!.hidden = selected.length > 0;
      filters.forEach(button => { const active = button.dataset.filter === category; button.className = filterClass(button.dataset.filter!,active); button.setAttribute('aria-pressed',String(active)); });
      sortInput.value = sort;
      pagination.classList.toggle('hidden',result.totalPages <= 1);
      previous.disabled = page === 1;
      next.disabled = page === result.totalPages;
      host!.querySelector('[data-page]')!.textContent = String(page);
      host!.querySelector('[data-pages]')!.textContent = String(result.totalPages);
      storage.set('fabio_explore_sort',sort); storage.set('fabio_explore_cat',category); storage.set('fabio_explore_page',String(page));
      // Language navigation keeps the current location, filter, ordering and page.
      document.querySelectorAll<HTMLAnchorElement>('[data-lang]').forEach(link => {
        const other = link.dataset.lang!;
        const state = new URLSearchParams({ category, sort, page: String(page) });
        const knownLocation = exploreLocations.includes(currentLocation as typeof exploreLocations[number]);
        if (!knownLocation) state.set('loc',currentLocation);
        link.href = `/${other}/explore/${!knownLocation || currentLocation === 'all' ? '' : `${currentLocation}/`}?${state}`;
      });
      if (scroll) host!.querySelector('section')?.scrollIntoView({behavior:'smooth'});
    }
    filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter!; page = 1; render(true); }));
    sortInput.addEventListener('change', () => { sort = validSort(sortInput.value); render(true); });
    previous.addEventListener('click', () => { page--; render(true); });
    next.addEventListener('click', () => { page++; render(true); });
    elements.forEach(card => card.querySelector('[data-detail-link]')?.addEventListener('click', () => storage.set('fabio_nav_source','details')));
    render();
  }
}
