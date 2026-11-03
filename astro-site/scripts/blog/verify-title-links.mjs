import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
const [modulePath,executablePath]=process.argv.slice(2);
const {chromium}=await import(pathToFileURL(modulePath).href);
const browser=await chromium.launch({headless:true,executablePath});
const origin='http://127.0.0.1:4327',results=[];
const output=new URL('../../qa/blog/screenshots/',import.meta.url);
await mkdir(output,{recursive:true});
try {
  for(const [lang,slug,targets] of [
    ['en','fixture-diving-guide',['fixture-cairo-guide','fixture-sea-overview']],
    ['it','fixture-guida-mare',['fixture-guida-cairo','fixture-panoramica-mare']],
  ]) {
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    assert.equal((await page.goto(`${origin}/${lang}/blog/${slug}/`,{waitUntil:'networkidle'})).status(),200);
    const rejectLabel=await page.locator('#cookie-consent-config').evaluate(node=>JSON.parse(node.textContent).messages.reject);
    const reject=page.getByRole('button',{name:rejectLabel,exact:true});
    if(await reject.count())await reject.first().click();
    const links=await page.locator('.blog-prose a').evaluateAll(nodes=>nodes.filter(node=>node.getAttribute('href')?.startsWith('/')).map(node=>({text:node.textContent,href:node.getAttribute('href'),decoration:getComputedStyle(node).textDecorationLine,thickness:getComputedStyle(node).textDecorationThickness})));
    assert.deepEqual(links.map(link=>link.href),targets.map(target=>`/${lang}/blog/${target}/`));
    for(const link of links){assert.ok(link.text.startsWith('[FIXTURE]'));assert.equal(link.decoration,'underline');assert.equal(link.thickness,'2px');}
    const paragraph=page.locator('.blog-prose p').filter({has:page.locator(`a[href="/${lang}/blog/${targets[0]}/"]`)});
    await paragraph.scrollIntoViewIfNeeded();
    await paragraph.screenshot({path:fileURLToPath(new URL(`automatic-title-links-${lang}.png`,output))});
    const[destination]=await Promise.all([page.waitForEvent('popup'),paragraph.locator('a').first().click()]);
    await destination.waitForURL(`${origin}/${lang}/blog/${targets[0]}/`);
    assert.ok((await destination.locator('h1').textContent()).includes('[FIXTURE]'));
    results.push({lang,source:`/${lang}/blog/${slug}/`,links,navigatedTo:new URL(destination.url()).pathname});await destination.close();
    await page.close();
  }
  console.log('PASS: EN/IT diving articles show two automatically linked full titles, with visible underlines and working destination navigation.');
}finally{
  await browser.close();
  await writeFile(new URL('../../qa/blog/TITLE_LINKS.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');
}
