import it from './content/it.json' with {type:'json'};
import en from './content/en.json' with {type:'json'};
import {defaultLocale,supportedLocales,type Locale} from '../../../shared/config/languages.ts';
import {validateTranslations} from '../../../shared/i18n/validate.ts';
import {validateGuide,validateGuideImageIdentity} from '../domain/secrets.ts';
import {getAvailableGuideImages} from './assets.mjs';
const dictionaries={it,en};
export function getGuidePage(locale:Locale) {
  validateTranslations(dictionaries,supportedLocales,defaultLocale);
  const page=dictionaries[locale];
  validateGuide(page,locale,getAvailableGuideImages(page.content,locale));
  validateGuideImageIdentity(dictionaries[defaultLocale].content,page.content,locale);
  return page;
}
