import { browserGuestStorage, guestWishlistPrefix, guestPackagePrefix, readGuestWishlist, saveGuestFavorite } from '../data/guest-storage';
import { createWishlistView } from './wishlist-view';

if(document.getElementById('wishlist-config')){
  void import('./account-interactions').then(module=>module.initializeAccountWishlist());
}else{
  const view=createWishlistView();
  const pageError=view.page?.querySelector<HTMLElement>('[data-wishlist-error]');
  let lastIds:Set<string>|null=null;
  function refresh(){
    const result=readGuestWishlist(browserGuestStorage());
    if(result.ok)lastIds=new Set(result.value);
    view.render(lastIds);
    if(pageError){pageError.hidden=result.ok;pageError.textContent=result.ok?'':view.page!.dataset.unavailable!;}
  }
  for(const button of view.buttons)button.addEventListener('click',()=>{
    const error=button.parentElement!.querySelector<HTMLElement>('[data-favorite-error]')!;
    error.hidden=true;
    const focused=document.activeElement===button;
    const result=saveGuestFavorite(browserGuestStorage(),button.dataset.favoriteId!,button.getAttribute('aria-pressed')!=='true');
    if(!result.ok){error.textContent=button.dataset.error!;error.hidden=false;return;}
    refresh();if(focused)view.focusAfterRemoval(button);
  });
  window.addEventListener('storage',event=>{
    const storage=browserGuestStorage();
    if(storage && event.storageArea===storage && (event.key===null || event.key.startsWith(guestWishlistPrefix) || event.key.startsWith(guestPackagePrefix) || event.key.startsWith('fabio:wishlist:ack:')))refresh();
  });
  window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);refresh();
}
