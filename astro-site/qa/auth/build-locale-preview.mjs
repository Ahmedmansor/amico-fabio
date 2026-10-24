import {writeFile,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const route=new URL('src/pages/[locale]/qa-account-locale.astro',root);
const source=`---
import EmailLocaleSettings from '../../features/auth/presentation/EmailLocaleSettings.astro';
import {supportedLocales,languages} from '../../shared/config/languages';
import {siteConfig} from '../../shared/config/site';
import '../../shared/styles/global.css';
import '../../shared/styles/legacy-shell.css';
import '../../features/auth/presentation/auth.css';
export function getStaticPaths(){return supportedLocales.map(locale=>({params:{locale},props:{locale}}));}
const {locale}=Astro.props;
const path='/'+locale+'/qa-account-locale/';
---
<html lang={locale}><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/>
<title>Account locale QA</title><meta name="description" content="Synthetic local account-language preview"/>
<meta name="robots" content="noindex,nofollow"/><link rel="canonical" href={new URL(path,siteConfig.url).href}/>
{supportedLocales.map(code=><link rel="alternate" hreflang={code} href={new URL('/'+code+'/qa-account-locale/',siteConfig.url).href}/>)}
</head><body><main class="auth-content" style="max-width:480px;margin:auto;">
<p>Synthetic account preview. No real account, subscription or email is created.</p>
<button class="auth-button" type="button" data-qa-a>Test account A</button>
<button class="auth-button" type="button" data-qa-b>Test account B</button>
<button class="auth-button" type="button" data-qa-out>Guest</button>
<nav>{supportedLocales.map(code=><a class="auth-privacy" data-lang={code} href={'/'+code+'/qa-account-locale/'}>{languages[code].label}</a>)}</nav>
<EmailLocaleSettings locale={locale}/></main>
<script>import {mountLocaleFixture} from '../../../qa/auth/locale-fixture';mountLocaleFixture();</script>
</body></html>`;
await writeFile(route,source,{flag:'wx'});
try{
  const status=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir','.astro/account-locale-ui'],{
      cwd:fileURLToPath(root),stdio:'inherit',env:{...process.env,PUBLIC_NOINDEX:'1',PUBLIC_SITE_URL:'http://127.0.0.1:4334',PUBLIC_ACCOUNT_LOCALE_ENABLED:'0'},
    });
    child.once('error',reject);child.once('exit',code=>resolve(code??1));
  });
  if(status!==0)throw new Error(`Locale preview build failed (${status}).`);
}finally{await unlink(route);}
