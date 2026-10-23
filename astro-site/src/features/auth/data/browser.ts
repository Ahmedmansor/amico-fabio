import type { AuthConfig } from './config';
import { createAuthService, type AuthService } from './service';
let instance: Promise<AuthService | null> | undefined;

/** Lazily load the SDK only when Auth is explicitly configured. Never reuse catalog env. */
export function browserAuth(config: AuthConfig | null): Promise<AuthService | null> {
  if (!config) return Promise.resolve(null);
  instance ??= (async () => {
    try {
      if (window.location.origin !== config.siteOrigin) return null;
      const storage = window.localStorage;
      const probe = 'fabio:auth:storage-probe';
      storage.setItem(probe, '1');
      if (storage.getItem(probe) !== '1') return null;
      storage.removeItem(probe);
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(config.url, config.publishableKey, { auth: {
        flowType: 'pkce', detectSessionInUrl: false, persistSession: true,
        autoRefreshToken: true, storage, storageKey: 'fabio:auth:session:v1',
      } });
      return createAuthService(client, config);
    } catch { return null; }
  })();
  return instance;
}
