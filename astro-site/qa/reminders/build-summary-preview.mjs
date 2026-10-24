import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const status=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir','.astro/reminder-summary-ui'],{
    cwd:fileURLToPath(new URL('../../',import.meta.url)),stdio:'inherit',env:{...process.env,
      PUBLIC_NOINDEX:'1',PUBLIC_SITE_URL:'http://127.0.0.1:4332',PUBLIC_AUTH_ENABLED:'1',
      PUBLIC_AUTH_SUPABASE_URL:'https://auth-qa.invalid',PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_test',
      PUBLIC_AUTH_SITE_URL:'http://127.0.0.1:4332',PUBLIC_AUTH_GOOGLE_ENABLED:'1',PUBLIC_AUTH_EMAIL_ENABLED:'0',
      PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED:'1',PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'1',
      PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT:'https://auth-qa.invalid/functions/v1/wishlist-email-test',
    },
  });child.once('error',reject);child.once('exit',code=>resolve(code??1));
});
if(status!==0)process.exitCode=status;
