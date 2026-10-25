import fs from 'node:fs/promises';
import {siteConfig} from '../config/site.ts';
import {supportedLocales} from '../config/languages.ts';
const xml=value=>value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function seoFiles({noindex=false,assetOrigin=siteConfig.url}={}){return {name:'fabio-seo',hooks:{'astro:build:done':async({dir,logger})=>{
 const entries=[];
 async function visit(folder){for(const item of await fs.readdir(folder,{withFileTypes:true})){const url=new URL(item.name+(item.isDirectory()?'/':''),folder);if(item.isDirectory())await visit(url);else if(item.name.endsWith('.html')){
  const html=await fs.readFile(url,'utf8');
  if(item.name==='404.html'||/<meta\b[^>]*http-equiv="refresh"/i.test(html)||url.pathname.includes('/email-preview/'))continue;
  const blocked=/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html);
  if(noindex&&!blocked)throw new Error(`[SEO:${url.pathname}] Test page is missing noindex.`);
  if(blocked&&!noindex)continue;
  const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  const relative=decodeURIComponent(url.pathname.slice(dir.pathname.length));
  const expected=new URL('/'+relative.replace(/index\.html$/,''),siteConfig.url).href;
  if(canonical!==expected)throw new Error(`[SEO:${relative}] Missing or incorrect canonical: ${canonical}; expected ${expected}.`);
  if(!/<title>[^<]+<\/title>/.test(html)||!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/.test(html))throw new Error(`[SEO:${relative}] Missing title or description.`);
  const alternates=Array.from(html.matchAll(/<link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g),m=>({locale:m[1],href:m[2]}));
  if(new Set(alternates.map(a=>a.locale)).size!==alternates.length)throw new Error(`[SEO:${relative}] Duplicate hreflang.`);
  entries.push({canonical,alternates});
 }}}
 await visit(dir);
 const urls=new Map(entries.map(entry=>[entry.canonical,entry]));
 if(urls.size!==entries.length)throw new Error('[SEO] Duplicate canonical URL.');
 for(const entry of entries){const path=new URL(entry.canonical).pathname,locale=path.split('/')[1];
  if(supportedLocales.includes(locale))for(const language of supportedLocales){const expected=new URL(path.replace(/^\/[^/]+\//,`/${language}/`),siteConfig.url).href;if(!entry.alternates.some(a=>a.locale===language&&a.href===expected))throw new Error(`[SEO:${path}] Missing equivalent ${language} hreflang.`);}
  for(const alternate of entry.alternates){const target=urls.get(alternate.href);if(!target||!target.alternates.some(a=>a.href===entry.canonical))throw new Error(`[SEO:${path}] Missing or nonreciprocal hreflang ${alternate.href}.`);}
 }
 entries.sort((a,b)=>a.canonical.localeCompare(b.canonical));
 const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+(noindex?[]:entries).map(entry=>`  <url><loc>${xml(entry.canonical)}</loc>${entry.alternates.map(a=>`<xhtml:link rel="alternate" hreflang="${xml(a.locale)}" href="${xml(a.href)}"/>`).join('')}</url>`).join('\n')+'\n</urlset>\n';
 await fs.writeFile(new URL('sitemap.xml',dir),sitemap);
 await fs.writeFile(new URL('robots.txt',dir),`User-agent: *\nAllow: /\n\nSitemap: ${assetOrigin}/sitemap.xml\n`);
 logger.info(`Verified canonical and reciprocal hreflang for ${entries.length} indexable pages; generated sitemap.xml and robots.txt.`);
 if(noindex)logger.info('Test flavor: all content is noindex; sitemap has no indexable URLs.');
}}};}
