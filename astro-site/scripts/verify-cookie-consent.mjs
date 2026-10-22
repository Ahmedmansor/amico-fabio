import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dictionaries=Object.fromEntries(['it','en'].map(locale=>[locale,JSON.parse(fs.readFileSync(`src/shared/i18n/dictionaries/${locale}.json`,'utf8')).cookies]));
assert.deepEqual(Object.keys(dictionaries.it).sort(),Object.keys(dictionaries.en).sort());
let pages=0;
function scan(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    if(entry.isDirectory()){scan(file);continue;}
    if(!file.endsWith('.html'))continue;
    const html=fs.readFileSync(file,'utf8');
    if(/http-equiv="refresh"/i.test(html))continue;
    const language=html.match(/<html[^>]*lang="([^"]+)"/)?.[1];
    assert.ok(dictionaries[language],`${file}: unsupported language`);
    const json=html.match(/<script[^>]*id="cookie-consent-config"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(json,`${file}: missing consent configuration`);
    const config=JSON.parse(json);
    assert.equal(config.locale,language,`${file}: wrong consent language`);
    assert.deepEqual(config.messages,dictionaries[language],`${file}: wrong localized consent messages`);
    assert.match(html,/data-cc="show-preferencesModal"/,`${file}: missing preference control`);
    assert.doesNotMatch(html,/<script[^>]*src="https:\/\/www\.googletagmanager\.com/,`${file}: Google loads before consent`);
    pages++;
  }
}
scan('dist');
assert.ok(pages>=88,'Expected the full generated catalog and campaigns');
console.log(`Cookie consent: ${pages} static pages use their page-language dictionary, provide preferences, and contain no eager Google script.`);
