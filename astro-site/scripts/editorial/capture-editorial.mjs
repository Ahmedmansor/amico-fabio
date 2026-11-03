import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const [modulePath,executablePath]=process.argv.slice(2);
const {chromium}=await import(pathToFileURL(modulePath).href),origin='http://127.0.0.1:4327';
const browser=await chromium.launch({headless:true,executablePath}),results=[];
const output=new URL('../../qa/blog/screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const cases=[
  ...[375,1280].flatMap(width=>[
    [width,'/en/blog/common-tourist-traps-egypt/'],[width,'/it/blog/dizionario-arabo-egiziano-viaggio/'],
    [width,'/en/egypt/giza-pyramids/'],[width,'/it/egypt/luxor/'],
  ]),[768,'/en/blog/nile-cruise-vs-dahabiya/'],[768,'/it/blog/cosa-mangiare-egitto/'],
];
try{
 for(const[width,route]of cases){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(response.status(),200,route);
  const rejectLabel=await page.locator('#cookie-consent-config').evaluate(node=>JSON.parse(node.textContent).messages.reject);
  const reject=page.getByRole('button',{name:rejectLabel,exact:true});if(await reject.count())await reject.first().click();
  await page.evaluate(async()=>{await document.fonts.ready;for(let y=0;y<document.body.scrollHeight;y+=650){scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,30));}});
  await page.waitForFunction(()=>[...document.querySelectorAll('main img')].every(image=>image.complete&&image.naturalWidth>0));
  const facts=await page.evaluate(()=>{
    const prose=document.querySelector('article.blog-prose'),links=[...document.querySelectorAll('[data-editorial-toc] a')];
    const image=prose.querySelector('figure');
    return {h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,
      toc:links.map(link=>({href:link.getAttribute('href'),exists:!!document.getElementById(link.hash.slice(1)),text:link.textContent})),
      inlineCtas:prose.querySelectorAll('.blog-cta-compact').length,afterFirstBodyImage:image?.nextElementSibling?.classList.contains('blog-cta-compact'),
      contactCards:document.querySelectorAll('main .blog-cta').length,faq:document.querySelectorAll('.editorial-faq details').length,
      unresolved:[...document.querySelectorAll('a[href]')].some(a=>/^(post|place|tour|package):/.test(a.getAttribute('href'))),
      products:[...document.querySelectorAll('[data-editorial-product]')].map(a=>a.getAttribute('href')),
      relatedPosts:[...document.querySelectorAll('article a[href*="/blog/"]')].map(a=>a.getAttribute('href')),
    };
  });
  assert.equal(facts.h1,1);assert.equal(facts.overflow,false,route);assert.ok(facts.toc.length>0);assert.ok(facts.toc.every(item=>item.exists));assert.ok(facts.toc.every(item=>!item.text.includes('Customize')&&!item.text.includes('Crea la tua')));
  assert.equal(facts.unresolved,false);assert.equal(facts.inlineCtas,1);assert.equal(facts.contactCards,1);assert.equal(facts.afterFirstBodyImage,true);
  if(route.includes('/egypt/'))assert.ok(facts.products.length>0);
  if(route.includes('common-tourist')){assert.equal(facts.faq,3);assert.ok(facts.relatedPosts.length>0);await page.locator('.editorial-faq summary').first().click();assert.equal(await page.locator('.editorial-faq details').first().getAttribute('open'),'');}
  if(route.includes('dizionario'))assert.equal(facts.faq,0);
  await page.locator('[data-editorial-toc] a').first().click();
  const anchor=await page.evaluate(()=>{const node=document.getElementById(decodeURIComponent(location.hash.slice(1)));return {top:node.getBoundingClientRect().top,header:document.querySelector('.blog-header').getBoundingClientRect().bottom};});
  assert.ok(anchor.top>=anchor.header-2,JSON.stringify(anchor));
  await page.evaluate(()=>scrollTo(0,0));
  const filename=`editorial-${route.replaceAll('/','-').replace(/^-|-$/g,'')}-${width}.png`;
  await page.screenshot({path:fileURLToPath(new URL(filename,output)),fullPage:true});
  assert.deepEqual(errors,[]);results.push({route,width,...facts,errors,screenshot:`qa/blog/screenshots/${filename}`});await page.close();
 }
 const page=await browser.newPage();await page.goto(origin+'/en/blog/common-tourist-traps-egypt/',{waitUntil:'networkidle'});
 const[guide]=await Promise.all([page.waitForEvent('popup'),page.locator('article a[href="/en/egypt/giza-pyramids/"]').click()]);await guide.waitForLoadState('domcontentloaded');
 const[product]=await Promise.all([guide.waitForEvent('popup'),guide.locator('[data-editorial-product]').first().click()]);await product.waitForLoadState('domcontentloaded');
 assert.equal(await product.locator('h1').count(),1);const destination=new URL(product.url()).pathname;await product.close();await guide.close();await page.close();
 console.log(`PASS: ${results.length} editorial captures; reading anchors, optional FAQ, one second-image CTA, products and responsive layout.`);
 console.log(`PASS: actual article → place guide → existing product navigation (${destination}).`);
}finally{await browser.close();await writeFile(new URL('../../qa/blog/EDITORIAL_BROWSER.json',import.meta.url),JSON.stringify({origin,results},null,2)+'\n');}
