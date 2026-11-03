import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const names=[
  'supabase/functions/account-locale/index.mjs',
  'supabase/functions/account-locale/deno.json',
  'supabase/functions/account-locale/configuration.json',
  'src/features/auth/presentation/locale-handler.ts',
  'src/features/auth/data/locale-service.ts',
  'src/features/auth/data/locale-repository.ts',
  'src/features/auth/domain/locale-preference.ts',
  'src/shared/config/languages.ts',
  'src/features/reminders/data/preference-runtime-config.ts',
  'src/features/reminders/data/preference-user.ts',
  'src/features/reminders/data/preference-limiter.ts',
  'src/features/reminders/domain/preference-limits.ts',
  'src/features/reminders/domain/preferences.ts',
];
const files=await Promise.all(names.map(async name=>({name,content:await readFile(new URL(name,root),'utf8')})));
for(const file of files)for(const match of file.content.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)){
  if(!match[1].startsWith('.'))continue;
  const dependency=new URL(match[1],new URL(file.name,root));
  if(!files.some(candidate=>new URL(candidate.name,root).href===dependency.href))
    throw new Error(`Unpackaged dependency in ${file.name}: ${match[1]}`);
}
const output=new URL('.astro/account-locale-function/',root);await mkdir(output,{recursive:true});
await writeFile(new URL('proposed-upload.json',output),JSON.stringify({name:'account-locale',entrypoint_path:names[0],verify_jwt:false,files},null,2)+'\n');
await writeFile(new URL('manifest.json',output),JSON.stringify({status:'local-only-not-deployed',files:files.map(file=>({name:file.name,sha256:createHash('sha256').update(file.content).digest('hex')}))},null,2)+'\n');
console.log(`Prepared ${files.length} explicit source/config files; imports complete. No secrets read, no upload or deployment.`);
