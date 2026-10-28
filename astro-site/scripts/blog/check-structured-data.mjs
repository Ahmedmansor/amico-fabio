import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { htmlToHast } from 'satteri';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Local Google-recommended field contract, not Google's rich-results service. */
export async function checkBlogStructuredData(directory) {
  let checked=0;
  function flatten(node) { return [node,...(node.children??[]).flatMap(flatten)]; }
  function text(node) { return node.type==='text'?node.value:(node.children??[]).map(text).join(''); }
  async function visit(folder) {
    for (const entry of await readdir(folder,{withFileTypes:true})) {
      const file = new URL(entry.name+(entry.isDirectory()?'/':''),folder);
      if(entry.isDirectory()){await visit(file);continue;}
      if(!entry.name.endsWith('.html'))continue;
      const nodes=flatten(htmlToHast(await readFile(file,'utf8')));
      if(!nodes.some(n=>n.tagName==='article' && n.properties.className?.includes('blog-prose')))continue;
      const json=nodes.filter(n=>n.tagName==='script'&&n.properties.type==='application/ld+json');
      assert.equal(json.length,1,`${file.pathname}: exactly one JSON-LD graph required`);
      const data=JSON.parse(text(json[0]));
      assert.equal(data['@context'],'https://schema.org');
      const article=data['@graph'].find(n=>n['@type']==='BlogPosting');
      const crumbs=data['@graph'].find(n=>n['@type']==='BreadcrumbList');
      const canonical=nodes.find(n=>n.tagName==='link'&&n.properties.rel?.includes('canonical')).properties.href;
      assert.equal(article.url,canonical);assert.equal(article.mainEntityOfPage['@id'],canonical);
      assert.equal(article.headline,text(nodes.find(n=>n.tagName==='h1')));
      assert.equal(article.description,nodes.find(n=>n.tagName==='meta'&&n.properties.name==='description').properties.content);
      assert.equal(article.inLanguage,nodes.find(n=>n.tagName==='html').properties.lang);
      assert.ok(['Person','Organization'].includes(article.author['@type'])&&article.author.name.trim());
      assert.ok(nodes.some(n=>n.type==='text'&&n.value.includes(article.author.name)));
      assert.ok(nodes.some(n=>n.tagName==='time'&&Date.parse(n.properties.dateTime)===Date.parse(article.datePublished)));
      assert.ok(Number.isFinite(Date.parse(article.datePublished)));
      if(article.dateModified)assert.ok(Date.parse(article.dateModified)>=Date.parse(article.datePublished));
      assert.ok(article.image.width>0&&article.image.height>0);
      await access(new URL('.'+new URL(article.image.url).pathname,directory));
      assert.ok(crumbs.itemListElement.length>=3);
      crumbs.itemListElement.forEach((item,index)=>{assert.equal(item['@type'],'ListItem');assert.equal(item.position,index+1);assert.ok(item.name.trim());assert.equal(new URL(item.item).protocol,'https:');});
      assert.equal(crumbs.itemListElement.at(-1).item,canonical);
      checked++;
    }
  }
  await visit(directory);return checked;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const count=await checkBlogStructuredData(new URL('../../dist/',import.meta.url));
  console.log(`PASS: Blog JSON-LD contract validator checked ${count} article graphs, visible metadata, dates, authors, local images and breadcrumbs.`);
}
