import {writeFile,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url);
const route=new URL('src/pages/[locale]/qa-reminder-preferences.astro',root);
const source=`---
import ReminderPreferences from '../../features/reminders/presentation/ReminderPreferences.astro';
import {supportedLocales} from '../../shared/config/languages';
import {siteConfig} from '../../shared/config/site';
import '../../shared/styles/global.css';
import '../../shared/styles/legacy-shell.css';
export function getStaticPaths(){return supportedLocales.map(locale=>({params:{locale},props:{locale}}));}
const {locale}=Astro.props;
const path='/'+locale+'/qa-reminder-preferences/';
---
<html lang={locale}><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/>
<title>Reminder preference QA</title><meta name="description" content="Synthetic local reminder preference preview"/>
<meta name="robots" content="noindex,nofollow"/><link rel="canonical" href={new URL(path,siteConfig.url).href}/>
{supportedLocales.map(language=><link rel="alternate" hreflang={language} href={new URL('/'+language+'/qa-reminder-preferences/',siteConfig.url).href}/>)}
</head><body><main style="max-width:900px;margin:auto;padding:48px 16px;">
<p>QA preview — synthetic accounts only. No subscription or email is created.</p>
<button type="button" class="reminder-button" data-qa-account>{locale==='it'?'Mostra account di prova':'Show test account'}</button>
<button type="button" class="reminder-button" data-qa-signout>{locale==='it'?'Nascondi account di prova':'Hide test account'}</button>
<ReminderPreferences locale={locale}/></main>
<script>import {mountPreferenceFixture} from '../../../qa/reminders/preferences-fixture';mountPreferenceFixture();</script>
</body></html>
`;
// Refuse to overwrite an existing source file. Always remove only our fixture.
await writeFile(route,source,{flag:'wx'});
try{
  const status=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir','.astro/reminder-preferences-ui'],{
      cwd:fileURLToPath(root),stdio:'inherit',env:{...process.env,PUBLIC_NOINDEX:'1',PUBLIC_SITE_URL:'http://127.0.0.1:4331'},
    });
    child.once('error',reject);child.once('exit',code=>resolve(code??1));
  });
  if(status!==0)throw new Error(`Preference preview build failed (${status}).`);
}finally{await unlink(route);}
