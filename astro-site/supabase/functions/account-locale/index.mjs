// Separate backend entry. Disabled locally; no deployment or Astro runtime route.
import {createClient} from '@supabase/supabase-js';
import {createLocaleHandler} from '../../../src/features/auth/presentation/locale-handler.ts';
import {createLocaleService} from '../../../src/features/auth/data/locale-service.ts';
import {createLocaleRepository} from '../../../src/features/auth/data/locale-repository.ts';
// Entry-level composition reuses verified Auth/network/rate-limit adapters;
// neither feature imports the other, preserving the feature dependency direction.
import {createPreferenceUserVerifier} from '../../../src/features/reminders/data/preference-user.ts';
import {createPreferenceLimiter} from '../../../src/features/reminders/data/preference-limiter.ts';
import {readPreferenceRuntimeConfig,createPreferenceFetch} from '../../../src/features/reminders/data/preference-runtime-config.ts';
import configuration from './configuration.json' with {type:'json'};

let handle;
try {
  if (!configuration.enabled) throw new Error('Not activated.');
  const config=readPreferenceRuntimeConfig(name=>Deno.env.get(name)??configuration[name]);
  const url=Deno.env.get('SUPABASE_URL');
  const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default;
  const backendKey=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
  if (!url||!publicKey?.startsWith('sb_publishable_')||!backendKey?.startsWith('sb_secret_')) throw new Error('Unavailable.');
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:createPreferenceFetch(fetch,config.networkTimeoutMs,config.maxUpstreamBytes)}};
  const authClient=createClient(url,publicKey,options),backendClient=createClient(url,backendKey,options);
  handle=createLocaleHandler({service:createLocaleService(createLocaleRepository(backendClient,config.networkTimeoutMs)),
    verifyUser:createPreferenceUserVerifier(authClient),limiter:createPreferenceLimiter(backendClient,config.ratePolicy),
    allowedOrigins:config.allowedOrigins,maxBodyBytes:config.maxBodyBytes,bodyTimeoutMs:config.bodyTimeoutMs});
} catch {
  handle=async()=>new Response(JSON.stringify({error:'unavailable'}),{status:503,
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
Deno.serve(handle);
