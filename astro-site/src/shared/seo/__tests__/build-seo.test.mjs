import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {seoFiles} from '../build-seo.mjs';
import {supportedLocales} from '../../config/languages.ts';
async function scenario(run){const folder=await fs.mkdtemp(path.join(os.tmpdir(),'fabio-seo-'));try{await run(folder,pathToFileURL(folder+path.sep));}finally{await fs.rm(folder,{recursive:true,force:true});}}
const html=(locale,other=true)=>`<title>Fabio</title><meta name="description" content="Tour"><link rel="canonical" href="https://fabioegypt.com/${locale}/">${(other?supportedLocales:[locale]).map(language=>`<link hreflang="${language}" href="https://fabioegypt.com/${language}/">`).join('')}`;
async function page(folder,file,body){const target=path.join(folder,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,body);}
const build=dir=>seoFiles().hooks['astro:build:done']({dir,logger:{info(){}}});
test('sitemap includes actual canonical equivalents and excludes redirects and noindex',()=>scenario(async(folder,dir)=>{
 for(const locale of supportedLocales)await page(folder,`${locale}/index.html`,html(locale));await page(folder,'404.html','<meta name="robots" content="noindex, follow">');await page(folder,'index.html','<meta http-equiv="refresh" content="0;url=/it/">');await build(dir);
 const sitemap=await fs.readFile(new URL('sitemap.xml',dir),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,supportedLocales.length);assert.ok(!sitemap.includes('404'));assert.ok((await fs.readFile(new URL('robots.txt',dir),'utf8')).includes('Sitemap: https://fabioegypt.com/sitemap.xml'));
}));
test('build rejects missing canonical rather than silently publishing it',()=>scenario(async(folder,dir)=>{await page(folder,'it/index.html','<title>Fabio</title>');await assert.rejects(build(dir),/incorrect canonical/);}));
test('build rejects absent language equivalents',()=>scenario(async(folder,dir)=>{await page(folder,'it/index.html',html('it',false));await assert.rejects(build(dir),/Missing equivalent en/);}));
test('test flavor validates canonical equivalents but emits no indexable sitemap URLs',()=>scenario(async(folder,dir)=>{for(const locale of supportedLocales)await page(folder,`${locale}/index.html`,'<meta name="robots" content="noindex, follow">'+html(locale));await seoFiles({noindex:true}).hooks['astro:build:done']({dir,logger:{info(){}}});assert.ok(!(await fs.readFile(new URL('sitemap.xml',dir),'utf8')).includes('<loc>'));}));

const blogHtml=(route,alternates=[])=>`<title>Article</title><meta name="description" content="Article"><link rel="canonical" href="https://fabioegypt.com${route}">${alternates.map(([locale,url])=>`<link hreflang="${locale}" href="https://fabioegypt.com${url}">`).join('')}`;
test('blog translations can have different slugs and retain reciprocal sitemap links',()=>scenario(async(folder,dir)=>{
 const links=[['it','/it/blog/guida/'],['en','/en/blog/guide/']];
 await page(folder,'it/blog/guida/index.html',blogHtml('/it/blog/guida/',links));
 await page(folder,'en/blog/guide/index.html',blogHtml('/en/blog/guide/',links));
 await build(dir);const sitemap=await fs.readFile(new URL('sitemap.xml',dir),'utf8');
 assert.ok(sitemap.includes('/it/blog/guida/'));assert.ok(sitemap.includes('/en/blog/guide/'));
}));
test('unpaired blog article and unmatched pagination need no invented equivalent',()=>scenario(async(folder,dir)=>{
 await page(folder,'it/blog/solo/index.html',blogHtml('/it/blog/solo/'));
 await page(folder,'it/blog/page/2/index.html',blogHtml('/it/blog/page/2/'));
 await build(dir);assert.ok((await fs.readFile(new URL('sitemap.xml',dir),'utf8')).includes('/it/blog/page/2/'));
}));
test('place guide alternates describe actual guides without inventing an unapproved language',()=>scenario(async(folder,dir)=>{
 await page(folder,'en/egypt/luxor/index.html',blogHtml('/en/egypt/luxor/'));
 await build(dir);assert.ok((await fs.readFile(new URL('sitemap.xml',dir),'utf8')).includes('/en/egypt/luxor/'));
}));
test('blog alternates still reject missing target pages and missing self reference',()=>scenario(async(folder,dir)=>{
 await page(folder,'it/blog/guida/index.html',blogHtml('/it/blog/guida/',[['en','/en/blog/guide/']]));
 await assert.rejects(build(dir),/self-reference/);
 await page(folder,'it/blog/guida/index.html',blogHtml('/it/blog/guida/',[['it','/it/blog/guida/'],['en','/en/blog/guide/']]));
 await assert.rejects(build(dir),/nonreciprocal/);
}));
