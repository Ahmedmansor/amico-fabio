// Generate a reviewed initial import locally. Never connects to Supabase.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/shared/domain/csv.ts';
import { importColumns } from '../src/shared/data/catalog-import.mjs';
const root = new URL('../supabase/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('import/manifest.json',root),'utf8'));
const schema=await readFile(new URL('schema.sql',root),'utf8');
assert.equal(createHash('sha256').update(schema).digest('hex'),manifest.schemaSha256,'Schema checksum changed since review.');
const names=Object.keys(importColumns);
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const lines=['begin;',`lock table ${names.map(name=>`public.${name}`).join(', ')} in share row exclusive mode;`,
  `do $guard$ begin if ${names.map(name=>`exists(select 1 from public.${name})`).join(' or ')} then raise exception 'Initial catalog import requires all five tables to be empty; no rows changed.'; end if; end $guard$;`];
for(const name of names){
  const body=await readFile(new URL(`import/${name}.csv`,root),'utf8');
  assert.equal(createHash('sha256').update(body).digest('hex'),manifest.files[name].sha256,`${name}: CSV checksum mismatch.`);
  const rows=parseCsv(body,name);
  assert.equal(rows.length,manifest.files[name].rows,`${name}: Row count mismatch.`);
  if(rows.length) lines.push(`insert into public.${name} (${importColumns[name].map(key=>`"${key}"`).join(', ')}) values\n${rows.map(row=>`(${importColumns[name].map(key=>quote(row[key])).join(', ')})`).join(',\n')};`);
}
lines.push('commit;');
const sql=lines.join('\n')+'\n';
await mkdir(new URL('local/',root),{recursive:true});
await writeFile(new URL('local/import-reviewed.sql',root),sql);
console.log(JSON.stringify({schema,importSql:sql,importSha256:createHash('sha256').update(sql).digest('hex')}));
