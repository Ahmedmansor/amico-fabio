import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),folder='supabase/functions/wishlist-email-test/';
const files=new Map();
// Default is a disabled source review package. An enabled, authorized job is
// supplied only through this ignored nonsecret configuration file.
const configPath=process.argv[2];
if(configPath&&configPath!=='.astro/reminder-email-test-job.json')throw new Error('Use only the named ignored test-job configuration.');
const configuration=JSON.parse(await readFile(new URL(configPath||folder+'configuration.example.json',root),'utf8'));
const allowed=Object.keys(JSON.parse(await readFile(new URL(folder+'configuration.example.json',root),'utf8')));
if(Object.keys(configuration).some(key=>!allowed.includes(key)))throw new Error('Unknown test configuration key; never include credentials.');
files.set(folder+'configuration.json',JSON.stringify(configuration,null,2)+'\n');
async function collect(name){
  if(files.has(name))return;
  if(!name.startsWith('src/features/')&&!name.startsWith('src/shared/')&&!name.startsWith(folder))throw new Error('Source outside explicit feature roots.');
  const content=await readFile(new URL(name,root),'utf8');files.set(name,content);
  for(const match of content.matchAll(/\b(?:from\s+|import\s*)['"]([^'"]+)['"]/g)){
    if(!match[1].startsWith('.'))continue;
    const url=new URL(match[1],new URL(name,root));if(!url.href.startsWith(root.href))throw new Error('Dependency outside project.');
    await collect(decodeURIComponent(url.href.slice(root.href.length)));
  }
}
await collect(folder+'index.mjs');await collect(folder+'deno.json');
const output=new URL('.astro/reminder-email-test-function/',root);await mkdir(output,{recursive:true});
const payload={name:'wishlist-email-test',entrypoint_path:folder+'index.mjs',verify_jwt:false,files:[...files].map(([name,content])=>({name,content}))};
await writeFile(new URL('proposed-upload.json',output),JSON.stringify(payload,null,2)+'\n');
await writeFile(new URL('manifest.json',output),JSON.stringify({status:configuration.enabled?'requires-explicit-deployment-approval':'disabled-review-package',files:payload.files.map(file=>({name:file.name,sha256:createHash('sha256').update(file.content).digest('hex')}))},null,2)+'\n');
console.log(`Prepared ${files.size} source/config files for the restricted Brevo test; enabled=${configuration.enabled===true}. No key read, upload or email sent.`);
