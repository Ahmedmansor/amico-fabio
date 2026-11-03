import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const env={...process.env,PUBLIC_NOINDEX:'1',PUBLIC_SITE_URL:'http://127.0.0.1:4335',
  PUBLIC_AUTH_ENABLED:'1',PUBLIC_AUTH_SUPABASE_URL:'https://auth-qa.invalid',
  PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_qa',PUBLIC_AUTH_SITE_URL:'http://127.0.0.1:4335',
  PUBLIC_AUTH_GOOGLE_ENABLED:'1',PUBLIC_AUTH_EMAIL_ENABLED:'0',PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED:'1',
  PUBLIC_ACCOUNT_LOCALE_ENABLED:'1',PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'0'};
const code=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir','.astro/account-locale-auth'],
    {cwd:fileURLToPath(root),stdio:'inherit',env});
  child.once('error',reject);child.once('exit',value=>resolve(value??1));
});
if(code!==0)throw new Error(`Synthetic Auth/locale build failed (${code}).`);
