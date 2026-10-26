import { browserAuth } from '../../auth/data/browser';
import {getAccountState} from '../../auth/data/account-state';
import type { AuthConfig } from '../../auth/data/config';
import { browserSupabase } from '../../../shared/data/browser-client';
import { createAccountRepository } from '../data/account-repository';
import { createGuestMergePort, browserGuestLock } from '../data/guest-merge';
import { browserGuestStorage, guestWishlistPrefix, guestPackagePrefix } from '../data/guest-storage';
import { createWishlistCoordinator, type WishlistState } from '../data/coordinator';
import type { getWishlistMessages } from '../data/messages';
import { createWishlistView } from './wishlist-view';
import { canOfferSignIn, dismissSignInInvitation, invitationDismissalKey } from '../data/invitation-storage';
import { canShowGuestInvitation } from '../domain/invitation';
import { readInitialWishlistIds } from '../data/wishlist-cache';

export async function initializeAccountWishlist(){
  const node=document.getElementById('wishlist-config');if(!node)return;
  const config=JSON.parse(node.textContent!) as {auth:AuthConfig;locale:string;publishedIds:string[];messages:ReturnType<typeof getWishlistMessages>};
  const m=config.messages,view=createWishlistView();
  const status=view.page?.querySelector<HTMLElement>('[data-wishlist-sync-status]');
  const retry=view.page?.querySelector<HTMLButtonElement>('[data-wishlist-sync-retry]');
  const error=view.page?.querySelector<HTMLElement>('[data-wishlist-error]');
  const storageMessage=view.page?.querySelector<HTMLElement>('[data-wishlist-storage-message]');
  const unavailable=view.page?.querySelector<HTMLElement>('[data-wishlist-catalog-notice]');
  const invitation=document.querySelector<HTMLElement>('[data-wishlist-invitation]');
  let invitationClosed=false;
  const initial=readInitialWishlistIds();
  view.render(initial.ids.size > 0 ? initial.ids : null, false);
  const guest=createGuestMergePort(browserGuestStorage(),browserGuestLock());
  const [service,client]=await Promise.all([browserAuth(config.auth),browserSupabase(config.auth)]);
  const coordinator=createWishlistCoordinator(createAccountRepository(client),guest,config.publishedIds,config.locale);
  let authFailed=false;
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('fabio:wishlist:account:v1'):null;
  const announce=()=>channel?.postMessage({userId:coordinator.getState().userId});
  let previousGuestCount = 0;
  const initialGuest = guest.read();
  if (initialGuest.ok) previousGuestCount = initialGuest.value.length;

  type WishlistSyncEventReport =
    | { status: 'none' }
    | { status: 'syncing' }
    | { status: 'synced'; count: number }
    | { status: 'failed'; reason?: string };

  function broadcastWishlistSync(report: WishlistSyncEventReport) {
    if (typeof window !== 'undefined') {
      (window as unknown as {__fabio_wishlist_sync?: WishlistSyncEventReport}).__fabio_wishlist_sync = report;
      window.dispatchEvent(new CustomEvent('fabio:wishlist:sync', { detail: report }));
    }
  }

  function render(state:WishlistState){
    if (state.userId) {
      if (state.busy || state.status === 'loading') {
        if (previousGuestCount > 0) {
          broadcastWishlistSync({ status: 'syncing' });
        }
      } else if (state.status === 'account') {
        if (previousGuestCount > 0) {
          const count = previousGuestCount;
          previousGuestCount = 0;
          broadcastWishlistSync({ status: 'synced', count });
        } else {
          broadcastWishlistSync({ status: 'none' });
        }
      } else if (state.status === 'error') {
        if (previousGuestCount > 0) {
          broadcastWishlistSync({ status: 'failed', reason: state.error ?? 'failed' });
        }
      }
    } else {
      const currentGuest = guest.read();
      previousGuestCount = currentGuest.ok ? currentGuest.value.length : 0;
      broadcastWishlistSync({ status: 'none' });
    }
    if(state.userId && invitation)invitation.hidden=true;
    if(!state.userId && service && !authFailed && !invitationClosed && invitation){
      const count=state.ids?.length ?? 0;
      const allowed=canOfferSignIn(browserGuestStorage(),Date.now());
      invitation.hidden=!(allowed.ok && allowed.value && canShowGuestInvitation(count, null, Date.now()));
    }
    const inlineReminder=view.page?.querySelector<HTMLElement>('[data-wishlist-inline-reminder]');
    if(inlineReminder)inlineReminder.hidden=!state.userId || inlineReminder.dataset.subscribed==='true';
    const ids=state.ids?new Set(state.ids):initial.ids;
    view.render(ids,state.busy,state.busy || (state.status==='error' && !ids));
    if(storageMessage)storageMessage.textContent=state.userId?(state.busy?m.syncing:!ids?'':m.account):m.local;
    if(error){error.hidden=!state.error || state.error==='confirmation';error.textContent=state.userId?m.syncError:state.ids?m.error:m.unavailable;}
    const canMerge=state.pendingGuest>state.unavailableGuest;
    if(status)status.textContent=authFailed?m.authUnavailable:state.busy?'':state.error==='confirmation'?m.confirmMerge:canMerge?m.pendingGuest:'';
    if(retry){retry.hidden=!state.userId || (!state.error && !canMerge);retry.disabled=state.busy;}
    if(unavailable)unavailable.hidden=!state.unavailableGuest && !state.ids?.some(id=>!config.publishedIds.includes(id));
    if(state.unavailableGuest && view.page?.querySelector('[data-wishlist-empty]'))view.page.querySelector<HTMLElement>('[data-wishlist-empty]')!.hidden=true;
  }
  coordinator.subscribe(render);
  for(const button of view.buttons)button.addEventListener('click',async()=>{
    const message=button.parentElement!.querySelector<HTMLElement>('[data-favorite-error]')!;
    message.hidden=true;const focused=document.activeElement===button;
    const desired=button.getAttribute('aria-pressed')!=='true';
    const result=await coordinator.save(button.dataset.favoriteId!,desired);
    if(!result.ok && result.reason!=='stale'){message.textContent=button.dataset.error!;message.hidden=false;}
    else if(focused)view.focusAfterRemoval(button);
    if(result.ok)announce();
    const guestCount=coordinator.getState().ids?.length ?? 0;
    if(result.ok && desired && !coordinator.getState().userId && canShowGuestInvitation(guestCount, null, Date.now()) && service && !authFailed && !invitationClosed && invitation){
      const allowed=canOfferSignIn(browserGuestStorage(),Date.now());
      if(allowed.ok && allowed.value)invitation.hidden=false;
    }
  });
  document.querySelector('[data-wishlist-invite-dismiss]')?.addEventListener('click',()=>{
    invitationClosed=true;if(invitation)invitation.hidden=true;
    dismissSignInInvitation(browserGuestStorage(),Date.now());
  });
  document.querySelector('[data-wishlist-invite-signin]')?.addEventListener('click',()=>{invitationClosed=true;if(invitation)invitation.hidden=true;});
  view.page?.querySelector('[data-wishlist-inline-reminder-enable]')?.addEventListener('click',()=>{
    const reminderPrefs=document.querySelector<HTMLElement>('[data-reminder-preferences]');
    if(reminderPrefs){
      reminderPrefs.hidden=false;
      reminderPrefs.scrollIntoView({behavior:'smooth'});
      reminderPrefs.querySelector<HTMLInputElement>('[data-reminder-choice]')?.focus();
    }
  });
  retry?.addEventListener('click',()=>{void coordinator.merge().then(result=>{if(result.ok)announce();});});
  let currentUser:string|null|undefined;
  function connect(userId:string|null){
    if(currentUser===userId)return;
    currentUser=userId;authFailed=false;
    void coordinator.connect(userId);
  }
  if(service)getAccountState(service).subscribe(state=>{
    if(state.status==='loading'){render(coordinator.getState());return;}
    connect(state.session?.userId??null);
    authFailed=state.status==='failed';render(coordinator.getState());
  });
  else{connect(null);authFailed=true;render(coordinator.getState());}
  let refreshQueued=false;
  function refresh(){
    if(refreshQueued || coordinator.getState().busy)return;
    refreshQueued=true;queueMicrotask(()=>{refreshQueued=false;void coordinator.refresh();});
  }
  window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
  if(channel)channel.onmessage=event=>{if(event.data?.userId===currentUser)refresh();};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  window.addEventListener('storage',event=>{
    if(event.key===invitationDismissalKey){const allowed=canOfferSignIn(browserGuestStorage(),Date.now());if(allowed.ok && !allowed.value && invitation)invitation.hidden=true;}
    if(event.key===null || event.key.startsWith(guestWishlistPrefix) || event.key.startsWith(guestPackagePrefix) || event.key.startsWith('fabio:wishlist:ack:') || event.key.startsWith('fabio:wishlist:account:'))refresh();
  });
}
