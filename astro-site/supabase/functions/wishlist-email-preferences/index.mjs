// Backend entry only. Not deployed. Never import this file from Astro/browser code.
import {createClient} from '@supabase/supabase-js';
import {readPreferenceRuntimeConfig,createPreferenceFetch} from '../../../src/features/reminders/data/preference-runtime-config.ts';
import {createPreferenceRuntime} from '../../../src/features/reminders/presentation/preferences-runtime.ts';
import configuration from './configuration.json' with {type:'json'};

let handle;
try{
  if(!configuration.enabled)throw new Error('Activation not approved.');
  const config=readPreferenceRuntimeConfig(name=>Deno.env.get(name)??configuration[name]);
  const url=Deno.env.get('SUPABASE_URL');
  // Built-in server environment only. No local secret file, logs or browser config.
  const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default;
  const backendKey=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
  if(!url||!publicKey?.startsWith('sb_publishable_')||!backendKey?.startsWith('sb_secret_'))throw new Error('Runtime unavailable.');
  const clientOptions={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:createPreferenceFetch(fetch,config.networkTimeoutMs,config.maxUpstreamBytes)}};
  // No per-request Authorization is set on the privileged client.
  handle=createPreferenceRuntime({config,authClient:createClient(url,publicKey,clientOptions),backendClient:createClient(url,backendKey,clientOptions)});
}catch{
  // Fail closed without logging credentials or configuration values.
  handle=async()=>new Response(JSON.stringify({error:'unavailable'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
Deno.serve(handle);
