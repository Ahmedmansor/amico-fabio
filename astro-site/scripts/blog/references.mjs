import { readFile } from 'node:fs/promises';
import { authors } from '../../src/features/blog/data/authors.ts';
import { supportedLocales } from '../../src/shared/config/languages.ts';
const {targets,policy}=JSON.parse(await readFile(new URL('../../.astro/editorial/index.json',import.meta.url),'utf8'));
console.log('Validated editorial snapshot — '+new Date(policy.evaluatedAt).toISOString());
for(const lang of supportedLocales){
  console.log('\n'+lang.toUpperCase()+' — published references and owned aliases');
  for(const target of targets.filter(target=>target.lang===lang)){
    console.log(target.kind+':'+target.id+' -> '+target.url+' | '+target.title);
    for(const alias of new Set(target.aliases))console.log('  '+JSON.stringify(alias)+' — '+target.source);
  }
}
console.log('\nApproved author IDs');
for(const[id,author]of Object.entries(authors))console.log(id+': '+author.name+' ('+author.type+')');
if(!Object.keys(authors).length)console.log('None configured. Real publication requires an approved author.');
