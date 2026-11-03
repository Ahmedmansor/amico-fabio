import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const results=[];
try{
 for(const locale of ['it','en'])for(const route of ['egypt/aswan/','egypt/','blog/nile-cruise-vs-dahabiya/'])for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const actualRoute=locale==='it'&&route.startsWith('blog/')?'blog/pianificare-viaggio-egitto-2027/':route;
  const path=`/${locale}/${actualRoute}`,response=await page.goto('http://127.0.0.1:4333'+path,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  const reject=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);
  const cookie=page.getByRole('button',{name:reject,exact:true});await cookie.first().waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await cookie.first().isVisible())await cookie.first().click();
  const widget=page.locator('#blog-inquiry'),form=widget.locator('form');
  const result={path,width,status:response.status(),widgets:await page.locator('.inquiry-widget').count(),destination:await form.locator('[name=destination]').inputValue()};
  result.afterProducts=await page.evaluate(()=>{const products=document.querySelector('.place-products'),widget=document.getElementById('blog-inquiry');return !products||Boolean(products.compareDocumentPosition(widget)&Node.DOCUMENT_POSITION_FOLLOWING);});
  if(width===375){
   await page.evaluate(()=>scrollTo(0,0));await page.locator('[data-form-mobile-bar] a').click();
   result.mobileReachesForm=await widget.evaluate(n=>{const r=n.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
   result.reducedMotion=await page.locator('[data-form-mobile-bar] svg').evaluate(n=>getComputedStyle(n).animationName==='none');
  }else{
   result.sticky=await widget.evaluate(n=>{const r=n.getBoundingClientRect();scrollTo(0,r.top+scrollY+250);const after=n.getBoundingClientRect(),parent=n.parentElement.getBoundingClientRect();return {position:getComputedStyle(n).position,top:after.top,bottom:after.bottom,withinViewport:after.bottom<=innerHeight+1,parentBottom:parent.bottom};});
  }
  await widget.scrollIntoViewIfNeeded();
  const name=`${locale}-${route.replaceAll('/','-')}${width}`;
  await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),animations:'disabled'});
  await form.locator('button[type=submit]').click();result.validation=await form.locator('[name=name]').getAttribute('aria-invalid')==='true';
  await form.locator('[name=name]').fill('Visual QA');
  await form.locator('[name=nationality]').selectOption({index:1});
  const date=new Date(Date.now()+7*86400000).toISOString().slice(0,10);await form.locator('[name=date]').fill(date);
  await form.locator('button[type=submit]').click();
  result.review=await widget.locator('[data-inquiry-review]').isVisible();
  await widget.locator('[data-inquiry-edit]').click();result.edit=await form.isVisible();
  result.draftSynced=await page.locator('.blog-inquiry-dialog [name=name]').inputValue()==='Visual QA';
  result.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  result.errors=errors;results.push(result);await page.close();
 }
}finally{await browser.close();}
await writeFile(new URL('./review.json',import.meta.url),JSON.stringify({results},null,2)+'\n');
const failures=results.filter(r=>r.status!==200||r.widgets!==1||!r.afterProducts||!r.validation||!r.review||!r.edit||!r.draftSynced||r.overflow||r.errors.length||(r.width===375&&(!r.mobileReachesForm||!r.reducedMotion))||(r.width===1280&&(r.sticky.position!=='sticky'||!r.sticky.withinViewport))||(r.path.includes('/aswan/')&&r.destination!=='aswan'));
console.log(JSON.stringify({cases:results.length,failures},null,2));if(failures.length)process.exitCode=1;
