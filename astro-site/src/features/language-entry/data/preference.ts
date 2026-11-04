import {explicitLanguage} from '../domain/preference';
import type {Locale} from '../../../shared/config/languages';
// Preserve the keys already written by the site's explicit language switcher.
export function readLanguageChoice():Locale|null {
  try{return explicitLanguage(localStorage.getItem('fabio_lang'),localStorage.getItem('preferredLanguage'));}
  catch{return null;}
}
export function saveLanguageChoice(locale:Locale):void {
  for(const key of ['fabio_lang','preferredLanguage'])try{localStorage.setItem(key,locale);}catch{/* Links work when storage is denied. */}
}
