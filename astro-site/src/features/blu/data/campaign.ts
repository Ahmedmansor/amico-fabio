import it from './content/it.json';
import en from './content/en.json';
import {languages} from '../../../shared/config/languages';
import {validateTranslations} from '../../../shared/i18n/validate';
import {bluId, bluPaths, bluLocales, experienceIds, isBluLocale, validateCampaign} from '../domain/campaign';
const dictionaries = {it,en};
export type BluCopy = typeof it;
export function getBluCampaign(locale: string) {
  validateTranslations(dictionaries,bluLocales,'it');
  for (const language of bluLocales) {
    if (!Object.hasOwn(languages,language)) throw new Error(`[blu] Unknown shared language ${language}.`);
    validateCampaign(dictionaries[language],language);
  }
  if (new Set(Object.values(bluPaths)).size !== bluLocales.length) throw new Error('[blu] Duplicate campaign route.');
  if (!isBluLocale(locale)) throw new Error(`[blu:${locale}] Campaign translation is not published.`);
  const copy=dictionaries[locale];
  const experiences=experienceIds.map((id,index) => {
    const n=index+1;
    const title=copy[`card${n}Title` as keyof BluCopy];
    const description=copy[`card${n}Desc` as keyof BluCopy];
    const tag=copy[`card${n}Tag` as keyof BluCopy];
    const button=copy[`card${n}Btn` as keyof BluCopy];
    return {id,title,description,tag,button};
  });
  return {id:bluId,locale,path:bluPaths[locale],alternates:bluPaths,copy,experiences};
}
export type BluCampaign = ReturnType<typeof getBluCampaign>;
