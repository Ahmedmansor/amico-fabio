import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
const results=[];
async function visit(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
  const path=`${folder}/${entry.name}`;if(entry.isDirectory()){await visit(path);continue;}
  if(!path.endsWith('.html'))continue;
  const html=await readFile(path,'utf8');if(/http-equiv="refresh"/.test(html))continue;
  const footer=html.search(/<footer\b[^>]*(?:id="global-footer"|class="osh-footer-simple")/);if(footer<0)continue;
  const banners=html.match(/data-whatsapp-channel(?:\s|>)/g)||[];
  assert.equal(banners.length,1,`${path}: one banner per page with footer`);
  assert.ok(html.indexOf('data-whatsapp-channel')<footer,`${path}: banner must precede footer`);
  const section=html.match(/<section\b[^>]*data-whatsapp-channel[\s\S]*?<\/section>/)?.[0];
  assert.ok(section,`${path}: missing banner`);
  assert.ok(section.includes('data-channel-state="coming-soon"'));
  assert.ok(/<button\b[^>]*disabled/.test(section));
  assert.ok(section.includes('Fabio Egypt'));
  assert.ok(!section.includes('href="#'));
  assert.ok(!/Memphis|ISO 9001|10K\+|verified/i.test(section));
  results.push({route:path.replace(/^dist/,'').replace(/index\.html$/,''),state:'coming-soon'});
}}
await visit('dist');assert.ok(results.length>100,'Expected sitewide footer coverage');
assert.ok(results.some(item=>item.route==='/welcome/'));assert.ok(results.some(item=>item.route==='/offerta-sharm/'));
await writeFile('qa/footer/channel-coverage.json',JSON.stringify({pages:results.length,results},null,2)+'\n');
console.log(`WhatsApp channel verified on ${results.length} footer pages: once before footer, Fabio Egypt branding, disabled coming-soon action, no placeholder href or borrowed brand claims; both campaigns included.`);
