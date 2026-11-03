import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {supportedLocales} from '../src/shared/config/languages.ts';
import {siteConfig} from '../src/shared/config/site.ts';
import {catalogPlainText} from '../src/shared/domain/catalog-seo.ts';

const results=[];
for(const locale of supportedLocales)for(const kind of ['tours','packages']){
  const root=`dist/${locale}/${kind}`;
  const dictionary=JSON.parse(await readFile(`src/features/${kind}/data/content/${locale}.json`,'utf8'));
  for(const entry of await readdir(root,{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    const route=`/${locale}/${kind}/${entry.name}/`;
    const html=await readFile(`${root}/${entry.name}/index.html`,'utf8');
    const match=html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*data-catalog-schema[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(match,`${route}: missing catalog JSON-LD`);
    assert.ok(html.indexOf(match[0])<html.indexOf('</head>'),`${route}: graph must be in the document head`);
    const data=JSON.parse(match[1]),graph=data['@graph'];
    assert.equal(data['@context'],'https://schema.org');
    const page=graph.find(node=>node['@type']==='WebPage');
    const trip=graph.find(node=>node['@type']==='TouristTrip');
    const crumbs=graph.find(node=>node['@type']==='BreadcrumbList');
    const canonical=new URL(route,siteConfig.url).href;
    assert.equal(page.url,canonical);assert.equal(page.inLanguage,locale);
    assert.equal(trip.url,canonical);assert.equal(page.mainEntity['@id'],trip['@id']);
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
    assert.equal((html.match(/<h1\b/g)||[]).length,1,`${route}: exactly one heading`);
    const heading=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    assert.equal(trip.name,catalogPlainText(heading));
    const source=Object.values(dictionary).find(record=>catalogPlainText(record.title)===trip.name);
    assert.ok(source,`${route}: unknown localized name`);
    assert.equal(page.description,catalogPlainText(source.short_desc));
    assert.equal(trip.description,page.description);
    assert.equal(trip.offers.priceCurrency,'EUR');
    const displayedPrices=Array.from(html.matchAll(/data-price-eur="([^"]+)"/g),match=>Number(match[1]));
    assert.ok(displayedPrices.length>=2);assert.equal(trip.offers.price,displayedPrices[0]);
    assert.equal(trip.offers.price,displayedPrices[1]);
    assert.equal(trip.itinerary.numberOfItems,source.program.length);
    assert.deepEqual(trip.itinerary.itemListElement.map(step=>step.item.name),source.program.map(step=>catalogPlainText(step.activity)));
    assert.equal(crumbs.itemListElement.at(-1).item,canonical);
    for(const language of supportedLocales){
      const target=new URL(`/${language}/${kind}/${entry.name}/`,siteConfig.url).href;
      assert.ok(html.includes(`hreflang="${language}" href="${target}"`),`${route}: missing ${language} equivalent`);
    }
    for(const included of trip.subTrip||[]){
      const target=new URL(included.url);
      assert.ok(target.pathname.startsWith(`/${locale}/tours/`));
      await readFile(`dist${target.pathname}index.html`,'utf8');
      assert.ok(html.includes(included.name)||html.includes(included.name.replaceAll('&','&amp;')),`${route}: included tour absent from page`);
    }
    const image=new URL(trip.image.url);
    await readFile(`dist${image.pathname}`);
    assert.ok(trip.image.width>0&&trip.image.height>0);
    results.push({route,price:trip.offers.price,currency:'EUR',itinerarySteps:source.program.length,includedTrips:trip.subTrip?.length||0,
      noindex:/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html)});
  }
}
await mkdir('qa/seo',{recursive:true});
await writeFile('qa/seo/catalog-results.json',JSON.stringify({pages:results.length,results},null,2)+'\n');
console.log(`Catalog SEO verified: ${results.length} static pages; localized text, canonical/hreflang, one H1, JSON-LD, visible EUR prices, itineraries, included-tour targets and local share images match.`);
