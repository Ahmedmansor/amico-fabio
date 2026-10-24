import type {SupabaseClient} from '@supabase/supabase-js';
import {createPreferenceRepository} from '../data/preferences-repository.ts';
import {createPreferenceService} from '../data/preferences-service.ts';
import {createPreferenceUserVerifier} from '../data/preference-user.ts';
import {createPreferenceLimiter} from '../data/preference-limiter.ts';
import type {PreferenceRuntimeConfig} from '../data/preference-runtime-config.ts';
import {createPreferenceHandler} from './preferences-handler.ts';

/** Backend-only composition. Auth and data clients MUST remain separate;
 * the caller's Authorization header never replaces the backend credential. */
export function createPreferenceRuntime(options:{
  authClient:Pick<SupabaseClient,'auth'>;
  backendClient:Pick<SupabaseClient,'rpc'|'from'>;
  config:PreferenceRuntimeConfig;
}){
  const {config}=options;
  return createPreferenceHandler({
    service:createPreferenceService(createPreferenceRepository(options.backendClient,config.networkTimeoutMs)),
    verifyUser:createPreferenceUserVerifier(options.authClient),
    limiter:createPreferenceLimiter(options.backendClient,config.ratePolicy),
    allowedOrigins:config.allowedOrigins,maxBodyBytes:config.maxBodyBytes,bodyTimeoutMs:config.bodyTimeoutMs,
  });
}
