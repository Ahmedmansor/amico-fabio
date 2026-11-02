import {effectiveTheme,resolveThemePreference,type ThemePreference} from '../domain/theme';
import {readThemePreference,saveThemePreference,themeStorageKey} from '../data/preference';
const system = matchMedia('(prefers-color-scheme: dark)');
let preference: ThemePreference = readThemePreference();
function apply() {
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = effectiveTheme(preference,system.matches);
  document.querySelectorAll<HTMLElement>('[data-theme-option]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeOption===preference)));
}
function init() {
  apply();
  document.querySelectorAll<HTMLButtonElement>('[data-theme-option]').forEach(button=>{
    if(button.dataset.themeBound)return;
    button.dataset.themeBound='true';
    button.addEventListener('click',()=>{
      preference=resolveThemePreference(button.dataset.themeOption);
      saveThemePreference(preference);apply();
    });
  });
}
system.addEventListener('change',()=>{if(preference==='system')apply();});
window.addEventListener('storage',event=>{if(event.key===themeStorageKey||event.key===null){preference=resolveThemePreference(event.newValue);apply();}});
document.addEventListener('astro:page-load',init);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
