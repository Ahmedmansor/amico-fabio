import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {seoFiles} from '../build-seo.mjs';
async function scenario(run){const folder=await fs.mkdtemp(path.join(os.tmpdir(),'fabio-seo-'));try{await run(folder,pathToFileURL(folder+path.sep));}finally{await fs.rm(folder,{recursive:true,force:true});}}
const html=(locale,other=true)=>`<title>Fabio</title><meta name="description" content="Tour"><link rel="canonical" href="https://fabioegypt.com/${locale}/"><link hreflang="${locale}" href="https://fabioegypt.com/${locale}/">${other?`<link hreflang="${locale==='it'?'en':'it'}" href="https://fabioegypt.com/${locale==='it'?'en':'it'}/">`:''}`;
async function page(folder,file,body){const target=path.join(folder,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,body);}
const build=dir=>seoFiles().hooks['astro:build:done']({dir,logger:{info(){}}});
test('sitemap includes actual canonical equivalents and excludes redirects and noindex',()=>scenario(async(folder,dir)=>{
 await page(folder,'it/index.html',html('it'));await page(folder,'en/index.html',html('en'));await page(folder,'404.html','<meta name="robots" content="noindex, follow">');await page(folder,'index.html','<meta http-equiv="refresh" content="0;url=/it/">');await build(dir);
 const sitemap=await fs.readFile(new URL('sitemap.xml',dir),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,2);assert.ok(!sitemap.includes('404'));assert.ok((await fs.readFile(new URL('robots.txt',dir),'utf8')).includes('Sitemap: https://fabioegypt.com/sitemap.xml'));
}));
test('build rejects missing canonical rather than silently publishing it',()=>scenario(async(folder,dir)=>{await page(folder,'it/index.html','<title>Fabio</title>');await assert.rejects(build(dir),/incorrect canonical/);}));
test('build rejects absent language equivalents',()=>scenario(async(folder,dir)=>{await page(folder,'it/index.html',html('it',false));await assert.rejects(build(dir),/Missing equivalent en/);}));
