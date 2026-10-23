import { browserAuth } from '../../auth/data/browser';
import type { AuthConfig } from '../../auth/data/config';
import { browserSupabase } from '../../../shared/data/browser-client';
import { createAccountRepository } from '../data/account-repository';
import { createGuestMergePort, browserGuestLock } from '../data/guest-merge';
import { browserGuestStorage, guestWishlistPrefix } from '../data/guest-storage';
import { createWishlistCoordinator, type WishlistState } from '../data/coordinator';
import type { getWishlistMessages } from '../data/messages';
import { createWishlistView } from './wishlist-view';

export async function initializeAccountWishlist(){
  const node=document.getElementById('wishlist-config');if(!node)return;
  const config=JSON.parse(node.textContent!) as {auth:AuthConfig;locale:string;publishedIds:string[];messages:ReturnType<typeof getWishlistMessages>};
  const m=config.messages,view=createWishlistView();
  const status=view.page?.querySelector<HTMLElement>('[data-wishlist-sync-status]');
  const retry=view.page?.querySelector<HTMLButtonElement>('[data-wishlist-sync-retry]');
  const error=view.page?.querySelector<HTMLElement>('[data-wishlist-error]');
  const storageMessage=view.page?.querySelector<HTMLElement>('[data-wishlist-storage-message]');
  const unavailable=view.page?.querySelector<HTMLElement>('[data-wishlist-catalog-notice]');
  view.render(null,true);
  const guest=createGuestMergePort(browserGuestStorage(),browserGuestLock());
  const [service,client]=await Promise.all([browserAuth(config.auth),browserSupabase(config.auth)]);
  const coordinator=createWishlistCoordinator(createAccountRepository(client),guest,config.publishedIds,config.locale);
  let authFailed=false;
  let resolvingAuth=true;
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('fabio:wishlist:account:v1'):null;
  const announce=()=>channel?.postMessage({userId:coordinator.getState().userId});
  function render(state:WishlistState){
    const ids=state.ids?new Set(state.ids):null;
    view.render(ids,resolvingAuth || state.busy,resolvingAuth || state.busy || (state.status==='error' && !ids));
    if(storageMessage)storageMessage.textContent=state.userId?(state.busy?m.syncing:!ids?'':m.account):m.local;
    if(error){error.hidden=!state.error || state.error==='confirmation';error.textContent=state.userId?m.syncError:m.unavailable;}
    if(status)status.textContent=authFailed?m.authUnavailable:state.busy?'':state.error==='confirmation'?m.confirmMerge:state.pendingGuest?m.pendingGuest:'';
    if(retry){retry.hidden=!state.userId || (!state.error && !state.pendingGuest);retry.disabled=state.busy;}
    if(unavailable)unavailable.hidden=!state.ids?.some(id=>!config.publishedIds.includes(id));
  }
  coordinator.subscribe(render);
  for(const button of view.buttons)button.addEventListener('click',async()=>{
    const message=button.parentElement!.querySelector<HTMLElement>('[data-favorite-error]')!;
    message.hidden=true;const focused=document.activeElement===button;
    const result=await coordinator.save(button.dataset.favoriteId!,button.getAttribute('aria-pressed')!=='true');
    if(!result.ok && result.reason!=='stale'){message.textContent=button.dataset.error!;message.hidden=false;}
    else if(focused)view.focusAfterRemoval(button);
    if(result.ok)announce();
  });
  retry?.addEventListener('click',()=>{void coordinator.merge().then(result=>{if(result.ok)announce();});});
  let revision=0,currentUser:string|null|undefined;
  function connect(userId:string|null){
    if(currentUser===userId)return;
    currentUser=userId;authFailed=false;resolvingAuth=false;
    void coordinator.connect(userId).then(result=>{if(result.ok)announce();});
  }
  service?.subscribe(session=>{revision++;connect(session?.userId??null);});
  const before=revision;
  const restored=service?await service.currentSession():{ok:false as const};
  if(before===revision){
    connect(restored.ok?restored.value?.userId??null:null);
    if(!restored.ok){authFailed=true;render(coordinator.getState());}
  }
  let refreshQueued=false;
  function refresh(){
    if(refreshQueued || coordinator.getState().busy)return;
    refreshQueued=true;queueMicrotask(()=>{refreshQueued=false;void coordinator.refresh();});
  }
  window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
  if(channel)channel.onmessage=event=>{if(event.data?.userId===currentUser)refresh();};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  window.addEventListener('storage',event=>{
    if(event.key===null || event.key.startsWith(guestWishlistPrefix) || event.key.startsWith('fabio:wishlist:ack:'))refresh();
  });
}
