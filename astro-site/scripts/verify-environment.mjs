import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {siteConfig} from '../src/shared/config/site.ts';
const origin=process.argv[2]||siteConfig.url,test=origin!==siteConfig.url,rows=[];let checked=0;
function scan(folder){for(const file of fs.readdirSync(folder,{withFileTypes:true})){const target=path.join(folder,file.name);if(file.isDirectory()){scan(target);continue;}if(!file.name.endsWith('.html'))continue;
 const html=fs.readFileSync(target,'utf8'),route='/'+path.relative('dist',target).replaceAll('\\','/').replace(/index\.html$/,'');
 if(file.name==='404.html'||/http-equiv="refresh"/i.test(html))continue;
 const meta=key=>html.match(new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*content="([^"]*)"`))?.[1];
 assert.equal(meta('robots'),test?'noindex, follow':'index, follow',route);
 assert.ok(html.includes(`rel="canonical" href="${siteConfig.url}${route}"`),route);
 assert.equal(meta('og:url'),origin+route,route);assert.equal(meta('twitter:url'),origin+route,route);
 for(const key of ['og:image','twitter:image']){const url=new URL(meta(key));assert.equal(url.origin,origin,`${route}: wrong image host`);assert.ok(fs.existsSync(path.join('dist',decodeURIComponent(url.pathname))),`${route}: image absent from its own build`);}
 for(const match of html.matchAll(/<(a|link|img|script|source)\b[^>]*?\s(?:href|src)="([^"]+)"[^>]*>/g)){const tag=match[0],value=match[2];if(/^(mailto:|tel:|data:|javascript:)/.test(value))continue;const url=new URL(value,origin+route);if(test&&url.origin===siteConfig.url){assert.ok(/rel="canonical"|hreflang=/.test(tag),`${route}: production dependency ${value}`);}if(url.origin===origin){const filePath=path.join('dist',decodeURIComponent(url.pathname));assert.ok(fs.existsSync(filePath)||fs.existsSync(path.join(filePath,'index.html')),`${route}: missing local asset/link ${value}`);checked++;}}
 rows.push({route,image:meta('og:image')});
}}
scan('dist');assert.equal(fs.readFileSync('dist/robots.txt','utf8'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
const home=fs.readFileSync('dist/en/index.html','utf8');assert.ok(home.includes('<title>Fabio Egypt | Private Italian Guide - Sharm, Cairo &amp; Luxor</title>')||home.includes('<title>Fabio Egypt | Private Italian Guide - Sharm, Cairo & Luxor</title>'));
fs.mkdirSync('qa/environments',{recursive:true});fs.writeFileSync(`qa/environments/${test?'test':'production'}.json`,JSON.stringify({origin,noindex:test,pages:rows.length,localReferences:checked,rows},null,2)+'\n');
console.log(`${test?'TEST':'PRODUCTION'}: ${rows.length} pages use their own ${origin} for social URLs and images; ${checked} local references exist. Canonicals remain production; English home title verified.`);
