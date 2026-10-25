// Disabled package. Runtime bindings stay server-only. No data/key logging.
import {createClient} from '@supabase/supabase-js';
import configuration from './configuration.json' with {type:'json'};
import {readDispatchConfig} from '../../../src/features/reminders/data/dispatch-config.ts';
import {createPreferenceFetch} from '../../../src/features/reminders/data/preference-runtime-config.ts';
import {createDispatchRuntime} from '../../../src/features/reminders/presentation/dispatch-runtime.ts';
let handle;
try{
  if(configuration.enabled!==true)throw new Error('Not activated.');
  const config=readDispatchConfig(configuration),supabaseUrl=Deno.env.get('SUPABASE_URL');
  const backendKey=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default,apiKey=Deno.env.get('BREVO_API_KEY');
  if(!supabaseUrl||!backendKey?.startsWith('sb_secret_')||!apiKey)throw new Error('Unavailable.');
  const client=createClient(supabaseUrl,backendKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:createPreferenceFetch(fetch,config.policy.timeoutMs,config.maxResponseBytes)}});
  handle=await createDispatchRuntime({client,config,supabaseUrl,backendKey,apiKey,fetcher:fetch});
}catch{handle=async()=>Response.json({error:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
Deno.serve(handle);
