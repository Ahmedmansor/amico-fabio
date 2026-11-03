import {writeFile,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),route=new URL('src/pages/[locale]/qa-marketing-card.astro',root);
await writeFile(route,`---
import Preview from '../../../qa/marketing-design/Preview.astro';
import {supportedLocales} from '../../shared/config/languages';
export function getStaticPaths(){return supportedLocales.map(locale=>({params:{locale},props:{locale}}));}
const {locale}=Astro.props;
---
<Preview locale={locale}/>
`,{flag:'wx'});
try{
 const status=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','build','--outDir','.astro/marketing-card-ui'],{cwd:fileURLToPath(root),stdio:'inherit',env:{...process.env,PUBLIC_NOINDEX:'1',BLOG_INCLUDE_FIXTURES:'1',PUBLIC_SITE_URL:'http://127.0.0.1:4338',PUBLIC_AUTH_SITE_URL:'http://127.0.0.1:4338'}});
  child.once('error',reject);child.once('exit',code=>resolve(code??1));
 });
 if(status!==0)throw new Error(`Marketing card preview build failed (${status}).`);
}finally{await unlink(route);}
