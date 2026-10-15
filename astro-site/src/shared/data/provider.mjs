import { existsSync,readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { resolve } from 'node:path';
import { googleSheetsProvider } from './google-sheets.mjs';
import { createSupabaseProvider } from './supabase.mjs';

/** Explicit rollback only; a failed Supabase request never selects Sheets. */
export function createConfiguredProvider(settings,fetchImpl=fetch){
  const name=settings.CATALOG_PROVIDER||'supabase';
  if(name==='sheets')return googleSheetsProvider;
  if(name!=='supabase')throw new Error('[catalog] CATALOG_PROVIDER must be supabase or sheets.');
  return createSupabaseProvider({url:settings.CATALOG_SUPABASE_URL,publishableKey:settings.CATALOG_SUPABASE_PUBLISHABLE_KEY,fetchImpl});
}
let selected;
export function readCatalogSettings(){
  // This dedicated ignored file contains only catalog provider/public-key settings.
  // Never read privileged import env files or browser-prefixed credentials.
  // Astro relocates server modules during prerender; use the documented app cwd.
  const file=resolve(process.cwd(),'.env.catalog');
  const settings=existsSync(file)?parseEnv(readFileSync(file,'utf8')):{};
  for(const key of ['CATALOG_PROVIDER','CATALOG_SUPABASE_URL','CATALOG_SUPABASE_PUBLISHABLE_KEY']){
    if(process.env[key]!==undefined)settings[key]=process.env[key];
  }
  return settings;
}
export function getCatalogProvider(){
  if(!selected){
    selected=createConfiguredProvider(readCatalogSettings());
  }
  return selected;
}
