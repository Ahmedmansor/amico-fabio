import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {siteConfig} from '../src/shared/config/site.ts';
const files=[];
function visit(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const target=path.join(folder,entry.name);if(entry.isDirectory())visit(target);else files.push(target);}}
visit('dist');
assert.ok(fs.readFileSync('dist/CNAME').equals(fs.readFileSync('../public/CNAME')),'Generated CNAME must preserve the original domain file.');
const htmlFiles=files.filter(file=>file.endsWith('.html')),issues=[],placeholders=[];let checked=0;
const decode=text=>text.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');
function targetFor(url){const pathname=decodeURIComponent(url.pathname);const direct=path.join('dist',pathname);if(fs.existsSync(direct)&&fs.statSync(direct).isFile())return direct;const index=path.join(direct,'index.html');return fs.existsSync(index)?index:null;}
for(const file of htmlFiles){const relative=path.relative('dist',file).replaceAll('\\','/'),route='/'+relative.replace(/index\.html$/,'');const html=fs.readFileSync(file,'utf8');
 for(const match of html.matchAll(/<(a|link|img|script|source)\b[^>]*?\s(href|src)="([^"]*)"[^>]*>/g)){
  const [,tag,attribute,raw]=match,value=decode(raw);if(!value||value==='#'){if(tag==='a')placeholders.push({route,href:value});continue;}
  if(/^(?:mailto:|tel:|data:|javascript:)/i.test(value))continue;
  const url=new URL(value,siteConfig.url+route);if(url.origin!==siteConfig.url)continue;
  const target=targetFor(url);checked++;if(!target){issues.push({route,tag,attribute,href:value,problem:'missing generated target'});continue;}
  if(tag==='a'&&url.hash&&target.endsWith('.html')){const content=fs.readFileSync(target,'utf8'),id=decodeURIComponent(url.hash.slice(1));if(!content.includes(`id="${id}"`))issues.push({route,href:value,problem:`missing anchor ${id}`});}
 }
 for(const match of html.matchAll(/<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)"[^>]*content="([^"]+)"/g)){const value=decode(match[1]),url=new URL(value,siteConfig.url+route);if(url.origin===siteConfig.url){checked++;if(!targetFor(url))issues.push({route,href:value,problem:'missing social image'});}}
 for(const match of html.matchAll(/\ssrcset="([^"]+)"/g))for(const candidate of decode(match[1]).split(',')){const value=candidate.trim().split(/\s+/)[0];if(!value||value.startsWith('data:'))continue;const url=new URL(value,siteConfig.url+route);if(url.origin===siteConfig.url){checked++;if(!targetFor(url))issues.push({route,href:value,problem:'missing responsive image'});}}
}
for(const file of files.filter(file=>file.endsWith('.css'))){const route='/'+path.relative('dist',file).replaceAll('\\','/'),css=fs.readFileSync(file,'utf8');for(const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)){const value=match[1];if(value.startsWith('data:')||value.startsWith('#'))continue;const url=new URL(value,siteConfig.url+route);if(url.origin!==siteConfig.url)continue;checked++;if(!targetFor(url))issues.push({route,href:value,problem:'missing CSS asset'});}}
fs.mkdirSync('qa/final',{recursive:true});fs.writeFileSync('qa/final/links.json',JSON.stringify({pages:htmlFiles.length,checked,issues,placeholders},null,2)+'\n');
console.log(`Static link audit: ${htmlFiles.length} HTML pages, ${checked} local links/assets, ${issues.length} broken targets, ${placeholders.length} preserved placeholder links.`);
if(issues.length)console.log(JSON.stringify(issues.slice(0,20),null,2));
assert.equal(issues.length,0,'Broken local links/assets require review.');
