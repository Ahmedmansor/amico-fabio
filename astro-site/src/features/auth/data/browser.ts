import type { AuthConfig } from './config';
import { createAuthService, type AuthService } from './service';
import { browserSupabase } from '../../../shared/data/browser-client';
let instance: Promise<AuthService | null> | undefined;

/** Auth owns session access; feature tables share the neutral SDK connection. */
export function browserAuth(config: AuthConfig | null): Promise<AuthService | null> {
  if (!config) return Promise.resolve(null);
  instance ??= browserSupabase(config).then(client => client ? createAuthService(client, config) : null);
  return instance;
}
