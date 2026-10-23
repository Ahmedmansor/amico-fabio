/** Shared DOM rendering for guest and account states; persistence stays in data. */
export function createWishlistView(){
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('[data-favorite]')];
  const page=document.querySelector<HTMLElement>('[data-wishlist-page]');
  const items=[...document.querySelectorAll<HTMLElement>('[data-wishlist-item]')];
  const empty=page?.querySelector<HTMLElement>('[data-wishlist-empty]');
  const links=[...document.querySelectorAll<HTMLAnchorElement>('[data-wishlist-link]')];
  return {
    buttons,page,links,
    render(ids:ReadonlySet<string>|null,busy=false,disabled=busy){
      for(const link of links){
        const count=link.querySelector<HTMLElement>('[data-wishlist-count]')!;
        count.hidden=ids===null;
        if(ids){count.textContent=String(ids.size);link.setAttribute('aria-label',link.dataset.countLabel!.replace('{count}',String(ids.size)));}
        else {count.textContent='';link.setAttribute('aria-label',link.dataset.baseLabel!);}
        link.dataset.wishlistLoading=String(busy && ids===null);
        link.setAttribute('aria-busy',String(busy));
      }
      for(const button of buttons){
        button.hidden=false;button.disabled=disabled;
        const saved=ids?.has(button.dataset.favoriteId!)??false;
        const label=(saved?button.dataset.remove:button.dataset.save)!;
        button.setAttribute('aria-pressed',String(saved));
        button.setAttribute('aria-label',`${label}: ${button.dataset.favoriteTitle}`);
        button.querySelector('[data-favorite-label]')!.textContent=label;
      }
      let visible=0;
      for(const item of items){item.hidden=!ids?.has(item.dataset.tripId!);if(!item.hidden)visible++;}
      if(empty)empty.hidden=ids===null || busy || visible>0;
    },
    focusAfterRemoval(button:HTMLButtonElement){
      if(button.closest<HTMLElement>('[data-wishlist-item]')?.hidden){
        (items.find(item=>!item.hidden)?.querySelector<HTMLButtonElement>('[data-favorite]')
          ??page?.querySelector<HTMLAnchorElement>('.wishlist-browse'))?.focus();
      }
    },
  };
}
