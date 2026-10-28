import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {htmlToHast} from 'satteri';
const file=new URL('../../src/content/places/en/giza-pyramids/index.md',import.meta.url);
const original=await readFile(file,'utf8'),origin='http://127.0.0.1:4327';
async function linkText(){const response=await fetch(origin+'/en/blog/common-tourist-traps-egypt/');assert.equal(response.status,200);const root=htmlToHast(await response.text());let found;function walk(n){if(n.tagName==='article'){function scan(node){if(node.tagName==='a'&&node.properties.href==='/en/egypt/giza-pyramids/')found=(node.children??[]).map(c=>c.value??'').join('');for(const child of node.children??[])scan(child);}scan(n);}else for(const child of n.children??[])walk(child);}walk(root);return found;}
async function until(predicate){const deadline=Date.now()+20000;while(Date.now()<deadline){const value=await linkText();if(predicate(value))return value;await new Promise(resolve=>setTimeout(resolve,350));}throw new Error('Guide-alias change did not invalidate the article within 20 seconds.');}
const before=await linkText();assert.equal(before,'Pyramids');let changed,restored;
try{
  const amended=original.replace('"Pyramids","Giza Pyramids"','"Pyramid landmarks","Giza Pyramids"');assert.notEqual(amended,original);
  await writeFile(file,amended);changed=await until(value=>value!=='Pyramids');
}finally{await writeFile(file,original);restored=await until(value=>value==='Pyramids');}
console.log('PASS: a guide alias edit rerenders its blog link; original source and working link restored.');
await writeFile(new URL('../../qa/blog/EDITORIAL_REFRESH.json',import.meta.url),JSON.stringify({origin,before,changed,restored},null,2)+'\n');
