import { createClient, type SupabaseClient } from '@supabase/supabase-js';
interface BrowserClientConfig { url:string; publishableKey:string; siteOrigin:string }
let instance: Promise<SupabaseClient | null> | undefined;
let identity: string | undefined;

/** One browser SDK client for Auth and feature-owned tables; no catalog env. */
export function browserSupabase(config: BrowserClientConfig | null): Promise<SupabaseClient | null> {
  if (!config) return Promise.resolve(null);
  const requested = `${config.url}|${config.publishableKey}|${config.siteOrigin}`;
  if (identity && identity !== requested) return Promise.resolve(null);
  identity = requested;
  instance ??= (async () => {
    try {
      if (window.location.origin !== config.siteOrigin) return null;
      const storage = window.localStorage;
      const probe = 'fabio:auth:storage-probe';
      storage.setItem(probe, '1');
      if (storage.getItem(probe) !== '1') return null;
      storage.removeItem(probe);
      return createClient(config.url, config.publishableKey, { auth: {
        flowType:'pkce', detectSessionInUrl:false, persistSession:true,
        autoRefreshToken:true, storage, storageKey:'fabio:auth:session:v1',
      } });
    } catch { return null; }
  })();
  return instance;
}
