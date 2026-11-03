// Explicitly synthetic transport: never uses real Auth credentials or sends mail.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const origin='http://127.0.0.1:4332';
const env={...process.env,PUBLIC_NOINDEX:'1',PUBLIC_SITE_URL:origin,
 PUBLIC_AUTH_ENABLED:'1',PUBLIC_AUTH_SUPABASE_URL:'https://auth-qa.invalid',
 PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_qa',PUBLIC_AUTH_SITE_URL:origin,
 PUBLIC_AUTH_GOOGLE_ENABLED:'1',PUBLIC_AUTH_EMAIL_ENABLED:'1',PUBLIC_AUTH_PASSWORD_ENABLED:'1',
 PUBLIC_AUTH_TURNSTILE_SITE_KEY:'synthetic-key',PUBLIC_AUTH_RESEND_SECONDS:'60',
 PUBLIC_MARKETING_CONSENT_ENABLED:'1',PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED:'0',
 PUBLIC_ACCOUNT_LOCALE_ENABLED:'0',PUBLIC_ACCOUNT_ONBOARDING_ENABLED:'0',
 PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED:'0',PUBLIC_WISHLIST_EMAIL_MANAGEMENT_ENABLED:'0',
 PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'0',BLOG_INCLUDE_FIXTURES:'0'};
const code=await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir','.astro/marketing-activation-qa'],{cwd:fileURLToPath(root),stdio:'inherit',env});
 child.once('error',reject);child.once('exit',value=>resolve(value??1));
});
if(code!==0)throw new Error(`Synthetic marketing build failed (${code}).`);
