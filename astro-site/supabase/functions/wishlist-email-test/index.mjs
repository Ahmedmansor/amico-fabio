// Restricted email test entry. Actual configuration is generated
// into an ignored upload artifact, never into the public site or committed file.
import {createClient} from '@supabase/supabase-js';
import configuration from './configuration.json' with {type:'json'};
import {createPreferenceFetch} from '../../../src/features/reminders/data/preference-runtime-config.ts';
import {createPreferenceUserVerifier} from '../../../src/features/reminders/data/preference-user.ts';
import {createEmailAccountSource} from '../../../src/features/reminders/data/email-account-source.ts';
import {createEmailCatalogSource} from '../../../src/features/reminders/data/email-catalog-source.ts';
import {createBrevoDelivery} from '../../../src/features/reminders/data/brevo-delivery.ts';
import {createWishlistSummarySender} from '../../../src/features/reminders/presentation/send-wishlist-summary.ts';
import {createSummaryTestHandler} from '../../../src/features/reminders/presentation/summary-test-handler.ts';
import {createSummaryTestLedger} from '../../../src/features/reminders/data/summary-test-ledger.ts';

let handler;
try{
  if(configuration.enabled!==true)throw new Error('Test disabled.');
  const url=Deno.env.get('SUPABASE_URL');
  const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default;
  const backendKey=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;
  const apiKey=Deno.env.get('BREVO_API_KEY');
  if(!url||!publicKey?.startsWith('sb_publishable_')||!backendKey?.startsWith('sb_secret_')||!apiKey)throw new Error('Runtime unavailable.');
  const clientOptions={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:createPreferenceFetch(fetch,configuration.timeoutMs,configuration.maxResponseBytes)}};
  const backend=createClient(url,backendKey,clientOptions),auth=createClient(url,publicKey,clientOptions);
  const catalog=createEmailCatalogSource({url:configuration.catalogOrigin+'/tours-manifest.json',origin:configuration.catalogOrigin,
      environment:'test',maxAgeMs:configuration.catalogMaxAgeMs,now:Date.now,fetcher:fetch,
      timeoutMs:configuration.timeoutMs,maxResponseBytes:configuration.maxResponseBytes});
  const delivery=createBrevoDelivery({apiKey,sender:{email:configuration.senderEmail,name:configuration.senderName},allowedRecipients:[configuration.recipient],
      isDispatchAllowed:()=>Date.now()>=configuration.createdAt&&Date.now()<configuration.expiresAt,
      fetcher:fetch,timeoutMs:configuration.timeoutMs,maxResponseBytes:configuration.maxResponseBytes,maxRequestBytes:configuration.maxRequestBytes});
  const senderForBearer=bearer=>createWishlistSummarySender({environment:'test',catalog,delivery,
    account:createEmailAccountSource(backend,createClient(url,publicKey,{
      ...clientOptions,accessToken:async()=>bearer,
    }),[configuration.recipient],configuration.timeoutMs),
  });
  handler=createSummaryTestHandler({senderForBearer,verifyUser:createPreferenceUserVerifier(auth),...configuration,
    ...(configuration.durableTests?{ledger:createSummaryTestLedger(backend,configuration.timeoutMs)}:{}),bodyTimeoutMs:configuration.timeoutMs,now:Date.now});
}catch{
  handler=async()=>new Response(JSON.stringify({error:'unavailable'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
Deno.serve(handler);
