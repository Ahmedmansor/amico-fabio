import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),folder='supabase/functions/wishlist-reminder-dispatch/',files=new Map();
const configPath=process.argv[2];
if(configPath&&configPath!=='.astro/reminder-dispatch-settings.json')throw new Error('Only the named ignored nonsecret settings file is allowed.');
const example=JSON.parse(await readFile(new URL(folder+'configuration.example.json',root),'utf8'));
const config=configPath?JSON.parse(await readFile(new URL(configPath,root),'utf8')):example;
if(Object.keys(config).some(key=>!Object.keys(example).includes(key)))throw new Error('Unknown dispatch setting; never include credentials.');
files.set(folder+'configuration.json',JSON.stringify(config,null,2)+'\n');
async function collect(name){
  if(files.has(name))return;
  if(![folder,'src/features/','src/shared/'].some(prefix=>name.startsWith(prefix)))throw new Error('Unexpected package source.');
  const content=await readFile(new URL(name,root),'utf8');files.set(name,content);
  for(const match of content.matchAll(/\b(?:from\s+|import\s*)['"]([^'"]+)['"]/g))if(match[1].startsWith('.')){
    const url=new URL(match[1],new URL(name,root));if(!url.href.startsWith(root.href))throw new Error('Dependency outside project.');
    await collect(decodeURIComponent(url.href.slice(root.href.length)));
  }
}
await collect(folder+'index.mjs');await collect(folder+'deno.json');
const output=new URL('.astro/reminder-dispatch-function/',root);await mkdir(output,{recursive:true});
const payload={name:'wishlist-reminder-dispatch',entrypoint_path:folder+'index.mjs',verify_jwt:false,files:[...files].map(([name,content])=>({name,content}))};
await writeFile(new URL('proposed-upload.json',output),JSON.stringify(payload,null,2)+'\n');
await writeFile(new URL('manifest.json',output),JSON.stringify({status:config.enabled?'requires-explicit-activation':'disabled-local-package',files:payload.files.map(file=>({name:file.name,sha256:createHash('sha256').update(file.content).digest('hex')}))},null,2)+'\n');
console.log(`Prepared ${files.size} dispatch source/config files; enabled=${config.enabled===true}. No credentials, upload, schedule or mail.`);
