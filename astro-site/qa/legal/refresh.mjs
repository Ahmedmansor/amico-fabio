import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {webkit}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const phase=process.env.QA_PHASE||'before',origin=process.env.QA_ORIGIN||'http://127.0.0.1:4347';
const baseline=phase==='after'?JSON.parse(await readFile('qa/legal/refresh-before.json','utf8')):null;
const shots=`qa/legal/screenshots/refresh-${phase}`;await mkdir(shots,{recursive:true});
const browser=await webkit.launch(),results=[];
try{
 for(const locale of ['it','en','es','pt','de'])for(const width of [390,1280])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390,reducedMotion:'reduce'});
  await context.addInitScript(theme=>localStorage.setItem('fabio_theme',theme),theme);
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(`${origin}/${locale}/legal/`,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const label=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);await page.getByRole('button',{name:label,exact:true}).first().click();
  await page.evaluate(()=>document.fonts.ready);
  const content=await page.locator('.legal-section').evaluateAll(ns=>ns.map(n=>({id:n.id,heading:n.querySelector('h2,h3').textContent.trim(),paragraphs:[...n.querySelectorAll('p,li')].map(x=>x.textContent.trim()),chips:[...n.querySelectorAll('.chip,.legal-data-chip')].map(x=>x.textContent.trim()),images:[...n.querySelectorAll('img')].map(x=>x.getAttribute('src'))})));
  if(phase==='after'){
   assert.deepEqual(content,baseline.results.find(r=>r.locale===locale&&r.width===width&&r.theme===theme).content);
   assert.equal(await page.locator('main h1').count(),1);assert.equal(await page.locator('.legal-section h2').count(),content.length);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const toc=width===390?page.locator('.legal-mobile-toc'):page.locator('.legal-sidebar');
   if(width===390)await toc.locator('summary').tap();
   const link=toc.locator('a').nth(3),hash=await link.getAttribute('href');await link.click();
   assert.equal(new URL(page.url()).hash,hash);assert(await page.locator(hash).isVisible());
   if(width===390)assert.equal(await toc.getAttribute('open'),null);
   await page.waitForFunction(hash=>{const r=document.querySelector(hash).getBoundingClientRect();return r.top>=60&&r.top<innerHeight-50;},hash);
   await page.evaluate(()=>scrollTo(0,0));
   const ratio=await page.locator('.legal-section p').first().evaluate(n=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');
    const lum=color=>{c.fillStyle=color;c.fillRect(0,0,1,1);const rgb=[...c.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);};
    const a=lum(getComputedStyle(n).color),b=lum(getComputedStyle(n.closest('.legal-section')).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   });assert(ratio>=4.5);
  }
  await page.screenshot({path:`${shots}/${locale}-${width}-${theme}.png`});
  if(locale==='en')await page.screenshot({path:`${shots}/${locale}-${width}-${theme}-full.png`,fullPage:true});
  assert.deepEqual(errors,[]);results.push({locale,width,theme,content,errors});console.log(`${phase} ${locale} ${width} ${theme}: PASS`);await context.close();
 }
}finally{await browser.close();}
await writeFile(`qa/legal/refresh-${phase}.json`,JSON.stringify({origin,results},null,2)+'\n');console.log(`${results.length} legal cases passed`);
