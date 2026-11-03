import type {Locale} from './languages';
/** Only approved, actually published translations. Campaigns need not use every site language. */
export const campaignLanguagePaths={
  blu:{it:'/it/blu/',en:'/en/blu/'},
} as const satisfies Record<string,Partial<Record<Locale,string>>>;
