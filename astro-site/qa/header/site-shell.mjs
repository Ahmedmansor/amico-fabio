// Visual/content comparison only. No Auth, email or remote-write tests.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [phase='after']=process.argv.slice(2);
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4331';
const output=new URL(`./screenshots/site-shell-${phase}/`,import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];
try {
 for(const locale of ['it','en']) for(const route of ['','blog/','tours/albatros_aqua_park_full_day/']) for(const width of [375,768,1280]) {
  const path=`/${locale}/${route}`,page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(origin+path,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const reject=page.locator('.cm__btn[data-role="necessary"]');if(await reject.isVisible())await reject.click();
  // CookieConsent's translated reject label comes from the existing config.
  const config=page.locator('#cookie-consent-config');
  if(await config.count()) {const label=await config.evaluate(n=>JSON.parse(n.textContent).messages.reject);const button=page.getByRole('button',{name:label,exact:true});if(await button.first().isVisible())await button.first().click();}
  const facts=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth>innerWidth,
   headers:document.querySelectorAll('header').length,footers:document.querySelectorAll('footer').length,
   heading:[...document.querySelectorAll('h1')].map(n=>n.textContent.trim()),
   content:[...document.querySelectorAll('h1,h2,h3,p')].filter(n=>!n.closest('header,footer,dialog,[role="dialog"]')).map(n=>n.textContent.trim()).filter(Boolean),
   links:[...document.querySelectorAll('a[href]')].filter(n=>!n.closest('header,footer')).map(n=>n.getAttribute('href')),
   headerHeight:document.querySelector('header')?.getBoundingClientRect().height,
  }));
  await page.screenshot({path:fileURLToPath(new URL(`${locale}-${route.replaceAll('/','-')||'home'}-${width}.png`,output))});
  await page.locator('footer').scrollIntoViewIfNeeded();await page.screenshot({path:fileURLToPath(new URL(`${locale}-${route.replaceAll('/','-')||'home'}-${width}-footer.png`,output))});
  results.push({path,width,status:response.status(),...facts,errors});await page.close();
 }
} finally {await browser.close();}
const report={origin,phase,results};
if(phase==='after') {
 const before=JSON.parse(await readFile(new URL('./site-shell-before.json',import.meta.url),'utf8'));
 report.comparison=results.map(row=>{const previous=before.results.find(x=>x.path===row.path&&x.width===row.width);return {path:row.path,width:row.width,contentPreserved:JSON.stringify(previous.content)===JSON.stringify(row.content),linksPreserved:previous.links.every(link=>row.links.includes(link)),overflow:row.overflow,errors:row.errors};});
}
await writeFile(new URL(`./site-shell-${phase}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({phase,pages:results.length,failures:results.filter(r=>r.status!==200||r.overflow||r.errors.length).map(({path,width,status,overflow,errors})=>({path,width,status,overflow,errors})),comparison:report.comparison},null,2));
