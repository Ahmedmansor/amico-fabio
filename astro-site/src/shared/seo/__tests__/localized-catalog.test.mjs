import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {seoFiles} from '../build-seo.mjs';
import {supportedLocales} from '../../config/languages.ts';
async function scenario(check){
  const folder=await fs.mkdtemp(path.join(os.tmpdir(),'fabio-localized-'));
  const paths=Object.fromEntries(supportedLocales.map(lang=>[lang,`/${lang}/tours/title-${lang}/`]));
  const put=async(route,html)=>{const file=path.join(folder,route,'index.html');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,html);};
  const html=(lang,links=paths)=>`<title>Tour</title><meta name="description" content="Tour"><link rel="canonical" href="https://fabioegypt.com${paths[lang]}">${Object.entries(links).map(([language,url])=>`<link hreflang="${language}" href="https://fabioegypt.com${url}">`).join('')}`;
  const build=()=>seoFiles().hooks['astro:build:done']({dir:pathToFileURL(folder+path.sep),logger:{info(){}}});
  try{for(const lang of supportedLocales)await put(paths[lang],html(lang));await check({folder,paths,put,html,build});}
  finally{await fs.rm(folder,{recursive:true,force:true});}
}
test('localized catalog sitemap uses reciprocal translated slugs and excludes aliases',()=>scenario(async({folder,put,build})=>{
  await put('/it/tours/old_id/','<meta http-equiv="refresh" content="0;url=/it/tours/title-it/">');
  await build();const xml=await fs.readFile(path.join(folder,'sitemap.xml'),'utf8');
  assert.equal((xml.match(/<loc>/g)||[]).length,5);assert.ok(!xml.includes('old_id'));
}));
test('localized catalog build rejects missing language or nonreciprocal targets',()=>scenario(async({paths,put,html,build})=>{
  await put(paths.it,html('it',{it:paths.it}));await assert.rejects(build(),/Missing equivalent|nonreciprocal/);
  await put(paths.it,html('it',{...paths,en:'/en/tours/not-built/'}));await assert.rejects(build(),/nonreciprocal/);
}));
test('localized catalog build requires canonical self-reference',()=>scenario(async({paths,put,html,build})=>{
  await put(paths.it,html('it',{...paths,it:'/it/tours/not-self/'}));await assert.rejects(build(),/self-reference/);
}));
