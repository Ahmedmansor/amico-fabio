import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {seoFiles} from '../build-seo.mjs';

test('campaign SEO requires exactly its approved reciprocal translations',async()=>{
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'fabio-blu-seo-'));
 const html=(locale,extra='')=>`<title>Blu</title><meta name="description" content="Campaign"><link rel="canonical" href="https://fabioegypt.com/${locale}/blu/"><link hreflang="it" href="https://fabioegypt.com/it/blu/"><link hreflang="en" href="https://fabioegypt.com/en/blu/">${extra}`;
 const put=async(locale,value)=>{const file=path.join(folder,locale,'blu','index.html');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,value);};
 const build=()=>seoFiles().hooks['astro:build:done']({dir:pathToFileURL(folder+path.sep),logger:{info(){}}});
 try{
  for(const locale of ['it','en'])await put(locale,html(locale));
  await build();
  assert.match(await fs.readFile(path.join(folder,'sitemap.xml'),'utf8'),/\/en\/blu\//);
  await put('it',html('it','<link hreflang="es" href="https://fabioegypt.com/es/blu/">'));
  await assert.rejects(build(),/unpublished translation/);
  await put('it',html('it').replace('<link hreflang="en" href="https://fabioegypt.com/en/blu/">',''));
  await assert.rejects(build(),/Missing campaign en|nonreciprocal hreflang/);
 }finally{await fs.rm(folder,{recursive:true,force:true});}
});
