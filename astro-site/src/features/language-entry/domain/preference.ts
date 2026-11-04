import {defaultLocale,isLocale,type Locale} from '../../../shared/config/languages.ts';

export type LanguageSuggestion = {locale:Locale;kind:'suggestion'|'return'};

/** Only explicit stored choices outrank browser hints. Never chooses a redirect. */
export function languageSuggestion(stored:unknown,browserLanguages:readonly string[]):LanguageSuggestion|null {
  if(isLocale(stored))return stored===defaultLocale?null:{locale:stored,kind:'return'};
  for(const tag of browserLanguages){
    const locale=tag.trim().toLowerCase().split(/[-_]/)[0];
    if(isLocale(locale))return locale===defaultLocale?null:{locale,kind:'suggestion'};
  }
  return null;
}

export function explicitLanguage(...values:unknown[]):Locale|null {
  return values.find(isLocale)??null;
}
