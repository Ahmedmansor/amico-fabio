import assert from 'node:assert/strict';
import {readFile, readdir, access, mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {supportedLocales} from '../../src/shared/config/languages.ts';
import {exploreLocations} from '../../src/features/explore/domain/explore.ts';

const dist=new URL('../../dist/',import.meta.url), results={metadataPages:0,packagePages:0,tourLinks:0,browser:[]};
for(const locale of supportedLocales){
  const titles=[],descriptions=[];
  for(const location of exploreLocations){
    const html=await readFile(new URL(`${locale}/explore/${location==='all'?'':location+'/'}index.html`,dist),'utf8');
    titles.push(html.match(/<title>(.*?)<\/title>/s)?.[1]);
    descriptions.push(html.match(/<meta name="description" content="([^"]+)"/)?.[1]);
    results.metadataPages++;
  }
  assert.ok(titles.every(Boolean)&&descriptions.every(Boolean));
  assert.equal(new Set(titles).size,exploreLocations.length);
  assert.equal(new Set(descriptions).size,exploreLocations.length);
  for(const slug of await readdir(new URL(`${locale}/packages/`,dist))){
    const html=await readFile(new URL(`${locale}/packages/${slug}/index.html`,dist),'utf8');
    const links=[...html.matchAll(/<a\b[^>]*class="included-trip-page-link[^>]*href="([^"]+)"/g)];
    const openers=[...html.matchAll(/<button\b[^>]*data-trip-id=/g)];
    assert.equal(links.length,openers.length,`${locale}/${slug}: each modal card has a page link`);
    for(const [,href] of links){assert.ok(href.startsWith(`/${locale}/tours/`));await access(new URL(href.slice(1)+'index.html',dist));results.tourLinks++;}
    results.packagePages++;
  }
}
if(process.env.PLAYWRIGHT_MODULE){
  const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
  const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4334';
  await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
  try{for(const locale of ['it','en'])for(const width of [375,1280]){
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();
    await page.goto(`${origin}/${locale}/packages/il_grande_blu/`);
    const config=page.locator('#cookie-consent-config');
    if(await config.count()){
      const label=await config.evaluate(n=>JSON.parse(n.textContent).messages.reject);
      const reject=page.getByRole('button',{name:label,exact:true}).first();
      await reject.waitFor({state:'visible',timeout:5000});
      if(await reject.isVisible())await reject.click();
      await reject.waitFor({state:'hidden'});
    }
    const link=page.locator('#included-trips-grid .included-trip-page-link').first();
    await link.scrollIntoViewIfNeeded();
    assert.ok(await link.isVisible());
    assert.ok(await link.evaluate(n=>n.getBoundingClientRect().height>=44));
    await page.screenshot({path:new URL(`./screenshots/${locale}-${width}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.locator('#included-trips-grid [data-trip-id]').first().click();
    await page.waitForFunction(()=>document.getElementById('included-trip-modal').open);
    await page.locator('#included-trip-modal-close').click();
    // The dialog's native close event restores focus to its opener asynchronously.
    await page.waitForFunction(()=>!document.getElementById('included-trip-modal').open&&document.activeElement?.hasAttribute('data-trip-id'));
    await link.focus();assert.equal(await link.evaluate(n=>document.activeElement===n),true);
    const href=await link.getAttribute('href');await link.press('Enter');await page.waitForURL(origin+href);
    assert.equal(await page.locator('h1').count(),1);
    results.browser.push({locale,width,modal:true,keyboardNavigation:href});
    await context.close();
  }}finally{await browser.close();}
}
await writeFile(new URL('./catalog-discovery-results.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
