import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),base='supabase/functions/wishlist-email-management/';
const names=[base+'index.mjs',base+'deno.json',base+'configuration.json',
  'src/features/reminders/presentation/management-runtime.ts','src/features/reminders/presentation/management-handler.ts',
  'src/features/reminders/data/management-runtime-config.ts','src/features/reminders/data/management-repository.ts',
  'src/features/reminders/data/management-service.ts','src/features/reminders/data/preference-runtime-config.ts',
  'src/features/reminders/domain/management.ts','src/features/reminders/domain/preferences.ts',
  'src/features/reminders/domain/preference-limits.ts','src/shared/config/languages.ts'];
const files=await Promise.all(names.map(async name=>({name,content:await readFile(new URL(name,root),'utf8')})));
for(const file of files)for(const match of file.content.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)){
  if(!match[1].startsWith('.'))continue;
  const dependency=new URL(match[1],new URL(file.name,root));
  if(!files.some(candidate=>new URL(candidate.name,root).href===dependency.href))throw new Error(`Missing package dependency: ${file.name}`);
}
const output=new URL('.astro/management-function/',root);await mkdir(output,{recursive:true});
await writeFile(new URL('proposed-upload.json',output),JSON.stringify({name:'wishlist-email-management',entrypoint_path:names[0],verify_jwt:false,files},null,2)+'\n');
await writeFile(new URL('manifest.json',output),JSON.stringify({status:'local-disabled-not-deployed',files:files.map(file=>({name:file.name,sha256:createHash('sha256').update(file.content).digest('hex')}))},null,2)+'\n');
console.log(`Prepared ${files.length} explicit files with complete imports. Disabled; no secrets, upload or deployment.`);
