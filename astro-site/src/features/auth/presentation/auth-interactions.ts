import {browserAuth} from '../data/browser';
import {getAccountState} from '../data/account-state';
import {authReturnPaths,defaultAuthReturn,type AuthConfig} from '../data/config';
import {safeReturnPath,type AccountSession} from '../domain/auth';
import type {getAuthMessages} from '../data/messages';
import type {Locale} from '../../../shared/config/languages';
import type {LocaleBrowserConfig} from '../data/locale-browser-config';
import type {getLocaleMessages} from '../data/locale-messages';
import {saveCachedAuthProfile,clearCachedAuthProfile} from '../data/auth-cache';
import {clearAccountWishlistCache} from '../../wishlist/data/wishlist-cache';
import {clearAllCachedPreferences} from '../../reminders/data/preferences-cache';

/** Shared session/profile and signed-in account controls only. Login-specific
 * validation and CAPTCHA have their own page entry. */
async function initialize(){
  const node=document.getElementById('auth-config');if(!node)return;
  const {config,messages:m,locale,localeSettings}=JSON.parse(node.textContent!) as {config:AuthConfig;messages:ReturnType<typeof getAuthMessages>;locale:Locale;localeSettings?:{config:LocaleBrowserConfig;messages:ReturnType<typeof getLocaleMessages>}|null};
  const dialog=document.querySelector<HTMLDialogElement>('[data-auth-dialog]')!;
  const triggers=[...document.querySelectorAll<HTMLAnchorElement>('[data-auth-open]')];
  const status=dialog.querySelector<HTMLElement>('[data-auth-status]')!;
  const signout=dialog.querySelector<HTMLButtonElement>('[data-auth-signout]')!;
  const returnPath=safeReturnPath(location.pathname,authReturnPaths(location.pathname),defaultAuthReturn(locale));
  const login=`/${locale}/login/?redirect=${encodeURIComponent(returnPath)}`;
  let session:AccountSession|null=null,ready=false,pending=false,opener:HTMLElement|null=null;
  const service=await browserAuth(config);
  const localeRoot=dialog.querySelector<HTMLElement>('[data-locale-settings]');
  const localeBinding=service&&localeSettings&&localeRoot?(await import('./locale-interactions')).bindAccountLocale({root:localeRoot,service,activeLocale:locale,...localeSettings}):null;
  function render(){
    if(ready)localeBinding?.setAccount(session?.userId??null);
    for(const entry of document.querySelectorAll<HTMLElement>('[data-auth-entry-guest]'))entry.hidden=!ready||!!session;
    for(const profile of document.querySelectorAll<HTMLElement>('[data-auth-profile]')){
      profile.hidden=!session;
      profile.querySelector('[data-auth-name]')!.textContent=session?.profile.displayName??'';
      profile.querySelector<HTMLElement>('[data-auth-name-row]')!.hidden=!session?.profile.displayName;
      profile.querySelector('[data-auth-email]')!.textContent=session?.profile.email??'';
      profile.querySelector<HTMLElement>('[data-auth-email-row]')!.hidden=!session?.profile.email;
    }
    for(const image of document.querySelectorAll<HTMLImageElement>('[data-auth-avatar]')){
      const fallback=image.parentElement!.querySelector<HTMLElement>('[data-auth-avatar-fallback]')!;
      const url=session?.profile.avatarUrl;
      if(url){if(image.getAttribute('src')!==url)image.src=url;image.hidden=false;fallback.hidden=true;}
      else{image.removeAttribute('src');image.hidden=true;fallback.hidden=false;}
      image.parentElement!.dataset.avatarLoading=String(!ready);
    }
    for(const trigger of triggers){
      trigger.href=login;
      const first=session?.profile.displayName?.trim().split(/\s+/u)[0];
      const label=session?(first?m.greeting.replace('{name}',first):m.accountTitle):m.signIn;
      const labelNode=trigger.querySelector('.auth-trigger-label');
      if(labelNode)labelNode.textContent=label;else trigger.textContent=label;
      trigger.setAttribute('aria-label',label);trigger.setAttribute('aria-busy',String(!ready));
      if(session)trigger.setAttribute('aria-haspopup','dialog');else trigger.removeAttribute('aria-haspopup');
      if(!trigger.classList.contains('auth-trigger'))trigger.hidden=!ready;
    }
    signout.disabled=!ready||!service||pending;
    document.getElementById('global-header')?.setAttribute('data-session-pending',String(!ready));
    if(!session&&dialog.open)dialog.close();
  }
  for(const image of document.querySelectorAll<HTMLImageElement>('[data-auth-avatar]'))image.addEventListener('error',()=>{image.hidden=true;image.parentElement!.querySelector<HTMLElement>('[data-auth-avatar-fallback]')!.hidden=false;});
  for(const trigger of triggers)trigger.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    if(!ready){event.preventDefault();return;}
    if(!session)return;
    event.preventDefault();opener=trigger;status.hidden=true;dialog.showModal();localeBinding?.refresh();signout.focus();
  });
  dialog.querySelector('[data-auth-close]')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.focus());
  signout.addEventListener('click',async()=>{
    if(!service||pending)return;pending=true;render();const result=await service.signOut();pending=false;
    if(result.ok){clearCachedAuthProfile();clearAccountWishlistCache();clearAllCachedPreferences();location.replace(`/${locale}/`);return;}
    status.textContent=m.failed;status.hidden=false;render();
  });
  render();
  if(service)getAccountState(service).subscribe(state=>{
    ready=state.status!=='loading';session=state.session;
    if(state.status==='ready'){if(session)saveCachedAuthProfile(session);else clearCachedAuthProfile();}
    if(state.status==='failed'){clearCachedAuthProfile();status.textContent=m.failed;status.hidden=false;}
    render();
  });else{ready=true;render();}
  if(new URLSearchParams(location.search).get('auth')==='open')location.replace(login);
}
void initialize();
