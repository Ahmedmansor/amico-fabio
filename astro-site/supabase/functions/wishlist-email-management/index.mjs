// Separate disabled backend capability service; never an Astro runtime route.
import {createClient} from '@supabase/supabase-js';
import {readManagementRuntimeConfig} from '../../../src/features/reminders/data/management-runtime-config.ts';
import {createManagementRuntime} from '../../../src/features/reminders/presentation/management-runtime.ts';
import {createPreferenceFetch} from '../../../src/features/reminders/data/preference-runtime-config.ts';
import configuration from './configuration.json' with {type:'json'};
let handle;
try{
  if(!configuration.enabled)throw new Error('Not activated.');
  const config=readManagementRuntimeConfig(name=>Deno.env.get(name)??configuration[name]);
  const url=Deno.env.get('SUPABASE_URL');
  const backendKey=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
  if(!url||!backendKey?.startsWith('sb_secret_'))throw new Error('Unavailable.');
  const client=createClient(url,backendKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:createPreferenceFetch(fetch,config.networkTimeoutMs,config.maxUpstreamBytes)}});
  handle=createManagementRuntime(client,config);
}catch{
  handle=async()=>Response.json({error:'unavailable'},{status:503,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
// verify_jwt=false only with in-function capability checks and ingress gate.
Deno.serve(handle);
